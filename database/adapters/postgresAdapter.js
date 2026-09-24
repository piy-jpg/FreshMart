/**
 * FreshMart Production PostgreSQL Database Adapter
 * Single Source of Truth for all persistent FreshMart data.
 */

const { Pool } = require('pg');

class PostgresAdapter {
  constructor(connectionString) {
    const candidateUrls = [
      connectionString,
      process.env.POSTGRES_URL,
      process.env.POSTGRES_PRISMA_URL,
      process.env.POSTGRES_DATABASE_URL,
      process.env.STORAGE_URL,
      process.env.DATABASE_URL,
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
      const sslConfig = (this.connectionString.includes('localhost') || this.connectionString.includes('127.0.0.1'))
        ? false
        : { rejectUnauthorized: false };

      this.pool = new Pool({
        connectionString: this.connectionString,
        ssl: sslConfig,
        max: Number(process.env.DATABASE_POOL_MAX || 10),
        idleTimeoutMillis: 30000,
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

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create main tables
        await client.query(`
          CREATE TABLE IF NOT EXISTS freshmart_users (
            id VARCHAR(128) PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            name VARCHAR(255),
            phone VARCHAR(64),
            role VARCHAR(64) DEFAULT 'CUSTOMER',
            status VARCHAR(64) DEFAULT 'ACTIVE',
            password_hash TEXT,
            salt TEXT,
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS freshmart_products (
            id VARCHAR(128) PRIMARY KEY,
            storefront_id VARCHAR(128),
            name VARCHAR(255) NOT NULL,
            sku VARCHAR(128),
            category VARCHAR(128),
            price NUMERIC(10,2) NOT NULL DEFAULT 0,
            selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
            mrp NUMERIC(10,2) NOT NULL DEFAULT 0,
            stock INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(64) DEFAULT 'ACTIVE',
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_fm_prod_cat ON freshmart_products(category);
          CREATE INDEX IF NOT EXISTS idx_fm_prod_sku ON freshmart_products(sku);
          CREATE INDEX IF NOT EXISTS idx_fm_prod_status ON freshmart_products(status);

          CREATE TABLE IF NOT EXISTS freshmart_categories (
            id VARCHAR(128) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(128),
            icon VARCHAR(64),
            status VARCHAR(64) DEFAULT 'ACTIVE',
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS freshmart_orders (
            id VARCHAR(128) PRIMARY KEY,
            order_id VARCHAR(128) UNIQUE,
            user_id VARCHAR(128),
            customer_name VARCHAR(255),
            customer_phone VARCHAR(64),
            status VARCHAR(64) DEFAULT 'ORDER_PLACED',
            payment_status VARCHAR(64) DEFAULT 'PENDING',
            final_total NUMERIC(10,2) DEFAULT 0,
            delivery_boy_id VARCHAR(128),
            delivery_boy_name VARCHAR(255),
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_fm_orders_status ON freshmart_orders(status);
          CREATE INDEX IF NOT EXISTS idx_fm_orders_user ON freshmart_orders(user_id);
          CREATE INDEX IF NOT EXISTS idx_fm_orders_rider ON freshmart_orders(delivery_boy_id);

          CREATE TABLE IF NOT EXISTS freshmart_delivery_partners (
            id VARCHAR(128) PRIMARY KEY,
            user_id VARCHAR(128),
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(64),
            status VARCHAR(64) DEFAULT 'AVAILABLE',
            current_order_id VARCHAR(128),
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS freshmart_farmers (
            id VARCHAR(128) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            status VARCHAR(64) DEFAULT 'ACTIVE',
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS freshmart_hubs (
            id VARCHAR(128) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            status VARCHAR(64) DEFAULT 'ONLINE',
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS freshmart_inventory_movements (
            id VARCHAR(128) PRIMARY KEY,
            product_id VARCHAR(128),
            sku VARCHAR(128),
            type VARCHAR(64),
            quantity INTEGER,
            previous_stock INTEGER,
            new_stock INTEGER,
            reason TEXT,
            operator VARCHAR(255),
            data JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS freshmart_settings (
            key VARCHAR(128) PRIMARY KEY,
            value JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS freshmart_audit_logs (
            id VARCHAR(128) PRIMARY KEY,
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            operator_email VARCHAR(255),
            action VARCHAR(128),
            entity VARCHAR(128),
            entity_id VARCHAR(128),
            details TEXT,
            data JSONB NOT NULL DEFAULT '{}'::jsonb
          );

          CREATE TABLE IF NOT EXISTS freshmart_kv (
            collection VARCHAR(64) NOT NULL,
            id VARCHAR(128) NOT NULL,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (collection, id)
          );
        `);

        await client.query('COMMIT');

        // Optional initial seed migration if tables are empty
        if (seedData) {
          await this._seedInitialData(client, seedData);
        }

        this.isInitialized = true;
        console.log('✅ PostgreSQL Production Database Connected and Initialized Successfully.');
        return true;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('PostgreSQL Initialization Error:', err.message);
        throw err;
      } finally {
        client.release();
      }
    })();

    return this._initPromise;
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
              name = EXCLUDED.name,
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
      const res = await this.query(`SELECT data FROM ${table} ORDER BY created_at DESC`);
      return res.rows.map(r => r.data);
    }
    const res = await this.query('SELECT data FROM freshmart_kv WHERE collection = $1 ORDER BY updated_at DESC', [collection]);
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
          VALUES (, , , , , , , , , , )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
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
          VALUES (, , , , , , , , )
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
        await this.query(`
          INSERT INTO freshmart_orders (id, order_id, user_id, customer_name, customer_phone, status, payment_status, final_total, delivery_boy_id, delivery_boy_name, data)
          VALUES (, , , , , , , , , , )
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            payment_status = EXCLUDED.payment_status,
            delivery_boy_id = EXCLUDED.delivery_boy_id,
            delivery_boy_name = EXCLUDED.delivery_boy_name,
            data = EXCLUDED.data,
            updated_at = NOW()
        `, [
          item.id, item.orderId || item.id, item.userId || null, item.customerName || null, item.customerPhone || null,
          item.status || 'ORDER_PLACED', item.paymentStatus || 'PENDING', item.finalTotal || item.total || 0,
          item.deliveryBoyId || null, item.deliveryBoyName || null,
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
}

module.exports = PostgresAdapter;
