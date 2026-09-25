/**
 * FreshMart Production PostgreSQL Database Adapter
 * Single Source of Truth for all persistent FreshMart data.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadLocalEnvFiles() {
  const envFiles = [
    path.join(process.cwd(), '.env.production.local'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '..', '.env.production.local'),
    path.join(__dirname, '..', '..', '.env.local'),
    path.join(__dirname, '..', '..', '.env')
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
            if (!process.env[key]) {
              process.env[key] = val;
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
          out_for_delivery_at = COALESCE(out_for_delivery_at, NULLIF(data->>'outForDeliveryAt', '')::timestamptz),
          delivered_at = COALESCE(delivered_at, NULLIF(data->>'deliveredAt', '')::timestamptz),
          cancelled_at = COALESCE(cancelled_at, NULLIF(data->>'cancelledAt', '')::timestamptz)
        WHERE data IS NOT NULL;
      `);
    } catch (err) {
      console.warn('ensureOrdersSchema warning:', err.message);
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
      activity_logs: 'freshmart_audit_logs'
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
}

module.exports = PostgresAdapter;
