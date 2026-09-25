/**
 * FreshMart Production PostgreSQL Database Adapter
 * Single Source of Truth for all persistent FreshMart data.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadLocalEnvFiles() {
  const envFiles = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.production.local'),
    path.join(__dirname, '..', '..', '.env.local'),
    path.join(__dirname, '..', '..', '.env'),
    path.join(__dirname, '..', '..', '.env.production.local')
  ];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      try {
        const content = fs.readFileSync(f, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const idx = trimmed.indexOf('=');
          if (idx > 0) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            const isPlaceholder = !val || val === '[SENSITIVE]' || val.includes('@HOST') || val.includes('USERNAME:PASSWORD') || val.includes('example.com');
            if (!isPlaceholder) {
              if (!process.env[key] || process.env[key] === '[SENSITIVE]' || process.env[key].includes('@HOST') || process.env[key].includes('USERNAME:PASSWORD')) {
                process.env[key] = val;
              }
            }
          }
        });
      } catch (e) {}
    }
  }
}
try { loadLocalEnvFiles(); } catch (e) {}

class PostgresAdapter {
  constructor(connectionString) {
    try { loadLocalEnvFiles(); } catch(e) {}
    const candidateUrls = [
      connectionString,
      process.env.DATABASE_URL,
      process.env.POSTGRES_URL,
      process.env.POSTGRES_URL_NON_POOLING,
      process.env.POSTGRES_DATABASE_URL,
      process.env.POSTGRES_PRISMA_URL,
      process.env.STORAGE_URL,
      process.env.NEON_DATABASE_URL,
      process.env.SUPABASE_DB_URL
    ].filter(Boolean);

    // Pick the first non-placeholder PostgreSQL connection string
    let resolved = null;
    for (const url of candidateUrls) {
      const str = String(url).trim();
      const isPh = str.includes('@HOST') || str.includes('@<host>') || str.includes('HOST:') || str.includes('<host>') || str.includes('PLACEHOLDER') || str.includes('example.com');
      if (!isPh && (str.startsWith('postgres://') || str.startsWith('postgresql://'))) {
        resolved = str;
        break;
      }
    }

    this.connectionString = resolved || candidateUrls[0] || null;
    this.pool = null;
    this.isInitialized = false;
    this._initPromise = null;
  }

  isPlaceholder() {
    if (!this.connectionString) return false;
    const str = String(this.connectionString).trim();
    return str.includes('@HOST') || str.includes('@<host>') || str.includes('HOST:') || str.includes('<host>') || str.includes('PLACEHOLDER') || str.includes('example.com');
  }

  isAvailable() {
    if (!this.connectionString || this.isPlaceholder()) return false;
    const str = String(this.connectionString).trim();
    return Boolean(str.startsWith('postgres://') || str.startsWith('postgresql://'));
  }

  getPool() {
    if (!this.pool && this.connectionString) {
      let cleanUrl = this.connectionString;
      try {
        const u = new URL(cleanUrl);
        u.searchParams.delete('pgbouncer');
        u.searchParams.delete('schema');
        cleanUrl = u.toString();
      } catch (e) {}

      const sslConfig = (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1'))
        ? false
        : { rejectUnauthorized: false };

      this.pool = new Pool({
        connectionString: cleanUrl,
        ssl: sslConfig,
        max: Number(process.env.DATABASE_POOL_MAX || 3),
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000
      });

      this.pool.on('error', (err) => {
        console.error('PostgreSQL Pool Error:', err.message);
      });
    }
    return this.pool;
  }

  async init(seedData = null) {
    if (this.isInitialized) return true;
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      if (!this.isAvailable()) return false;
      const pool = this.getPool();
      if (!pool) return false;

      try {
        // Fast ping to verify connection without heavy DDL transaction locks
        await pool.query('SELECT 1');
        await this.ensureOrdersSchema();
        await this.ensureReviewsSchema();
        await this.ensureProductsAndInventorySchema();
        await this.ensureCategoriesSchema();
        this.isInitialized = true;

        return true;
      } catch (err) {
        console.error('PostgreSQL Initialization Error:', err.message);
        this._initPromise = null;
        throw err;
      }
    })();

    return this._initPromise;
  }

  async ensureOrdersSchema() {
    try {
      const pool = this.getPool();
      if (!pool) return;

      // 1. Create table if not exists with all dedicated columns
      await pool.query(`
        CREATE TABLE IF NOT EXISTS freshmart_orders (
          id VARCHAR(255) PRIMARY KEY,
          order_id VARCHAR(255),
          customer_id VARCHAR(255),
          user_id VARCHAR(255),
          customer_name VARCHAR(255),
          customer_phone VARCHAR(255),
          items JSONB,
          subtotal NUMERIC(10,2) DEFAULT 0,
          delivery_fee NUMERIC(10,2) DEFAULT 0,
          discount NUMERIC(10,2) DEFAULT 0,
          final_total NUMERIC(10,2) DEFAULT 0,
          delivery_address JSONB,
          payment_method VARCHAR(100) DEFAULT 'UPI',
          payment_status VARCHAR(50) DEFAULT 'PENDING',
          order_status VARCHAR(50) DEFAULT 'ORDER_PLACED',
          status VARCHAR(50) DEFAULT 'ORDER_PLACED',
          delivery_partner_id VARCHAR(255),
          delivery_partner_name VARCHAR(255),
          delivery_boy_id VARCHAR(255),
          delivery_boy_name VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          confirmed_at TIMESTAMPTZ,
          packed_at TIMESTAMPTZ,
          out_for_delivery_at TIMESTAMPTZ,
          delivered_at TIMESTAMPTZ,
          cancelled_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
      `);

      // 2. Safely add any missing columns if table already existed
      const columnsToAdd = [
        'order_id VARCHAR(255)',
        'customer_id VARCHAR(255)',
        'user_id VARCHAR(255)',
        'customer_name VARCHAR(255)',
        'customer_phone VARCHAR(255)',
        'items JSONB',
        'subtotal NUMERIC(10,2) DEFAULT 0',
        'delivery_fee NUMERIC(10,2) DEFAULT 0',
        'discount NUMERIC(10,2) DEFAULT 0',
        'final_total NUMERIC(10,2) DEFAULT 0',
        'delivery_address JSONB',
        'payment_method VARCHAR(100) DEFAULT \'UPI\'',
        'payment_status VARCHAR(50) DEFAULT \'PENDING\'',
        'order_status VARCHAR(50) DEFAULT \'ORDER_PLACED\'',
        'status VARCHAR(50) DEFAULT \'ORDER_PLACED\'',
        'delivery_partner_id VARCHAR(255)',
        'delivery_partner_name VARCHAR(255)',
        'delivery_boy_id VARCHAR(255)',
        'delivery_boy_name VARCHAR(255)',
        'created_at TIMESTAMPTZ DEFAULT NOW()',
        'confirmed_at TIMESTAMPTZ',
        'packed_at TIMESTAMPTZ',
        'out_for_delivery_at TIMESTAMPTZ',
        'delivered_at TIMESTAMPTZ',
        'cancelled_at TIMESTAMPTZ',
        'updated_at TIMESTAMPTZ DEFAULT NOW()',
        'data JSONB NOT NULL DEFAULT \'{}\'::jsonb'
      ];

      for (const col of columnsToAdd) {
        try {
          await pool.query(`ALTER TABLE freshmart_orders ADD COLUMN IF NOT EXISTS ${col}`);
        } catch (e) {
          // ignore already existing or syntax variants
        }
      }

      // 3. Backfill any existing NULL fields from JSON data column without overwriting populated values
      await pool.query(`
        UPDATE freshmart_orders SET
          order_id = COALESCE(order_id, data->>'orderId', data->>'id', id),
          customer_id = COALESCE(customer_id, data->>'customerId', data->>'userId', user_id),
          customer_name = COALESCE(customer_name, data->>'customerName', data->'deliveryAddress'->>'fullName', data->'deliveryAddress'->>'name'),
          customer_phone = COALESCE(customer_phone, data->>'customerPhone', data->'deliveryAddress'->>'phone'),
          items = COALESCE(items, data->'items'),
          subtotal = COALESCE(subtotal, NULLIF(data->>'subtotal', '')::numeric, 0),
          delivery_fee = COALESCE(delivery_fee, NULLIF(data->>'deliveryFee', '')::numeric, NULLIF(data->>'deliveryCharge', '')::numeric, 0),
          discount = COALESCE(discount, NULLIF(data->>'discount', '')::numeric, NULLIF(data->>'couponDiscount', '')::numeric, 0),
          final_total = COALESCE(final_total, NULLIF(data->>'totalAmount', '')::numeric, NULLIF(data->>'finalTotal', '')::numeric, NULLIF(data->>'total', '')::numeric, 0),
          delivery_address = COALESCE(delivery_address, data->'deliveryAddress', data->'shippingAddress'),
          payment_method = COALESCE(payment_method, data->>'paymentMethod', 'UPI'),
          payment_status = COALESCE(payment_status, data->>'paymentStatus', 'PENDING'),
          order_status = COALESCE(order_status, data->>'orderStatus', data->>'status', status, 'ORDER_PLACED'),
          status = COALESCE(status, data->>'status', data->>'orderStatus', order_status, 'ORDER_PLACED'),
          delivery_partner_id = COALESCE(delivery_partner_id, data->>'deliveryPartnerId', data->>'deliveryBoyId', delivery_boy_id),
          delivery_partner_name = COALESCE(delivery_partner_name, data->>'deliveryPartnerName', data->>'deliveryBoyName', delivery_boy_name),
          delivery_boy_id = COALESCE(delivery_boy_id, data->>'deliveryBoyId', data->>'deliveryPartnerId', delivery_partner_id),
          delivery_boy_name = COALESCE(delivery_boy_name, data->>'deliveryBoyName', data->>'deliveryPartnerName', delivery_partner_name),
          created_at = COALESCE(created_at, NULLIF(data->>'createdAt', '')::timestamptz, NOW()),
          confirmed_at = COALESCE(confirmed_at, NULLIF(data->>'confirmedAt', '')::timestamptz),
          packed_at = COALESCE(packed_at, NULLIF(data->>'packedAt', '')::timestamptz, NULLIF(data->>'packingAt', '')::timestamptz),
          out_for_delivery_at = COALESCE(out_for_delivery_at, NULLIF(data->>'outForDeliveryAt', '')::timestamptz)
        WHERE data IS NOT NULL;
      `);

      // 4. Clean up any legacy seed/demo orders so only real orders exist
      try {
        await pool.query(`
          DELETE FROM freshmart_orders 
          WHERE id IN ('SJH10248', 'SJH10249', 'SJH10250', 'SJH10251')
             OR order_id IN ('SJH10248', 'SJH10249', 'SJH10250', 'SJH10251')
             OR (customer_name = 'Rahul Sharma' AND (data->>'hubId' = 'hub_blr_indiranagar'));
        `);
      } catch (e) {}

      // 5. Ensure database-backed atomic sequence for customer-facing sequential Order IDs: FM-OD-00001, FM-OD-00002...
      try {
        await pool.query(`CREATE SEQUENCE IF NOT EXISTS freshmart_order_id_seq START WITH 1 INCREMENT BY 1;`);
      } catch (seqInitErr) {
        console.warn('PostgreSQL order sequence setup warning:', seqInitErr.message);
      }
    } catch (err) {
      console.warn('ensureOrdersSchema warning:', err.message);
    }
  }

  async ensureReviewsSchema() {
    try {
      const pool = this.getPool();
      if (!pool) return;

      await pool.query(`
        CREATE TABLE IF NOT EXISTS freshmart_reviews (
          id VARCHAR(255) PRIMARY KEY,
          review_id VARCHAR(255),
          order_id VARCHAR(255) UNIQUE NOT NULL,
          customer_id VARCHAR(255) NOT NULL,
          customer_name VARCHAR(255),
          customer_phone VARCHAR(255),
          customer_email VARCHAR(255),
          delivery_partner_id VARCHAR(255),
          delivery_partner_name VARCHAR(255),
          store_rating INT NOT NULL CHECK (store_rating >= 1 AND store_rating <= 5),
          rider_rating INT NOT NULL CHECK (rider_rating >= 1 AND rider_rating <= 5),
          comment TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
      `);

      // Ensure dedicated columns exist if table was already created
      const reviewCols = [
        'review_id VARCHAR(255)',
        'order_id VARCHAR(255)',
        'customer_id VARCHAR(255)',
        'customer_name VARCHAR(255)',
        'customer_phone VARCHAR(255)',
        'customer_email VARCHAR(255)',
        'delivery_partner_id VARCHAR(255)',
        'delivery_partner_name VARCHAR(255)',
        'store_rating INT DEFAULT 5',
        'rider_rating INT DEFAULT 5',
        'comment TEXT',
        'created_at TIMESTAMPTZ DEFAULT NOW()',
        'updated_at TIMESTAMPTZ DEFAULT NOW()',
        'data JSONB NOT NULL DEFAULT \'{}\'::jsonb'
      ];
      for (const col of reviewCols) {
        try {
          await pool.query(`ALTER TABLE freshmart_reviews ADD COLUMN IF NOT EXISTS ${col}`);
        } catch (e) {}
      }

      // Ensure Unique constraint on order_id
      try {
        await pool.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_freshmart_reviews_order_id ON freshmart_reviews (order_id);
        `);
      } catch (e) {}
    } catch (err) {
      console.warn('ensureReviewsSchema warning:', err.message);
    }
  }

  async ensureProductsAndInventorySchema() {
    try {
      const pool = this.getPool();
      if (!pool) return;

      await pool.query(`
        CREATE TABLE IF NOT EXISTS freshmart_products (
          id VARCHAR(255) PRIMARY KEY,
          storefront_id VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          sku VARCHAR(255),
          category VARCHAR(255),
          subcategory VARCHAR(255),
          price NUMERIC DEFAULT 0,
          selling_price NUMERIC DEFAULT 0,
          mrp NUMERIC DEFAULT 0,
          cost_price NUMERIC DEFAULT 0,
          stock NUMERIC DEFAULT 0,
          damaged_stock NUMERIC DEFAULT 0,
          expired_stock NUMERIC DEFAULT 0,
          low_stock_limit NUMERIC DEFAULT 15,
          unit VARCHAR(50) DEFAULT '1 kg',
          status VARCHAR(50) DEFAULT 'ACTIVE',
          image TEXT,
          description TEXT,
          farmer VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
      `);

      const productCols = [
        'storefront_id VARCHAR(255)',
        'sku VARCHAR(255)',
        'subcategory VARCHAR(255)',
        'cost_price NUMERIC DEFAULT 0',
        'damaged_stock NUMERIC DEFAULT 0',
        'expired_stock NUMERIC DEFAULT 0',
        'manual_reserved_stock NUMERIC DEFAULT 0',
        'low_stock_limit NUMERIC DEFAULT 15',
        'unit VARCHAR(50) DEFAULT \'1 kg\'',
        'image TEXT',
        'description TEXT',
        'farmer VARCHAR(255)',
        'created_at TIMESTAMPTZ DEFAULT NOW()',
        'updated_at TIMESTAMPTZ DEFAULT NOW()'
      ];
      for (const col of productCols) {
        try {
          await pool.query(`ALTER TABLE freshmart_products ADD COLUMN IF NOT EXISTS ${col}`);
        } catch (e) {}
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS freshmart_inventory_movements (
          id VARCHAR(255) PRIMARY KEY,
          product_id VARCHAR(255) NOT NULL,
          sku VARCHAR(255),
          type VARCHAR(50) DEFAULT 'ADJUSTMENT',
          quantity NUMERIC NOT NULL,
          previous_stock NUMERIC DEFAULT 0,
          new_stock NUMERIC DEFAULT 0,
          reason TEXT,
          operator VARCHAR(255),
          reference_id VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
      `);

      try {
        await pool.query(`ALTER TABLE freshmart_inventory_movements ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255);`);
      } catch (e) {}

      try {
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_freshmart_products_cat ON freshmart_products (category);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_freshmart_products_status ON freshmart_products (status);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_freshmart_inv_mov_prod ON freshmart_inventory_movements (product_id);`);
      } catch (e) {}
    } catch (err) {
      console.warn('ensureProductsAndInventorySchema warning:', err.message);
    }
  }

  async ensureCategoriesSchema() {
    try {
      const pool = this.getPool();
      if (!pool) return;

      await pool.query(`
        CREATE TABLE IF NOT EXISTS freshmart_categories (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          icon VARCHAR(100),
          image TEXT,
          description TEXT,
          display_order INT DEFAULT 0,
          status VARCHAR(50) DEFAULT 'ACTIVE',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
      `);

      const catCols = [
        'icon VARCHAR(100)',
        'image TEXT',
        'description TEXT',
        'display_order INT DEFAULT 0',
        'status VARCHAR(50) DEFAULT \'ACTIVE\'',
        'created_at TIMESTAMPTZ DEFAULT NOW()',
        'updated_at TIMESTAMPTZ DEFAULT NOW()',
        'data JSONB NOT NULL DEFAULT \'{}\'::jsonb'
      ];
      for (const col of catCols) {
        try {
          await pool.query(`ALTER TABLE freshmart_categories ADD COLUMN IF NOT EXISTS ${col}`);
        } catch (e) {}
      }

      // Check if categories exist; if empty, seed baseline categories
      const countRes = await pool.query('SELECT COUNT(*) FROM freshmart_categories');
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        const baseline = [
          { id: 'cat_vegetables', name: 'Fresh Vegetables', slug: 'vegetables', icon: '🥬', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=600&q=80', description: 'Crisp leafy greens, roots, organic vegetables & daily staples', display_order: 1, status: 'ACTIVE' },
          { id: 'cat_fruits', name: 'Farm-Fresh Fruits', slug: 'fruits', icon: '🍎', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80', description: 'Naturally ripened seasonal fruits, citrus, berries & melons', display_order: 2, status: 'ACTIVE' },
          { id: 'cat_grocery', name: 'Daily Groceries & Staples', slug: 'grocery', icon: '🌾', image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=600&q=80', description: 'Stone-ground atta, cold-pressed oils, unpolished pulses & kitchen essentials', display_order: 3, status: 'ACTIVE' },
          { id: 'cat_herbs', name: 'Leafy Greens & Herbs', slug: 'leafy-herbs', icon: '🌿', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', description: 'Freshly harvested cilantro, mint, spinach, curry leaves & microgreens', display_order: 4, status: 'ACTIVE' },
          { id: 'cat_dairy', name: 'Pure Dairy & Ghee', slug: 'dairy', icon: '🥛', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', description: 'Bilona cultured A2 ghee, paneer, and fresh dairy products', display_order: 5, status: 'ACTIVE' },
          { id: 'cat_honey', name: 'Natural Sweeteners & Honey', slug: 'sweeteners', icon: '🍯', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80', description: 'Raw forest honey, organic jaggery powder, and natural syrups', display_order: 6, status: 'ACTIVE' }
        ];

        for (const c of baseline) {
          await pool.query(`
            INSERT INTO freshmart_categories (id, name, slug, icon, image, description, display_order, status, data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              icon = EXCLUDED.icon,
              image = EXCLUDED.image,
              description = EXCLUDED.description,
              display_order = EXCLUDED.display_order,
              status = EXCLUDED.status;
          `, [c.id, c.name, c.slug, c.icon, c.image, c.description, c.display_order, c.status, JSON.stringify(c)]);
        }
      }
    } catch (err) {
      console.warn('ensureCategoriesSchema warning:', err.message);
    }
  }


  async _seedInitialData(client, seedData) {
    try {
      const prodCountRes = await client.query('SELECT COUNT(*) FROM freshmart_products');
      if (parseInt(prodCountRes.rows[0].count, 10) === 0 && Array.isArray(seedData.products)) {
        for (const p of seedData.products) {
          await client.query(`
            INSERT INTO freshmart_products (id, storefront_id, name, sku, category, price, selling_price, mrp, stock, status, data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
              storefront_id = EXCLUDED.storefront_id,
              name = EXCLUDED.name,
              sku = EXCLUDED.sku,
              category = EXCLUDED.category,
              price = EXCLUDED.price,
              selling_price = EXCLUDED.selling_price,
              mrp = EXCLUDED.mrp,
              stock = EXCLUDED.stock,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = NOW()
          `, [
            p.id, p.storefrontId || null, p.name, p.sku || null, p.category || null,
            p.price || p.sellingPrice || 0, p.sellingPrice || p.price || 0,
            p.mrp || p.originalPrice || 0, p.stock || 0, p.status || 'ACTIVE',
            JSON.stringify(p)
          ]);
        }
      }

      const userCountRes = await client.query('SELECT COUNT(*) FROM freshmart_users');
      if (parseInt(userCountRes.rows[0].count, 10) === 0 && Array.isArray(seedData.users)) {
        for (const u of seedData.users) {
          await client.query(`
            INSERT INTO freshmart_users (id, email, name, phone, role, status, password_hash, salt, data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              role = EXCLUDED.role,
              status = EXCLUDED.status,
              password_hash = EXCLUDED.password_hash,
              salt = EXCLUDED.salt,
              data = EXCLUDED.data,
              updated_at = NOW()
          `, [
            u.id, (u.email || '').toLowerCase(), u.name || 'User', u.phone || null,
            u.role || 'CUSTOMER', u.status || 'ACTIVE', u.passwordHash || null, u.salt || null,
            JSON.stringify(u)
          ]);
        }
      }

      const catCountRes = await client.query('SELECT COUNT(*) FROM freshmart_categories');
      if (parseInt(catCountRes.rows[0].count, 10) === 0 && Array.isArray(seedData.categories)) {
        for (const c of seedData.categories) {
          await client.query(`
            INSERT INTO freshmart_categories (id, name, slug, icon, status, data)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              icon = EXCLUDED.icon,
              status = EXCLUDED.status,
              data = EXCLUDED.data,
              updated_at = NOW()
          `, [c.id, c.name, c.slug || null, c.icon || null, c.status || 'ACTIVE', JSON.stringify(c)]);
        }
      }

      if (seedData.settings) {
        await client.query(`
          INSERT INTO freshmart_settings (key, value)
          VALUES ('global_settings', $1)
          ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
        `, [JSON.stringify(seedData.settings), JSON.stringify(seedData.settings)]);
      }
    } catch (e) {
      console.warn('PostgreSQL Seeding Warning:', e.message);
    }
  }

  // Generic Query Helper
  async query(text, params = []) {
    const pool = this.getPool();
    if (!pool) throw new Error('PostgreSQL Pool is not configured');
    return pool.query(text, params);
  }

  // Collection to Table Name mapping
  getTableName(collection) {
    const mapping = {
      users: 'freshmart_users',
      products: 'freshmart_products',
      categories: 'freshmart_categories',
      orders: 'freshmart_orders',
      delivery_partners: 'freshmart_delivery_partners',
      farmers: 'freshmart_farmers',
      hubs: 'freshmart_hubs',
      inventory_movements: 'freshmart_inventory_movements',
      audit_logs: 'freshmart_audit_logs',
      activity_logs: 'freshmart_audit_logs',
      reviews: 'freshmart_reviews'
    };
    return mapping[collection] || null;
  }

  async getAll(collection) {
    const table = this.getTableName(collection);
    if (table) {
      if (collection === 'audit_logs' || collection === 'activity_logs') {
        const res = await this.query(`SELECT data FROM ${table} ORDER BY timestamp DESC LIMIT 500`);
        return res.rows.map(r => r.data);
      }
      if (collection === 'reviews') {
        const res = await this.query(`SELECT data FROM ${table} ORDER BY created_at DESC`);
        return res.rows.map(r => r.data);
      }
      if (collection === 'orders') {
        const res = await this.query(`
          SELECT data FROM ${table} 
          WHERE id NOT IN ('SJH10248', 'SJH10249', 'SJH10250', 'SJH10251')
            AND (order_id IS NULL OR order_id NOT IN ('SJH10248', 'SJH10249', 'SJH10250', 'SJH10251'))
            AND (customer_name IS NULL OR customer_name != 'Rahul Sharma' OR customer_phone != '+91 98450 12345')
          ORDER BY created_at DESC
        `);
        return res.rows.map(r => r.data);
      }
      const res = await this.query(`SELECT data FROM ${table}`);
      return res.rows.map(r => r.data);
    }
    const res = await this.query('SELECT data FROM freshmart_kv WHERE collection = $1', [collection]);
    return res.rows.map(r => r.data);
  }

  async getById(collection, id) {
    if (!id) return null;
    const table = this.getTableName(collection);
    if (table) {
      if (collection === 'products') {
        const res = await this.query(`
          SELECT * FROM freshmart_products 
          WHERE id = $1 
             OR storefront_id = $1 
             OR sku = $1 
             OR LOWER(name) = LOWER($1)
          LIMIT 1
        `, [String(id)]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          const dataObj = typeof r.data === 'object' ? (r.data || {}) : JSON.parse(r.data || '{}');
          return {
            ...dataObj,
            id: r.id,
            storefrontId: r.storefront_id || dataObj.storefrontId || r.id,
            name: r.name,
            sku: r.sku || dataObj.sku,
            category: r.category || dataObj.category,
            subcategory: r.subcategory || dataObj.subcategory,
            price: Number(r.price || dataObj.price || 0),
            sellingPrice: Number(r.selling_price || dataObj.sellingPrice || r.price || 0),
            mrp: Number(r.mrp || dataObj.mrp || 0),
            costPrice: Number(r.cost_price || dataObj.costPrice || 0),
            stock: Number(r.stock !== null ? r.stock : dataObj.stock || 0),
            physicalStock: Number(r.stock !== null ? r.stock : dataObj.physicalStock || 0),
            manualReservedStock: Number(r.manual_reserved_stock || 0),
            status: r.status || dataObj.status || 'ACTIVE',
            image: r.image || dataObj.image,
            description: r.description || dataObj.description,
            unit: r.unit || dataObj.unit || '1 kg'
          };
        }
        return null;
      }
      const res = await this.query(`SELECT data FROM ${table} WHERE id = $1 LIMIT 1`, [String(id)]);
      if (res.rows.length > 0) return res.rows[0].data;

      // Fallback search in JSON data (e.g. storefrontId, sku, orderId)
      const res2 = await this.query(`
        SELECT data FROM ${table} 
        WHERE data->>'storefrontId' = $1 
           OR data->>'sku' = $1 
           OR data->>'orderId' = $1 
           OR LOWER(data->>'name') = LOWER($1) 
        LIMIT 1
      `, [String(id)]);
      if (res2.rows.length > 0) return res2.rows[0].data;
      return null;
    }
    const res = await this.query('SELECT data FROM freshmart_kv WHERE collection = $1 AND id = $2 LIMIT 1', [collection, String(id)]);
    return res.rows.length > 0 ? res.rows[0].data : null;
  }

  async insert(collection, item) {
    if (!item.id) {
      item.id = `${collection.slice(0, 4)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    const table = this.getTableName(collection);
    if (table) {
      if (collection === 'products') {
        await this.query(`
          INSERT INTO freshmart_products (id, storefront_id, name, sku, category, price, selling_price, mrp, stock, status, data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            storefront_id = EXCLUDED.storefront_id,
            name = EXCLUDED.name,
            sku = EXCLUDED.sku,
            category = EXCLUDED.category,
            price = EXCLUDED.price,
            selling_price = EXCLUDED.selling_price,
            mrp = EXCLUDED.mrp,
            stock = EXCLUDED.stock,
            status = EXCLUDED.status,
            data = EXCLUDED.data,
            updated_at = NOW()
        `, [
          item.id, item.storefrontId || null, item.name, item.sku || null, item.category || null,
          item.price || item.sellingPrice || 0, item.sellingPrice || item.price || 0,
          item.mrp || item.originalPrice || 0, item.stock || 0, item.status || 'ACTIVE',
          JSON.stringify(item)
        ]);
      } else if (collection === 'users') {
        await this.query(`
          INSERT INTO freshmart_users (id, email, name, phone, role, status, password_hash, salt, data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            status = EXCLUDED.status,
            password_hash = EXCLUDED.password_hash,
            salt = EXCLUDED.salt,
            data = EXCLUDED.data,
            updated_at = NOW()
        `, [
          item.id, (item.email || '').toLowerCase(), item.name || 'User', item.phone || null,
          item.role || 'CUSTOMER', item.status || 'ACTIVE', item.passwordHash || null, item.salt || null,
          JSON.stringify(item)
        ]);
      } else if (collection === 'orders') {
        const orderId = item.orderId || item.id;
        const customerId = item.customerId || item.userId || null;
        const userId = item.userId || item.customerId || null;
        const customerName = item.customerName || item.deliveryAddress?.fullName || item.deliveryAddress?.name || null;
        const customerPhone = item.customerPhone || item.deliveryAddress?.phone || null;
        const itemsJson = item.items ? JSON.stringify(item.items) : '[]';
        const subtotal = Number(item.subtotal ?? item.itemsPrice ?? 0);
        const deliveryFee = Number(item.deliveryFee ?? item.deliveryCharge ?? 0);
        const discount = Number(item.discount ?? item.couponDiscount ?? 0);
        const finalTotal = Number(item.finalTotal ?? item.totalAmount ?? item.total ?? 0);
        const deliveryAddressJson = item.deliveryAddress ? JSON.stringify(item.deliveryAddress) : '{}';
        const paymentMethod = item.paymentMethod || 'UPI';
        const paymentStatus = item.paymentStatus || 'PENDING';
        const orderStatus = item.orderStatus || item.status || 'ORDER_PLACED';
        const status = item.status || item.orderStatus || 'ORDER_PLACED';
        const deliveryPartnerId = item.deliveryPartnerId || item.deliveryBoyId || null;
        const deliveryPartnerName = item.deliveryPartnerName || item.deliveryBoyName || null;
        const deliveryBoyId = item.deliveryBoyId || item.deliveryPartnerId || null;
        const deliveryBoyName = item.deliveryBoyName || item.deliveryPartnerName || null;
        const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
        const confirmedAt = item.confirmedAt ? new Date(item.confirmedAt) : null;
        const packedAt = (item.packedAt || item.packingAt) ? new Date(item.packedAt || item.packingAt) : null;
        const outForDeliveryAt = item.outForDeliveryAt ? new Date(item.outForDeliveryAt) : null;
        const deliveredAt = item.deliveredAt ? new Date(item.deliveredAt) : null;
        const cancelledAt = item.cancelledAt ? new Date(item.cancelledAt) : null;

        await this.query(`
          INSERT INTO freshmart_orders (
            id, order_id, customer_id, user_id, customer_name, customer_phone,
            items, subtotal, delivery_fee, discount, final_total,
            delivery_address, payment_method, payment_status, order_status, status,
            delivery_partner_id, delivery_partner_name, delivery_boy_id, delivery_boy_name,
            created_at, confirmed_at, packed_at, out_for_delivery_at, delivered_at, cancelled_at,
            data
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26,
            $27
          )
          ON CONFLICT (id) DO UPDATE SET
            order_id = EXCLUDED.order_id,
            customer_id = EXCLUDED.customer_id,
            user_id = EXCLUDED.user_id,
            customer_name = EXCLUDED.customer_name,
            customer_phone = EXCLUDED.customer_phone,
            items = EXCLUDED.items,
            subtotal = EXCLUDED.subtotal,
            delivery_fee = EXCLUDED.delivery_fee,
            discount = EXCLUDED.discount,
            final_total = EXCLUDED.final_total,
            delivery_address = EXCLUDED.delivery_address,
            payment_method = EXCLUDED.payment_method,
            payment_status = EXCLUDED.payment_status,
            order_status = EXCLUDED.order_status,
            status = EXCLUDED.status,
            delivery_partner_id = EXCLUDED.delivery_partner_id,
            delivery_partner_name = EXCLUDED.delivery_partner_name,
            delivery_boy_id = EXCLUDED.delivery_boy_id,
            delivery_boy_name = EXCLUDED.delivery_boy_name,
            confirmed_at = COALESCE(EXCLUDED.confirmed_at, freshmart_orders.confirmed_at),
            packed_at = COALESCE(EXCLUDED.packed_at, freshmart_orders.packed_at),
            out_for_delivery_at = COALESCE(EXCLUDED.out_for_delivery_at, freshmart_orders.out_for_delivery_at),
            delivered_at = COALESCE(EXCLUDED.delivered_at, freshmart_orders.delivered_at),
            cancelled_at = COALESCE(EXCLUDED.cancelled_at, freshmart_orders.cancelled_at),
            data = EXCLUDED.data,
            updated_at = NOW()
        `, [
          item.id, orderId, customerId, userId, customerName, customerPhone,
          itemsJson, subtotal, deliveryFee, discount, finalTotal,
          deliveryAddressJson, paymentMethod, paymentStatus, orderStatus, status,
          deliveryPartnerId, deliveryPartnerName, deliveryBoyId, deliveryBoyName,
          createdAt, confirmedAt, packedAt, outForDeliveryAt, deliveredAt, cancelledAt,
          JSON.stringify(item)
        ]);
      } else if (collection === 'categories') {
        await this.query(`
          INSERT INTO freshmart_categories (id, name, slug, icon, status, data)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            icon = EXCLUDED.icon,
            status = EXCLUDED.status,
            data = EXCLUDED.data,
            updated_at = NOW()
        `, [item.id, item.name, item.slug || null, item.icon || null, item.status || 'ACTIVE', JSON.stringify(item)]);
      } else if (collection === 'delivery_partners') {
        await this.query(`
          INSERT INTO freshmart_delivery_partners (id, user_id, name, phone, status, current_order_id, data)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            status = EXCLUDED.status,
            current_order_id = EXCLUDED.current_order_id,
            data = EXCLUDED.data,
            updated_at = NOW()
        `, [
          item.id, item.userId || item.user_id || null, item.name || 'Rider', item.phone || null,
          item.status || 'AVAILABLE', item.currentOrderId || item.current_order_id || null, JSON.stringify(item)
        ]);
      } else if (collection === 'farmers') {
        await this.query(`
          INSERT INTO freshmart_farmers (id, name, location, status, data)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            location = EXCLUDED.location,
            status = EXCLUDED.status,
            data = EXCLUDED.data,
            updated_at = NOW()
        `, [item.id, item.name, item.location || null, item.status || 'ACTIVE', JSON.stringify(item)]);
      } else if (collection === 'hubs') {
        await this.query(`
          INSERT INTO freshmart_hubs (id, name, location, status, data)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            location = EXCLUDED.location,
            status = EXCLUDED.status,
            data = EXCLUDED.data,
            updated_at = NOW()
        `, [item.id, item.name, item.location || null, item.status || 'ONLINE', JSON.stringify(item)]);
      } else if (collection === 'inventory_movements') {
        await this.query(`
          INSERT INTO freshmart_inventory_movements (id, product_id, sku, type, quantity, previous_stock, new_stock, reason, operator, data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            product_id = EXCLUDED.product_id,
            sku = EXCLUDED.sku,
            type = EXCLUDED.type,
            quantity = EXCLUDED.quantity,
            previous_stock = EXCLUDED.previous_stock,
            new_stock = EXCLUDED.new_stock,
            reason = EXCLUDED.reason,
            operator = EXCLUDED.operator,
            data = EXCLUDED.data
        `, [
          item.id, item.productId || item.product_id || null, item.sku || null, item.type || 'ADJUSTMENT',
          Number(item.quantity || 0), Number(item.previousStock ?? item.previous_stock ?? item.before ?? 0),
          Number(item.newStock ?? item.new_stock ?? item.after ?? 0), item.reason || 'Inventory record',
          item.operator || item.user || 'System', JSON.stringify(item)
        ]);
      } else if (collection === 'audit_logs' || collection === 'activity_logs') {
        await this.query(`
          INSERT INTO freshmart_audit_logs (id, timestamp, operator_email, action, entity, entity_id, details, data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            operator_email = EXCLUDED.operator_email,
            action = EXCLUDED.action,
            entity = EXCLUDED.entity,
            entity_id = EXCLUDED.entity_id,
            details = EXCLUDED.details,
            data = EXCLUDED.data
        `, [
          item.id, item.timestamp || new Date().toISOString(), item.operatorEmail || item.operator_email || item.user || 'Owner',
          item.action || 'UPDATE', item.entity || 'General', item.entityId || item.entity_id || 'GLOBAL',
          typeof item.details === 'string' ? item.details : JSON.stringify(item.details || ''), JSON.stringify(item)
        ]);
      } else if (collection === 'reviews') {
        const reviewId = item.reviewId || item.id || `rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const orderId = item.orderId;
        const customerId = item.customerId || item.userId || 'usr_customer';
        const customerName = item.customerName || item.customer?.name || null;
        const customerPhone = item.customerPhone || item.customer?.phone || null;
        const customerEmail = item.customerEmail || item.customer?.email || null;
        const deliveryPartnerId = item.deliveryPartnerId || item.deliveryBoyId || null;
        const deliveryPartnerName = item.deliveryPartnerName || item.deliveryBoyName || null;
        const storeRating = Math.max(1, Math.min(5, parseInt(item.storeRating || item.productRating || 5, 10)));
        const riderRating = Math.max(1, Math.min(5, parseInt(item.riderRating || item.deliveryRating || 5, 10)));
        const comment = (item.comment || item.feedback || item.reviewText || '').trim();

        await this.query(`
          INSERT INTO freshmart_reviews (
            id, review_id, order_id, customer_id, customer_name, customer_phone, customer_email,
            delivery_partner_id, delivery_partner_name, store_rating, rider_rating, comment,
            created_at, updated_at, data
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), $13)
          ON CONFLICT (order_id) DO UPDATE SET
            store_rating = EXCLUDED.store_rating,
            rider_rating = EXCLUDED.rider_rating,
            comment = EXCLUDED.comment,
            updated_at = NOW(),
            data = EXCLUDED.data
        `, [
          reviewId, reviewId, orderId, customerId, customerName, customerPhone, customerEmail,
          deliveryPartnerId, deliveryPartnerName, storeRating, riderRating, comment,
          JSON.stringify(item)
        ]);
      } else {
        await this.query(`
          INSERT INTO ${table} (id, data)
          VALUES ($1, $2)
          ON CONFLICT (id) DO UPDATE SET
            data = EXCLUDED.data,
            updated_at = NOW()
        `, [item.id, JSON.stringify(item)]);
      }
      return item;
    }

    await this.query(`
      INSERT INTO freshmart_kv (collection, id, data)
      VALUES ($1, $2, $3)
      ON CONFLICT (collection, id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = NOW()
    `, [collection, item.id, JSON.stringify(item)]);
    return item;
  }

  async update(collection, id, updates) {
    const existing = await this.getById(collection, id);
    const merged = existing 
      ? { ...existing, ...updates, updatedAt: new Date().toISOString() }
      : { id, ...updates, updatedAt: new Date().toISOString() };
    await this.insert(collection, merged);
    return merged;
  }

  async delete(collection, id) {
    const table = this.getTableName(collection);
    if (table) {
      if (collection === 'products') {
        const res = await this.query(`DELETE FROM ${table} WHERE id = $1 OR storefront_id = $1 OR sku = $1`, [String(id)]);
        return res.rowCount > 0;
      }
      const res = await this.query(`DELETE FROM ${table} WHERE id = $1`, [String(id)]);
      return res.rowCount > 0;
    }
    const res = await this.query('DELETE FROM freshmart_kv WHERE collection = $1 AND id = $2', [collection, String(id)]);
    return res.rowCount > 0;
  }

  async getSetting(key) {
    try {
      const res = await this.query('SELECT value FROM freshmart_settings WHERE key = $1 LIMIT 1', [key]);
      return (res && res.rows && res.rows.length > 0) ? res.rows[0].value : null;
    } catch (e) {
      return null;
    }
  }

  async setSetting(key, value) {
    try {
      await this.query(`
        INSERT INTO freshmart_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
      `, [key, JSON.stringify(value)]);
      return value;
    } catch (e) {
      console.warn(`PostgreSQL setSetting(${key}) warning:`, e.message);
      return value;
    }
  }

  async generateNextOrderId() {
    const pool = this.getPool();
    if (!pool) throw new Error('PostgreSQL Pool is not configured');
    try {
      const res = await pool.query(`SELECT nextval('freshmart_order_id_seq') AS seq;`);
      const seq = parseInt(res.rows[0].seq, 10);
      return `FM-OD-${String(seq).padStart(5, '0')}`;
    } catch (e) {
      if (e.code === '42P01' || (e.message && e.message.includes('does not exist'))) {
        await pool.query(`CREATE SEQUENCE IF NOT EXISTS freshmart_order_id_seq START WITH 1 INCREMENT BY 1;`);
        const res = await pool.query(`SELECT nextval('freshmart_order_id_seq') AS seq;`);
        const seq = parseInt(res.rows[0].seq, 10);
        return `FM-OD-${String(seq).padStart(5, '0')}`;
      }
      throw e;
    }
  }

  // Atomic transactional inventory deduction and order placement
  async placeOrderWithInventoryAtomic(order, items, hubInfo = {}, operatorEmail = 'System Order Engine') {
    const pool = this.getPool();
    if (!pool) throw new Error('PostgreSQL Pool is not configured');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure customer-facing sequential Order ID (FM-OD-00001)
      let orderId = order.orderId || order.id;
      if (!orderId || !orderId.startsWith('FM-OD-')) {
        try {
          const seqRes = await client.query(`SELECT nextval('freshmart_order_id_seq') AS seq;`);
          const seq = parseInt(seqRes.rows[0].seq, 10);
          orderId = `FM-OD-${String(seq).padStart(5, '0')}`;
        } catch (seqErr) {
          if (seqErr.code === '42P01' || (seqErr.message && seqErr.message.includes('does not exist'))) {
            await client.query(`CREATE SEQUENCE IF NOT EXISTS freshmart_order_id_seq START WITH 1 INCREMENT BY 1;`);
            const seqRes = await client.query(`SELECT nextval('freshmart_order_id_seq') AS seq;`);
            const seq = parseInt(seqRes.rows[0].seq, 10);
            orderId = `FM-OD-${String(seq).padStart(5, '0')}`;
          } else {
            throw seqErr;
          }
        }
        order.id = orderId;
        order.orderId = orderId;
      }

      const deductedItems = [];
      for (const item of items) {
        const qty = Number(item.quantity || item.qty || 1);
        const prodId = String(item.id || item.productId || '');
        const prodName = String(item.name || '');

        // 1. Lock and inspect product stock
        const findRes = await client.query(
          `SELECT id, name, sku, stock FROM freshmart_products 
           WHERE id = $1 OR storefront_id = $1 OR sku = $1 OR LOWER(name) = LOWER($2)
           LIMIT 1 FOR UPDATE`,
          [prodId, prodName]
        );

        if (findRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return {
            success: false,
            error: `Product "${prodName || prodId}" not found in store catalog.`,
            code: 'PRODUCT_NOT_FOUND',
            productId: prodId
          };
        }

        const dbProd = findRes.rows[0];
        const currentStock = Number(dbProd.stock) || 0;

        if (currentStock < qty) {
          await client.query('ROLLBACK');
          return {
            success: false,
            error: `Insufficient stock for "${dbProd.name}". Available: ${currentStock}, Requested: ${qty}`,
            code: 'INSUFFICIENT_STOCK',
            productId: dbProd.id,
            productName: dbProd.name,
            availableStock: currentStock,
            requestedQuantity: qty
          };
        }

        // 2. Atomic SQL stock deduction with conditional check stock >= qty
        const updateRes = await client.query(`
          UPDATE freshmart_products
          SET stock = stock - $1,
              status = CASE WHEN (stock - $1) = 0 THEN 'OUT_OF_STOCK' WHEN (stock - $1) <= 15 THEN 'LOW_STOCK' ELSE 'ACTIVE' END,
              data = jsonb_set(
                jsonb_set(
                  jsonb_set(
                    data,
                    '{stock}',
                    to_jsonb(stock - $1)
                  ),
                  '{stockCount}',
                  to_jsonb(stock - $1)
                ),
                '{status}',
                to_jsonb(CASE WHEN (stock - $1) = 0 THEN 'OUT_OF_STOCK' WHEN (stock - $1) <= 15 THEN 'LOW_STOCK' ELSE 'ACTIVE' END)
              ),
              updated_at = NOW()
          WHERE id = $2 AND stock >= $1
          RETURNING id, name, sku, stock;
        `, [qty, dbProd.id]);

        if (updateRes.rowCount !== 1) {
          await client.query('ROLLBACK');
          return {
            success: false,
            error: `Insufficient stock for "${dbProd.name}" due to concurrent order.`,
            code: 'INSUFFICIENT_STOCK',
            productId: dbProd.id,
            productName: dbProd.name
          };
        }

        const newStock = Number(updateRes.rows[0].stock);
        deductedItems.push({
          id: dbProd.id,
          name: dbProd.name,
          sku: dbProd.sku,
          qty,
          beforeStock: currentStock,
          afterStock: newStock
        });
      }

      // 3. Atomically write Order to freshmart_orders
      order.stockRestored = false;
      const customerId = order.customerId || order.userId || null;
      const userId = order.userId || order.customerId || null;
      const customerName = order.customerName || order.deliveryAddress?.fullName || order.deliveryAddress?.name || null;
      const customerPhone = order.customerPhone || order.deliveryAddress?.phone || null;
      const itemsJson = JSON.stringify(order.items || []);
      const subtotal = Number(order.subtotal ?? order.itemsPrice ?? 0);
      const deliveryFee = Number(order.deliveryFee ?? order.deliveryCharge ?? 0);
      const discount = Number(order.discount ?? order.couponDiscount ?? 0);
      const finalTotal = Number(order.finalTotal ?? order.totalAmount ?? order.total ?? 0);
      const deliveryAddressJson = JSON.stringify(order.deliveryAddress || {});
      const paymentMethod = order.paymentMethod || 'UPI';
      const paymentStatus = order.paymentStatus || 'PENDING';
      const orderStatus = order.orderStatus || order.status || 'ORDER_PLACED';
      const status = order.status || order.orderStatus || 'ORDER_PLACED';
      const deliveryPartnerId = order.deliveryPartnerId || order.deliveryBoyId || null;
      const deliveryPartnerName = order.deliveryPartnerName || order.deliveryBoyName || null;
      const deliveryBoyId = order.deliveryBoyId || order.deliveryPartnerId || null;
      const deliveryBoyName = order.deliveryBoyName || order.deliveryPartnerName || null;
      const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();

      await client.query(`
        INSERT INTO freshmart_orders (
          id, order_id, customer_id, user_id, customer_name, customer_phone,
          items, subtotal, delivery_fee, discount, final_total,
          delivery_address, payment_method, payment_status, order_status, status,
          delivery_partner_id, delivery_partner_name, delivery_boy_id, delivery_boy_name,
          created_at, confirmed_at, packed_at, out_for_delivery_at, delivered_at, cancelled_at,
          data
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26,
          $27
        )
        ON CONFLICT (id) DO UPDATE SET
          order_id = EXCLUDED.order_id,
          customer_id = EXCLUDED.customer_id,
          user_id = EXCLUDED.user_id,
          customer_name = EXCLUDED.customer_name,
          customer_phone = EXCLUDED.customer_phone,
          items = EXCLUDED.items,
          subtotal = EXCLUDED.subtotal,
          delivery_fee = EXCLUDED.delivery_fee,
          discount = EXCLUDED.discount,
          final_total = EXCLUDED.final_total,
          delivery_address = EXCLUDED.delivery_address,
          payment_method = EXCLUDED.payment_method,
          payment_status = EXCLUDED.payment_status,
          order_status = EXCLUDED.order_status,
          status = EXCLUDED.status,
          delivery_partner_id = EXCLUDED.delivery_partner_id,
          delivery_partner_name = EXCLUDED.delivery_partner_name,
          delivery_boy_id = EXCLUDED.delivery_boy_id,
          delivery_boy_name = EXCLUDED.delivery_boy_name,
          data = EXCLUDED.data,
          updated_at = NOW()
      `, [
        order.id, orderId, customerId, userId, customerName, customerPhone,
        itemsJson, subtotal, deliveryFee, discount, finalTotal,
        deliveryAddressJson, paymentMethod, paymentStatus, orderStatus, status,
        deliveryPartnerId, deliveryPartnerName, deliveryBoyId, deliveryBoyName,
        createdAt, null, null, null, null, null,
        JSON.stringify(order)
      ]);

      // 4. Record Inventory Movements
      for (const d of deductedItems) {
        const movId = 'mov_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        await client.query(`
          INSERT INTO freshmart_inventory_movements (id, product_id, sku, type, quantity, previous_stock, new_stock, reason, operator, data)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          movId, d.id, d.sku || null, 'SALE', -d.qty,
          d.beforeStock, d.afterStock,
          `Reserved for Customer Order #${orderId}`,
          operatorEmail,
          JSON.stringify({
            id: movId,
            productId: d.id,
            productName: d.name,
            sku: d.sku,
            type: 'SALE',
            quantity: -d.qty,
            before: d.beforeStock,
            after: d.afterStock,
            reason: `Reserved for Customer Order #${orderId}`,
            user: operatorEmail,
            hubId: hubInfo.id || null,
            hubName: hubInfo.name || null,
            date: new Date().toISOString()
          })
        ]);
      }

      await client.query('COMMIT');
      return { success: true, order, deductedItems };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('placeOrderWithInventoryAtomic error:', err.message);
      return { success: false, error: err.message, code: 'DATABASE_ERROR' };
    } finally {
      client.release();
    }
  }

  // Atomic idempotent stock restoration on order cancellation
  async restoreOrderStockAtomic(orderId, operatorEmail = 'System Order Engine') {
    const pool = this.getPool();
    if (!pool) throw new Error('PostgreSQL Pool is not configured');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch order with row lock to prevent concurrent double restoration
      const orderRes = await client.query(
        `SELECT id, order_id, order_status, status, items, data, cancelled_at
         FROM freshmart_orders
         WHERE id = $1 OR order_id = $1
         LIMIT 1 FOR UPDATE`,
        [String(orderId)]
      );

      if (orderRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Order not found' };
      }

      const dbOrderRow = orderRes.rows[0];
      const orderData = typeof dbOrderRow.data === 'object' ? (dbOrderRow.data || {}) : JSON.parse(dbOrderRow.data || '{}');

      // Idempotency: Verify stock was not already restored
      if (orderData.stockRestored === true) {
        await client.query('ROLLBACK');
        return {
          success: true,
          alreadyRestored: true,
          message: `Stock for order #${orderId} has already been restored previously. Double-restoration prevented.`
        };
      }

      const items = Array.isArray(dbOrderRow.items) ? dbOrderRow.items : (orderData.items || []);
      const restoredItems = [];

      // 2. Increment stock atomically for each product in order
      for (const item of items) {
        const qty = Number(item.quantity || item.qty || 1);
        const prodId = String(item.id || item.productId || '');
        const prodName = String(item.name || '');

        const updateRes = await client.query(`
          UPDATE freshmart_products
          SET stock = stock + $1,
              status = CASE WHEN (stock + $1) > 15 THEN 'ACTIVE' WHEN (stock + $1) > 0 THEN 'LOW_STOCK' ELSE 'OUT_OF_STOCK' END,
              data = jsonb_set(
                jsonb_set(
                  jsonb_set(
                    data,
                    '{stock}',
                    to_jsonb(stock + $1)
                  ),
                  '{stockCount}',
                  to_jsonb(stock + $1)
                ),
                '{status}',
                to_jsonb(CASE WHEN (stock + $1) > 15 THEN 'ACTIVE' WHEN (stock + $1) > 0 THEN 'LOW_STOCK' ELSE 'OUT_OF_STOCK' END)
              ),
              updated_at = NOW()
          WHERE id = $2 OR storefront_id = $2 OR sku = $2 OR LOWER(name) = LOWER($3)
          RETURNING id, name, sku, stock, (stock - $1) as previous_stock;
        `, [qty, prodId, prodName]);

        if (updateRes.rows.length > 0) {
          const row = updateRes.rows[0];
          const currentNewStock = Number(row.stock);
          const prevStock = Number(row.previous_stock);
          restoredItems.push({
            id: row.id,
            name: row.name,
            sku: row.sku,
            qty,
            beforeStock: prevStock,
            afterStock: currentNewStock
          });

          // Insert inventory movement
          const movId = 'mov_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          await client.query(`
            INSERT INTO freshmart_inventory_movements (id, product_id, sku, type, quantity, previous_stock, new_stock, reason, operator, data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            movId, row.id, row.sku || null, 'RETURN', qty,
            prevStock, currentNewStock,
            `Order #${orderId} cancelled - stock restored`,
            operatorEmail,
            JSON.stringify({
              id: movId,
              productId: row.id,
              productName: row.name,
              sku: row.sku,
              type: 'RETURN',
              quantity: qty,
              before: prevStock,
              after: currentNewStock,
              reason: `Order #${orderId} cancelled - stock restored`,
              user: operatorEmail,
              date: new Date().toISOString()
            })
          ]);
        }
      }

      // 3. Flag order in database as stockRestored = true
      orderData.stockRestored = true;
      orderData.stockRestoredAt = new Date().toISOString();
      orderData.stockRestoredBy = operatorEmail;

      await client.query(`
        UPDATE freshmart_orders
        SET data = $2,
            cancelled_at = COALESCE(cancelled_at, NOW()),
            order_status = 'CANCELLED',
            status = 'CANCELLED',
            updated_at = NOW()
        WHERE id = $1 OR order_id = $1
      `, [String(dbOrderRow.id), JSON.stringify(orderData)]);

      await client.query('COMMIT');
      return { success: true, alreadyRestored: false, restoredItems, order: orderData };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('restoreOrderStockAtomic error:', err.message);
      return { success: false, error: err.message, code: 'DATABASE_ERROR' };
    } finally {
      client.release();
    }
  }

  async getReviewByOrderId(orderId) {
    if (!orderId) return null;
    await this.init();
    const res = await this.query(`
      SELECT data, store_rating, rider_rating, comment, created_at, customer_name, delivery_partner_name, order_id
      FROM freshmart_reviews 
      WHERE order_id = $1 OR data->>'orderId' = $1
      LIMIT 1
    `, [String(orderId)]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...(r.data || {}),
      orderId: r.order_id || (r.data && r.data.orderId),
      storeRating: Number(r.store_rating || (r.data && r.data.storeRating) || 5),
      riderRating: Number(r.rider_rating || (r.data && r.data.riderRating) || 5),
      comment: r.comment || (r.data && r.data.comment) || '',
      createdAt: r.created_at || (r.data && r.data.createdAt),
      customerName: r.customer_name || (r.data && r.data.customerName),
      deliveryPartnerName: r.delivery_partner_name || (r.data && r.data.deliveryPartnerName)
    };
  }

  async getAllReviews() {
    await this.init();
    const res = await this.query(`
      SELECT 
        id, review_id, order_id, customer_id, customer_name, customer_email, customer_phone,
        delivery_partner_id, delivery_partner_name, store_rating, rider_rating, comment,
        created_at, updated_at, data
      FROM freshmart_reviews 
      ORDER BY created_at DESC
    `);
    return res.rows.map(r => ({
      ...(r.data || {}),
      id: r.id || r.review_id,
      reviewId: r.review_id || r.id,
      orderId: r.order_id,
      customerId: r.customer_id,
      customerName: r.customer_name || (r.data && r.data.customerName) || 'Customer',
      customerEmail: r.customer_email || (r.data && r.data.customerEmail),
      customerPhone: r.customer_phone || (r.data && r.data.customerPhone),
      deliveryPartnerId: r.delivery_partner_id,
      deliveryPartnerName: r.delivery_partner_name || (r.data && r.data.deliveryPartnerName) || 'Delivery Partner',
      storeRating: Number(r.store_rating),
      riderRating: Number(r.rider_rating),
      comment: r.comment || (r.data && r.data.comment) || '',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
    }));
  }

  async getRiderRatingStats(riderId) {
    await this.init();
    const res = await this.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rider_rating) as average_rating,
        AVG(store_rating) as average_store_rating
      FROM freshmart_reviews 
      WHERE delivery_partner_id = $1 
         OR data->>'deliveryBoyId' = $1 
         OR data->>'deliveryPartnerId' = $1
         OR LOWER(delivery_partner_name) = LOWER($1)
    `, [String(riderId)]);

    const totalReviews = parseInt(res.rows[0]?.total_reviews || 0, 10);
    const avgRating = totalReviews > 0 ? parseFloat(Number(res.rows[0]?.average_rating || 5.0).toFixed(1)) : 5.0;

    const listRes = await this.query(`
      SELECT data, rider_rating, store_rating, comment, created_at, customer_name, order_id
      FROM freshmart_reviews
      WHERE delivery_partner_id = $1 
         OR data->>'deliveryBoyId' = $1 
         OR data->>'deliveryPartnerId' = $1
         OR LOWER(delivery_partner_name) = LOWER($1)
      ORDER BY created_at DESC 
      LIMIT 50
    `, [String(riderId)]);

    return {
      totalReviews,
      averageRating: avgRating,
      reviews: listRes.rows.map(r => ({
        ...(r.data || {}),
        orderId: r.order_id,
        riderRating: Number(r.rider_rating),
        storeRating: Number(r.store_rating),
        comment: r.comment || (r.data && r.data.comment) || '',
        customerName: r.customer_name || (r.data && r.data.customerName) || 'Customer',
        createdAt: r.created_at
      }))
    };
  }

  async getStoreRatingStats() {
    await this.init();
    const res = await this.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(store_rating) as average_store_rating,
        AVG(rider_rating) as average_rider_rating
      FROM freshmart_reviews
    `);

    const totalReviews = parseInt(res.rows[0]?.total_reviews || 0, 10);
    const avgStore = totalReviews > 0 ? parseFloat(Number(res.rows[0]?.average_store_rating || 5.0).toFixed(1)) : 5.0;
    const avgRider = totalReviews > 0 ? parseFloat(Number(res.rows[0]?.average_rider_rating || 5.0).toFixed(1)) : 5.0;

    return {
      totalReviews,
      averageStoreRating: avgStore,
      averageRiderRating: avgRider
    };
  }
  async getAllProductsAsync(options = {}) {
    await this.init();
    const pool = this.getPool();
    if (!pool) return [];

    const {
      category,
      status,
      search,
      includeSuspended = false,
      onlyActive = false
    } = options;

    const queryStr = `
      SELECT 
        p.id,
        p.storefront_id,
        p.name,
        p.sku,
        p.category,
        p.subcategory,
        p.price,
        p.selling_price,
        p.mrp,
        p.cost_price,
        COALESCE(p.stock, 0) AS physical_stock,
        COALESCE(p.damaged_stock, 0) AS damaged_stock,
        COALESCE(p.expired_stock, 0) AS expired_stock,
        COALESCE(p.manual_reserved_stock, 0) AS manual_reserved_stock,
        COALESCE(p.low_stock_limit, 15) AS low_stock_limit,
        p.unit,
        p.status,
        p.image,
        p.description,
        p.farmer,
        p.created_at,
        p.updated_at,
        p.data,
        COALESCE((
          SELECT SUM(COALESCE((item->>'quantity')::numeric, (item->>'qty')::numeric, 1))
          FROM freshmart_orders o,
               jsonb_array_elements(
                 CASE 
                   WHEN jsonb_typeof(o.items::jsonb) = 'array' THEN o.items::jsonb 
                   ELSE '[]'::jsonb 
                 END
               ) AS item
          WHERE UPPER(COALESCE(o.order_status, o.status, '')) NOT IN ('DELIVERED', 'CANCELLED', 'DELIVERY_FAILED', 'COMPLETED')
            AND (
              item->>'id' = p.id OR 
              item->>'productId' = p.id OR 
              (p.storefront_id IS NOT NULL AND (item->>'id' = p.storefront_id OR item->>'productId' = p.storefront_id)) OR 
              (p.sku IS NOT NULL AND item->>'sku' = p.sku)
            )
        ), 0) AS customer_reserved_stock
      FROM freshmart_products p
      WHERE p.status != 'DELETED'
      ORDER BY p.name ASC;
    `;

    try {
      const res = await this.query(queryStr);
      let list = res.rows.map(r => {
        const physicalStock = Number(r.physical_stock) || 0;
        const customerReserved = Number(r.customer_reserved_stock) || 0;
        const manualReserved = Number(r.manual_reserved_stock) || 0;
        const totalReserved = customerReserved + manualReserved;
        const availableStock = Math.max(0, physicalStock - totalReserved);
        const lowLimit = Number(r.low_stock_limit) || 15;

        let computedStatus = r.status;
        if (computedStatus !== 'SUSPENDED') {
          if (availableStock === 0) computedStatus = 'OUT_OF_STOCK';
          else if (availableStock <= lowLimit) computedStatus = 'LOW_STOCK';
          else computedStatus = 'ACTIVE';
        }

        const dataObj = typeof r.data === 'object' ? (r.data || {}) : JSON.parse(r.data || '{}');
        const price = Number(r.price || r.selling_price || dataObj.price) || 0;
        const mrp = Number(r.mrp || dataObj.mrp || dataObj.originalPrice) || price;

        return {
          ...dataObj,
          id: r.id,
          storefrontId: r.storefront_id || dataObj.storefrontId || r.id,
          name: r.name,
          hindiName: dataObj.hindiName || '',
          sku: r.sku || dataObj.sku || `SKU-${r.id.toUpperCase()}`,
          category: r.category || dataObj.category || 'Fresh Produce',
          subcategory: r.subcategory || dataObj.subcategory || '',
          hub: dataObj.hubName || dataObj.hub || 'Indiranagar Central Hub',
          farmer: r.farmer || dataObj.farmer || '',
          harvestDate: dataObj.harvestDate || '',
          freshnessDays: dataObj.freshnessDays || 5,
          unit: r.unit || dataObj.unit || '1 unit',
          price: price,
          sellingPrice: Number(r.selling_price || price),
          costPrice: Number(r.cost_price || dataObj.costPrice) || Math.round(price * 0.65),
          mrp: mrp,
          originalPrice: mrp,
          discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : (dataObj.discountPercent || 0),
          stock: availableStock,
          physicalStock,
          currentStock: physicalStock,
          customerReserved,
          customerReservedStock: customerReserved,
          manualReserved,
          manualReservedStock: manualReserved,
          reservedStock: totalReserved,
          availableStock,
          lowStockLimit: lowLimit,
          lowStockThreshold: lowLimit,
          damagedStock: Number(r.damaged_stock) || 0,
          expiredStock: Number(r.expired_stock) || 0,
          status: computedStatus,
          rawStatus: r.status,
          image: r.image || dataObj.image || '',
          description: r.description || dataObj.description || '',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : (dataObj.createdAt || new Date().toISOString()),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : (dataObj.updatedAt || new Date().toISOString())
        };
      });

      if (onlyActive) {
        list = list.filter(p => p.rawStatus === 'ACTIVE' || (p.rawStatus !== 'SUSPENDED' && p.status !== 'SUSPENDED'));
      } else if (!includeSuspended && status) {
        if (status === 'ACTIVE') {
          list = list.filter(p => p.rawStatus === 'ACTIVE' || (p.rawStatus !== 'SUSPENDED' && p.status !== 'SUSPENDED'));
        } else if (status !== 'ALL') {
          list = list.filter(p => p.status === status || p.rawStatus === status);
        }
      }

      if (category && category !== 'ALL' && category !== 'all') {
        const catLower = category.toLowerCase();
        const matchedAliases = [catLower];
        try {
          const catRes = await this.query(`SELECT id, name, slug FROM freshmart_categories WHERE LOWER(slug) = $1 OR LOWER(name) = $1 OR LOWER(id) = $1`, [catLower]);
          if (catRes && catRes.rows.length > 0) {
            catRes.rows.forEach(r => {
              if (r.name) matchedAliases.push(r.name.toLowerCase());
              if (r.slug) matchedAliases.push(r.slug.toLowerCase());
              if (r.id) matchedAliases.push(r.id.toLowerCase());
            });
          }
        } catch (e) {}

        list = list.filter(p => {
          const pCat = (p.category || '').toLowerCase();
          const pSlug = (p.categorySlug || p.category_slug || (p.data && (p.data.categorySlug || p.data.category_slug)) || '').toLowerCase();
          const pId = (p.categoryId || p.category_id || (p.data && (p.data.categoryId || p.data.category_id)) || '').toLowerCase();
          const pNormalized = pCat.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          const pSpaceSlug = pCat.replace(/\s+/g, '-');
          const pCatArray = (p.categories || []).map(c => String(c).toLowerCase());
          
          return matchedAliases.includes(pCat) ||
                 matchedAliases.includes(pSlug) ||
                 matchedAliases.includes(pId) ||
                 matchedAliases.includes(pNormalized) ||
                 matchedAliases.includes(pSpaceSlug) ||
                 pCatArray.some(c => matchedAliases.includes(c) || matchedAliases.includes(c.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')));
        });
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p => 
          (p.name || '').toLowerCase().includes(q) || 
          (p.sku || '').toLowerCase().includes(q) || 
          (p.hindiName || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
        );
      }

      return list;
    } catch (err) {
      console.warn('getAllProductsAsync error:', err.message);
      return [];
    }
  }

  async getProductsDiagnosticsAsync() {
    await this.init();
    const pool = this.getPool();
    if (!pool) return { success: false, error: 'Database not connected' };

    const queryStr = `
      SELECT 
        COUNT(*) AS total_rows,
        COUNT(DISTINCT id) AS unique_ids,
        COUNT(DISTINCT sku) AS unique_skus,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_count,
        COUNT(*) FILTER (WHERE status = 'SUSPENDED') AS suspended_count,
        COUNT(*) FILTER (WHERE status = 'LOW_STOCK') AS low_stock_count,
        COUNT(*) FILTER (WHERE status = 'OUT_OF_STOCK') AS out_of_stock_count,
        COUNT(*) FILTER (WHERE status = 'DELETED') AS deleted_count
      FROM freshmart_products;
    `;

    const dupSkuStr = `
      SELECT sku, COUNT(*) as count, array_agg(id) as ids, array_agg(name) as names
      FROM freshmart_products
      WHERE sku IS NOT NULL AND sku != '' AND status != 'DELETED'
      GROUP BY sku
      HAVING COUNT(*) > 1;
    `;

    try {
      const [statsRes, dupRes] = await Promise.all([
        this.query(queryStr),
        this.query(dupSkuStr)
      ]);

      const stats = statsRes.rows[0] || {};
      return {
        success: true,
        sourceOfTruth: 'Neon PostgreSQL (freshmart_products)',
        totalProductsInDb: Number(stats.total_rows || 0),
        uniqueProductIds: Number(stats.unique_ids || 0),
        uniqueSkus: Number(stats.unique_skus || 0),
        statusBreakdown: {
          active: Number(stats.active_count || 0),
          suspended: Number(stats.suspended_count || 0),
          lowStock: Number(stats.low_stock_count || 0),
          outOfStock: Number(stats.out_of_stock_count || 0),
          deleted: Number(stats.deleted_count || 0)
        },
        duplicateSkus: dupRes.rows || [],
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getInventoryLedgerAsync() {
    await this.init();
    const pool = this.getPool();
    if (!pool) return [];

    const queryStr = `
      SELECT 
        p.id,
        p.storefront_id,
        p.name,
        p.sku,
        p.category,
        p.subcategory,
        p.price,
        p.selling_price,
        p.mrp,
        p.cost_price,
        COALESCE(p.stock, 0) AS physical_stock,
        COALESCE(p.damaged_stock, 0) AS damaged_stock,
        COALESCE(p.expired_stock, 0) AS expired_stock,
        COALESCE(p.manual_reserved_stock, 0) AS manual_reserved_stock,
        COALESCE(p.low_stock_limit, 15) AS low_stock_limit,
        p.unit,
        p.status,
        p.image,
        p.description,
        p.farmer,
        p.created_at,
        p.updated_at,
        p.data,
        COALESCE((
          SELECT SUM(COALESCE((item->>'quantity')::numeric, (item->>'qty')::numeric, 1))
          FROM freshmart_orders o,
               jsonb_array_elements(
                 CASE 
                   WHEN jsonb_typeof(o.items::jsonb) = 'array' THEN o.items::jsonb 
                   ELSE '[]'::jsonb 
                 END
               ) AS item
          WHERE UPPER(COALESCE(o.order_status, o.status, '')) NOT IN ('DELIVERED', 'CANCELLED', 'DELIVERY_FAILED', 'COMPLETED')
            AND (
              item->>'id' = p.id OR 
              item->>'productId' = p.id OR 
              (p.storefront_id IS NOT NULL AND (item->>'id' = p.storefront_id OR item->>'productId' = p.storefront_id)) OR 
              (p.sku IS NOT NULL AND item->>'sku' = p.sku)
            )
        ), 0) AS customer_reserved_stock
      FROM freshmart_products p
      WHERE p.status != 'DELETED'
      ORDER BY p.name ASC;
    `;

    try {
      const res = await this.query(queryStr);
      return res.rows.map(r => {
        const physicalStock = Number(r.physical_stock) || 0;
        const customerReserved = Number(r.customer_reserved_stock) || 0;
        const manualReserved = Number(r.manual_reserved_stock) || 0;
        const totalReserved = customerReserved + manualReserved;
        const availableStock = Math.max(0, physicalStock - totalReserved);
        const lowLimit = Number(r.low_stock_limit) || 15;

        let computedStatus = r.status;
        if (computedStatus !== 'SUSPENDED') {
          if (availableStock === 0) computedStatus = 'OUT_OF_STOCK';
          else if (availableStock <= lowLimit) computedStatus = 'LOW_STOCK';
          else computedStatus = 'ACTIVE';
        }

        const dataObj = typeof r.data === 'object' ? (r.data || {}) : JSON.parse(r.data || '{}');

        return {
          ...dataObj,
          id: r.id,
          storefrontId: r.storefront_id || r.id,
          name: r.name,
          hindiName: dataObj.hindiName || '',
          sku: r.sku || `SKU-${r.id.toUpperCase()}`,
          category: r.category || 'Fresh Produce',
          subcategory: r.subcategory || '',
          hub: dataObj.hubName || 'Indiranagar Central Hub',
          farmer: r.farmer || dataObj.farmer || '',
          harvestDate: dataObj.harvestDate || '',
          freshnessDays: dataObj.freshnessDays || 5,
          unit: r.unit || dataObj.unit || '1 unit',
          price: Number(r.price || r.selling_price) || 0,
          sellingPrice: Number(r.selling_price || r.price) || 0,
          costPrice: Number(r.cost_price) || Math.round(Number(r.price || r.selling_price) * 0.65),
          mrp: Number(r.mrp) || Number(r.price || r.selling_price) || 0,
          currentStock: physicalStock,
          physicalStock,
          stock: availableStock,
          customerReserved,
          customerReservedStock: customerReserved,
          manualReserved,
          manualReservedStock: manualReserved,
          reservedStock: totalReserved,
          availableStock,
          lowStockThreshold: lowLimit,
          lowStockLimit: lowLimit,
          damagedStock: Number(r.damaged_stock) || 0,
          expiredStock: Number(r.expired_stock) || 0,
          status: computedStatus,
          lastUpdated: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
        };
      });
    } catch (err) {
      console.warn('getInventoryLedgerAsync query error:', err.message);
      return [];
    }
  }

  async manualReserveStockAtomic(productId, quantity, reason = 'Manual Reservation', operatorEmail = 'Store Owner') {
    const pool = this.getPool();
    if (!pool) throw new Error('PostgreSQL Pool is not configured');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Reserve quantity must be a positive number greater than 0.' };
      }

      // 1. Lock product row and calculate current available
      const prodRes = await client.query(`
        SELECT p.id, p.name, p.sku, COALESCE(p.stock, 0) as physical_stock,
               COALESCE(p.manual_reserved_stock, 0) as manual_reserved_stock,
               COALESCE(p.low_stock_limit, 15) as low_stock_limit,
               COALESCE(r.cust_res, 0) as customer_reserved_stock
        FROM freshmart_products p
        LEFT JOIN (
          SELECT 
            COALESCE(item->>'id', item->>'productId') as pid,
            SUM(COALESCE((item->>'quantity')::numeric, (item->>'qty')::numeric, 1)) as cust_res
          FROM freshmart_orders o,
               jsonb_array_elements(CASE WHEN jsonb_typeof(o.items::jsonb) = 'array' THEN o.items::jsonb ELSE '[]'::jsonb END) as item
          WHERE UPPER(COALESCE(o.order_status, o.status, '')) NOT IN ('DELIVERED', 'CANCELLED', 'DELIVERY_FAILED', 'COMPLETED')
          GROUP BY COALESCE(item->>'id', item->>'productId')
        ) r ON r.pid = p.id OR r.pid = p.storefront_id
        WHERE p.id = $1 OR p.storefront_id = $1 OR p.sku = $1
        LIMIT 1 FOR UPDATE OF p;
      `, [String(productId)]);

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Product not found' };
      }

      const row = prodRes.rows[0];
      const physicalStock = Number(row.physical_stock) || 0;
      const customerReserved = Number(row.customer_reserved_stock) || 0;
      const currentManualReserved = Number(row.manual_reserved_stock) || 0;
      const currentAvailable = Math.max(0, physicalStock - customerReserved - currentManualReserved);

      // 2. Validate: Cannot reserve more than available stock
      if (qty > currentAvailable) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: `Cannot reserve ${qty} units. Maximum available stock to reserve is ${currentAvailable} units.`,
          availableStock: currentAvailable,
          requestedQuantity: qty
        };
      }

      const newManualReserved = currentManualReserved + qty;
      const newAvailable = Math.max(0, physicalStock - customerReserved - newManualReserved);
      const lowLimit = Number(row.low_stock_limit) || 15;
      const newStatus = newAvailable === 0 ? 'OUT_OF_STOCK' : (newAvailable <= lowLimit ? 'LOW_STOCK' : 'ACTIVE');

      // 3. Update manual_reserved_stock in freshmart_products (Physical stock NOT reduced!)
      await client.query(`
        UPDATE freshmart_products
        SET manual_reserved_stock = $1,
            status = $2,
            updated_at = NOW()
        WHERE id = $3;
      `, [newManualReserved, newStatus, row.id]);

      // 4. Log in freshmart_inventory_movements
      const movId = 'mov_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const refId = 'RES-' + Date.now();
      await client.query(`
        INSERT INTO freshmart_inventory_movements (
          id, product_id, sku, type, quantity, previous_stock, new_stock, reason, operator, reference_id, created_at, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11);
      `, [
        movId, row.id, row.sku, 'RESERVE', qty,
        currentAvailable, newAvailable,
        reason || `Manual reservation of ${qty} units`,
        operatorEmail, refId,
        JSON.stringify({
          id: movId,
          productId: row.id,
          productName: row.name,
          sku: row.sku,
          type: 'RESERVE',
          action: 'RESERVE',
          quantity: qty,
          physicalStock,
          customerReserved,
          manualReserved: newManualReserved,
          previousAvailable: currentAvailable,
          newAvailable,
          reason,
          operator: operatorEmail,
          user: operatorEmail,
          referenceId: refId,
          date: new Date().toISOString()
        })
      ]);

      await client.query('COMMIT');
      return {
        success: true,
        action: 'RESERVE',
        productId: row.id,
        productName: row.name,
        sku: row.sku,
        physicalStock,
        customerReserved,
        manualReserved: newManualReserved,
        availableStock: newAvailable,
        status: newStatus,
        referenceId: refId
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('manualReserveStockAtomic error:', err.message);
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  }

  async manualUnreserveStockAtomic(productId, quantity, reason = 'Manual Unreserve / Release', operatorEmail = 'Store Owner') {
    const pool = this.getPool();
    if (!pool) throw new Error('PostgreSQL Pool is not configured');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Release quantity must be a positive number greater than 0.' };
      }

      // 1. Lock product row
      const prodRes = await client.query(`
        SELECT p.id, p.name, p.sku, COALESCE(p.stock, 0) as physical_stock,
               COALESCE(p.manual_reserved_stock, 0) as manual_reserved_stock,
               COALESCE(p.low_stock_limit, 15) as low_stock_limit,
               COALESCE(r.cust_res, 0) as customer_reserved_stock
        FROM freshmart_products p
        LEFT JOIN (
          SELECT 
            COALESCE(item->>'id', item->>'productId') as pid,
            SUM(COALESCE((item->>'quantity')::numeric, (item->>'qty')::numeric, 1)) as cust_res
          FROM freshmart_orders o,
               jsonb_array_elements(CASE WHEN jsonb_typeof(o.items::jsonb) = 'array' THEN o.items::jsonb ELSE '[]'::jsonb END) as item
          WHERE UPPER(COALESCE(o.order_status, o.status, '')) NOT IN ('DELIVERED', 'CANCELLED', 'DELIVERY_FAILED', 'COMPLETED')
          GROUP BY COALESCE(item->>'id', item->>'productId')
        ) r ON r.pid = p.id OR r.pid = p.storefront_id
        WHERE p.id = $1 OR p.storefront_id = $1 OR p.sku = $1
        LIMIT 1 FOR UPDATE OF p;
      `, [String(productId)]);

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Product not found' };
      }

      const row = prodRes.rows[0];
      const physicalStock = Number(row.physical_stock) || 0;
      const customerReserved = Number(row.customer_reserved_stock) || 0;
      const currentManualReserved = Number(row.manual_reserved_stock) || 0;
      const currentAvailable = Math.max(0, physicalStock - customerReserved - currentManualReserved);

      // 2. Validate: Cannot release more than currently manual reserved
      if (qty > currentManualReserved) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: `Cannot release ${qty} units. Current manual reserved stock is only ${currentManualReserved} units.`,
          manualReserved: currentManualReserved,
          requestedQuantity: qty
        };
      }

      const newManualReserved = currentManualReserved - qty;
      const newAvailable = Math.max(0, physicalStock - customerReserved - newManualReserved);
      const lowLimit = Number(row.low_stock_limit) || 15;
      const newStatus = newAvailable === 0 ? 'OUT_OF_STOCK' : (newAvailable <= lowLimit ? 'LOW_STOCK' : 'ACTIVE');

      // 3. Update manual_reserved_stock in freshmart_products
      await client.query(`
        UPDATE freshmart_products
        SET manual_reserved_stock = $1,
            status = $2,
            updated_at = NOW()
        WHERE id = $3;
      `, [newManualReserved, newStatus, row.id]);

      // 4. Log in freshmart_inventory_movements
      const movId = 'mov_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const refId = 'UNRES-' + Date.now();
      await client.query(`
        INSERT INTO freshmart_inventory_movements (
          id, product_id, sku, type, quantity, previous_stock, new_stock, reason, operator, reference_id, created_at, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11);
      `, [
        movId, row.id, row.sku, 'UNRESERVE', qty,
        currentAvailable, newAvailable,
        reason || `Manual release of ${qty} reserved units`,
        operatorEmail, refId,
        JSON.stringify({
          id: movId,
          productId: row.id,
          productName: row.name,
          sku: row.sku,
          type: 'UNRESERVE',
          action: 'UNRESERVE',
          quantity: qty,
          physicalStock,
          customerReserved,
          manualReserved: newManualReserved,
          previousAvailable: currentAvailable,
          newAvailable,
          reason,
          operator: operatorEmail,
          user: operatorEmail,
          referenceId: refId,
          date: new Date().toISOString()
        })
      ]);

      await client.query('COMMIT');
      return {
        success: true,
        action: 'UNRESERVE',
        productId: row.id,
        productName: row.name,
        sku: row.sku,
        physicalStock,
        customerReserved,
        manualReserved: newManualReserved,
        availableStock: newAvailable,
        status: newStatus,
        referenceId: refId
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('manualUnreserveStockAtomic error:', err.message);
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  }

  async getInventoryMovementsAsync(limit = 100) {
    await this.init();
    try {
      const res = await this.query(`
        SELECT 
          id, product_id, sku, type, quantity, previous_stock, new_stock, reason, operator, reference_id, created_at, data
        FROM freshmart_inventory_movements
        ORDER BY created_at DESC
        LIMIT $1;
      `, [limit]);

      return res.rows.map(r => {
        const dataObj = typeof r.data === 'object' ? (r.data || {}) : JSON.parse(r.data || '{}');
        return {
          ...dataObj,
          id: r.id,
          productId: r.product_id,
          sku: r.sku,
          type: r.type,
          quantity: Number(r.quantity),
          previousStock: Number(r.previous_stock),
          newStock: Number(r.new_stock),
          reason: r.reason,
          operator: r.operator,
          referenceId: r.reference_id || dataObj.referenceId,
          user: r.operator || dataObj.user || 'Store Owner',
          date: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
        };
      });
    } catch (err) {
      console.warn('getInventoryMovementsAsync error:', err.message);
      return [];
    }
  }

  async markOrderDeliveredAtomic(orderId, operatorEmail = 'System Delivery Engine') {
    const pool = this.getPool();
    if (!pool) throw new Error('PostgreSQL Pool is not configured');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderRes = await client.query(
        `SELECT id, order_id, order_status, status, items, data, delivered_at
         FROM freshmart_orders
         WHERE id = $1 OR order_id = $1
         LIMIT 1 FOR UPDATE`,
        [String(orderId)]
      );

      if (orderRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, error: 'Order not found' };
      }

      const dbOrderRow = orderRes.rows[0];
      const orderData = typeof dbOrderRow.data === 'object' ? (dbOrderRow.data || {}) : JSON.parse(dbOrderRow.data || '{}');

      // Idempotency check
      if (orderData.deliveryFulfillmentCompleted === true) {
        await client.query('ROLLBACK');
        return { success: true, alreadyFulfilled: true, order: orderData };
      }

      const items = Array.isArray(dbOrderRow.items) ? dbOrderRow.items : (orderData.items || []);

      // Deduct physical stock on delivery fulfillment and log SALE movement
      for (const item of items) {
        const qty = Number(item.quantity || item.qty || 1);
        const prodId = String(item.id || item.productId || '');
        const prodName = String(item.name || '');

        const updateRes = await client.query(`
          UPDATE freshmart_products
          SET stock = GREATEST(0, stock - $1),
              updated_at = NOW()
          WHERE id = $2 OR storefront_id = $2 OR sku = $2 OR LOWER(name) = LOWER($3)
          RETURNING id, name, sku, stock, (stock + $1) as previous_stock;
        `, [qty, prodId, prodName]);

        if (updateRes.rows.length > 0) {
          const row = updateRes.rows[0];
          const currentNewStock = Number(row.stock);
          const prevStock = Number(row.previous_stock);

          const movId = 'mov_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          const refId = 'FULFILL-' + orderId;
          await client.query(`
            INSERT INTO freshmart_inventory_movements (id, product_id, sku, type, quantity, previous_stock, new_stock, reason, operator, reference_id, data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            movId, row.id, row.sku || null, 'SALE', -qty,
            prevStock, currentNewStock,
            `Order #${orderId} delivered and fulfilled`,
            operatorEmail, refId,
            JSON.stringify({
              id: movId,
              productId: row.id,
              productName: row.name,
              sku: row.sku,
              type: 'SALE',
              quantity: -qty,
              before: prevStock,
              after: currentNewStock,
              reason: `Order #${orderId} delivered and fulfilled`,
              user: operatorEmail,
              referenceId: refId,
              date: new Date().toISOString()
            })
          ]);
        }
      }

      orderData.deliveryFulfillmentCompleted = true;
      orderData.deliveredAt = new Date().toISOString();
      orderData.deliveredBy = operatorEmail;

      await client.query(`
        UPDATE freshmart_orders
        SET data = $2,
            delivered_at = COALESCE(delivered_at, NOW()),
            order_status = 'DELIVERED',
            status = 'DELIVERED',
            updated_at = NOW()
        WHERE id = $1 OR order_id = $1
      `, [String(dbOrderRow.id), JSON.stringify(orderData)]);

      await client.query('COMMIT');
      return { success: true, order: orderData };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('markOrderDeliveredAtomic error:', err.message);
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  }

  async getAllCategoriesWithCountsAsync(onlyActive = false) {
    await this.init();
    try {
      const activeFilter = onlyActive ? "WHERE c.status = 'ACTIVE'" : "";
      const res = await this.query(`
        SELECT 
          c.id,
          c.name,
          c.slug,
          c.icon,
          c.image,
          c.description,
          COALESCE(c.display_order, 0) as display_order,
          COALESCE(c.status, 'ACTIVE') as status,
          c.created_at,
          c.updated_at,
          c.data,
          COUNT(p.id) FILTER (WHERE p.status != 'DELETED' AND p.status != 'ARCHIVED') as total_product_count,
          COUNT(p.id) FILTER (WHERE p.status = 'ACTIVE') as active_product_count,
          COUNT(p.id) FILTER (WHERE p.status = 'SUSPENDED') as suspended_product_count,
          COUNT(p.id) FILTER (WHERE p.status = 'ACTIVE' AND p.stock > 0) as in_stock_active_count,
          COUNT(p.id) FILTER (WHERE p.status = 'ACTIVE' AND p.stock <= 0) as out_of_stock_count
        FROM freshmart_categories c
        LEFT JOIN freshmart_products p ON (
          p.data->>'categoryId' = c.id
          OR LOWER(TRIM(p.category)) = LOWER(TRIM(c.name))
          OR LOWER(TRIM(p.category)) = LOWER(TRIM(c.slug))
          OR (c.slug = 'vegetables' AND (LOWER(p.category) LIKE '%veg%' OR LOWER(p.subcategory) LIKE '%veg%'))
          OR (c.slug = 'fruits' AND (LOWER(p.category) LIKE '%fruit%' OR LOWER(p.subcategory) LIKE '%fruit%'))
          OR (c.slug = 'grocery' AND (LOWER(p.category) LIKE '%groc%' OR LOWER(p.category) LIKE '%pant%' OR LOWER(p.category) LIKE '%staple%'))
          OR (c.slug = 'leafy-herbs' AND (LOWER(p.category) LIKE '%herb%' OR LOWER(p.category) LIKE '%leaf%'))
          OR (c.slug = 'dairy' AND (LOWER(p.category) LIKE '%dairy%' OR LOWER(p.name) LIKE '%ghee%'))
          OR (c.slug = 'sweeteners' AND (LOWER(p.category) LIKE '%sweet%' OR LOWER(p.name) LIKE '%honey%'))
        )
        ${activeFilter}
        GROUP BY c.id, c.name, c.slug, c.icon, c.image, c.description, c.display_order, c.status, c.created_at, c.updated_at, c.data
        ORDER BY COALESCE(c.display_order, 999) ASC, c.name ASC;
      `);

      return res.rows.map(r => {
        const dataObj = typeof r.data === 'object' ? (r.data || {}) : JSON.parse(r.data || '{}');
        const activeCount = parseInt(r.active_product_count || 0, 10);
        const totalCount = parseInt(r.total_product_count || 0, 10);
        const suspendedCount = parseInt(r.suspended_product_count || 0, 10);
        return {
          ...dataObj,
          id: r.id,
          name: r.name,
          slug: r.slug,
          icon: r.icon || dataObj.icon || '🥬',
          image: r.image || dataObj.image || '',
          description: r.description || dataObj.description || '',
          displayOrder: Number(r.display_order) || 0,
          display_order: Number(r.display_order) || 0,
          status: r.status || 'ACTIVE',
          active: (r.status || 'ACTIVE') === 'ACTIVE',
          productCount: onlyActive ? activeCount : totalCount,
          activeProductCount: activeCount,
          totalProductCount: totalCount,
          suspendedProductCount: suspendedCount,
          inStockActiveCount: parseInt(r.in_stock_active_count || 0, 10),
          outOfStockCount: parseInt(r.out_of_stock_count || 0, 10),
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
        };
      });
    } catch (err) {
      console.error('getAllCategoriesWithCountsAsync error:', err.message);
      return [];
    }
  }

  async getCategoryDiagnosticsAsync() {
    await this.init();
    const pool = this.getPool();
    if (!pool) return { success: false, error: 'Database not connected' };

    try {
      const [catsRes, prodsRes] = await Promise.all([
        this.query("SELECT * FROM freshmart_categories ORDER BY display_order ASC, name ASC"),
        this.query("SELECT id, name, sku, category, subcategory, status, stock, data FROM freshmart_products WHERE status != 'DELETED'")
      ]);

      const categories = catsRes.rows;
      const products = prodsRes.rows;

      const categoryMap = new Map();
      categories.forEach(c => {
        categoryMap.set(c.id, {
          id: c.id,
          name: c.name,
          slug: c.slug,
          status: c.status || 'ACTIVE',
          activeProducts: [],
          suspendedProducts: [],
          totalProducts: []
        });
      });

      const orphanProducts = [];
      const multiAssignedProducts = [];
      const duplicateProductIds = [];
      const seenIds = new Set();

      products.forEach(p => {
        if (!p.id) return;
        if (seenIds.has(p.id)) {
          duplicateProductIds.push(p.id);
        }
        seenIds.add(p.id);

        const dataObj = typeof p.data === 'object' ? (p.data || {}) : JSON.parse(p.data || '{}');
        const catId = dataObj.categoryId;
        const pCat = (p.category || '').toLowerCase().trim();
        const pSub = (p.subcategory || '').toLowerCase().trim();

        const matchingCats = categories.filter(c => {
          if (catId && c.id === catId) return true;
          const cName = (c.name || '').toLowerCase().trim();
          const cSlug = (c.slug || '').toLowerCase().trim();
          if (pCat && (pCat === cName || pCat === cSlug)) return true;
          if (cSlug === 'vegetables' && (pCat.includes('veg') || pSub.includes('veg'))) return true;
          if (cSlug === 'fruits' && (pCat.includes('fruit') || pSub.includes('fruit'))) return true;
          if (cSlug === 'grocery' && (pCat.includes('groc') || pCat.includes('pant') || pCat.includes('staple'))) return true;
          if (cSlug === 'leafy-herbs' && (pCat.includes('herb') || pCat.includes('leaf'))) return true;
          if (cSlug === 'dairy' && (pCat.includes('dairy') || (p.name || '').toLowerCase().includes('ghee'))) return true;
          if (cSlug === 'sweeteners' && (pCat.includes('sweet') || (p.name || '').toLowerCase().includes('honey'))) return true;
          return false;
        });

        if (matchingCats.length === 0) {
          orphanProducts.push({ id: p.id, name: p.name, sku: p.sku, category: p.category, subcategory: p.subcategory });
        } else {
          const primaryCat = matchingCats[0];
          const entry = categoryMap.get(primaryCat.id);
          if (entry) {
            entry.totalProducts.push(p.id);
            if (p.status === 'ACTIVE') {
              entry.activeProducts.push(p.id);
            } else if (p.status === 'SUSPENDED') {
              entry.suspendedProducts.push(p.id);
            }
          }
          if (matchingCats.length > 1) {
            multiAssignedProducts.push({
              id: p.id,
              name: p.name,
              sku: p.sku,
              category: p.category,
              matchedCategoryIds: matchingCats.map(c => c.id),
              matchedCategoryNames: matchingCats.map(c => c.name)
            });
          }
        }
      });

      const categoriesBreakdown = categories.map(c => {
        const entry = categoryMap.get(c.id) || { activeProducts: [], suspendedProducts: [], totalProducts: [] };
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          status: c.status || 'ACTIVE',
          activeProductCount: entry.activeProducts.length,
          suspendedProductCount: entry.suspendedProducts.length,
          totalProductCount: entry.totalProducts.length
        };
      });

      const sumCategoryAssignments = categoriesBreakdown.reduce((sum, c) => sum + c.totalProductCount, 0);

      return {
        success: true,
        sourceOfTruth: 'Neon PostgreSQL (freshmart_products & freshmart_categories)',
        totalProductsInDb: products.length,
        sumCategoryAssignments,
        categorySumMatchesTotalProducts: sumCategoryAssignments === products.length && orphanProducts.length === 0,
        totalCategories: categories.length,
        activeCategories: categories.filter(c => (c.status || 'ACTIVE') === 'ACTIVE').length,
        categoriesBreakdown,
        orphanProducts,
        duplicateAssignedProducts: multiAssignedProducts,
        duplicateProductIds,
        missingProductIds: products.filter(p => !p.id).map(p => p.name),
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async createCategoryAsync(categoryData) {
    await this.init();
    const id = categoryData.id || ('cat_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    const name = String(categoryData.name || '').trim() || 'New Category';
    const slug = (categoryData.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    const icon = categoryData.icon || '🥬';
    const image = categoryData.image || '';
    const description = categoryData.description || '';
    const displayOrder = Number(categoryData.displayOrder || categoryData.display_order || 0);
    const status = (categoryData.status || (categoryData.active === false ? 'SUSPENDED' : 'ACTIVE')).toUpperCase();

    const dataObj = {
      id,
      name,
      slug,
      icon,
      image,
      description,
      displayOrder,
      display_order: displayOrder,
      status,
      active: status === 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(categoryData.data || {})
    };

    const res = await this.query(`
      INSERT INTO freshmart_categories (id, name, slug, icon, image, description, display_order, status, created_at, updated_at, data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9)
      RETURNING *;
    `, [id, name, slug, icon, image, description, displayOrder, status, JSON.stringify(dataObj)]);

    return {
      success: true,
      category: {
        ...dataObj,
        productCount: 0,
        activeProductCount: 0,
        totalProductCount: 0
      }
    };
  }

  async updateCategoryAsync(categoryId, updateData) {
    await this.init();
    const existingRes = await this.query('SELECT * FROM freshmart_categories WHERE id = $1', [String(categoryId)]);
    if (existingRes.rows.length === 0) {
      return { success: false, error: 'Category not found' };
    }

    const row = existingRes.rows[0];
    const dataObj = typeof row.data === 'object' ? (row.data || {}) : JSON.parse(row.data || '{}');

    const name = updateData.name !== undefined ? String(updateData.name).trim() : row.name;
    const slug = updateData.slug !== undefined ? String(updateData.slug).trim() : row.slug;
    const icon = updateData.icon !== undefined ? updateData.icon : row.icon;
    const image = updateData.image !== undefined ? updateData.image : row.image;
    const description = updateData.description !== undefined ? updateData.description : row.description;
    const displayOrder = updateData.displayOrder !== undefined ? Number(updateData.displayOrder) : (updateData.display_order !== undefined ? Number(updateData.display_order) : row.display_order);
    
    let status = row.status || 'ACTIVE';
    if (updateData.status !== undefined) {
      status = String(updateData.status).toUpperCase();
    } else if (updateData.active !== undefined) {
      status = updateData.active ? 'ACTIVE' : 'SUSPENDED';
    }

    const updatedData = {
      ...dataObj,
      name,
      slug,
      icon,
      image,
      description,
      displayOrder,
      display_order: displayOrder,
      status,
      active: status === 'ACTIVE',
      updatedAt: new Date().toISOString()
    };

    await this.query(`
      UPDATE freshmart_categories
      SET name = $1,
          slug = $2,
          icon = $3,
          image = $4,
          description = $5,
          display_order = $6,
          status = $7,
          updated_at = NOW(),
          data = $8
      WHERE id = $9;
    `, [name, slug, icon, image, description, displayOrder, status, JSON.stringify(updatedData), String(categoryId)]);

    return {
      success: true,
      category: {
        id: row.id,
        ...updatedData
      }
    };
  }

  async toggleCategoryStatusAsync(categoryId, targetStatus = null) {
    await this.init();
    const existingRes = await this.query('SELECT * FROM freshmart_categories WHERE id = $1', [String(categoryId)]);
    if (existingRes.rows.length === 0) {
      return { success: false, error: 'Category not found' };
    }

    const row = existingRes.rows[0];
    const newStatus = targetStatus ? String(targetStatus).toUpperCase() : (row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
    return this.updateCategoryAsync(categoryId, { status: newStatus });
  }

  async deleteCategoryAsync(categoryId) {
    await this.init();
    const existingRes = await this.query('SELECT * FROM freshmart_categories WHERE id = $1', [String(categoryId)]);
    if (existingRes.rows.length === 0) {
      return { success: false, error: 'Category not found' };
    }

    const catRow = existingRes.rows[0];

    // Check if category has any active products
    const prodCountRes = await this.query(`
      SELECT COUNT(*) as count 
      FROM freshmart_products p
      WHERE (
        p.data->>'categoryId' = $1
        OR LOWER(TRIM(p.category)) = LOWER(TRIM($2))
        OR LOWER(TRIM(p.category)) = LOWER(TRIM($3))
        OR ($3 = 'vegetables' AND (LOWER(p.category) LIKE '%veg%' OR LOWER(p.subcategory) LIKE '%veg%'))
        OR ($3 = 'fruits' AND (LOWER(p.category) LIKE '%fruit%' OR LOWER(p.subcategory) LIKE '%fruit%'))
        OR ($3 = 'grocery' AND (LOWER(p.category) LIKE '%groc%' OR LOWER(p.category) LIKE '%pant%'))
      ) AND p.status != 'DELETED';
    `, [String(categoryId), catRow.name, catRow.slug]);

    const count = parseInt(prodCountRes.rows[0]?.count || 0, 10);
    if (count > 0) {
      return {
        success: false,
        error: `Cannot delete category "${catRow.name}" because ${count} product(s) are currently assigned to it. Please move or reassign the products first, or suspend the category.`,
        productCount: count,
        blocked: true
      };
    }

    await this.query('DELETE FROM freshmart_categories WHERE id = $1', [String(categoryId)]);
    return { success: true, message: `Category "${catRow.name}" deleted successfully.` };
  }
}

module.exports = PostgresAdapter;



