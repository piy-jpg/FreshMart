/**
 * FreshMart Production Database Index Manager
 * Provides fast O(1) multi-key lookups for products, users, orders, inventory, and categories.
 */

class IndexManager {
  constructor(db) {
    this.db = db;
    // Product Indexes
    this.productIdIndex = new Map();
    this.productSkuIndex = new Map();
    this.productStorefrontIndex = new Map();
    this.productCategoryIndex = new Map();
    
    // User Indexes
    this.userEmailIndex = new Map();
    this.userIdIndex = new Map();
    this.userRoleIndex = new Map();

    // Order Indexes
    this.orderIdIndex = new Map();
    this.orderUserIdIndex = new Map();
    this.orderStatusIndex = new Map();
    this.orderHubIndex = new Map();

    // Inventory & Address Indexes
    this.inventoryProductIndex = new Map();
    this.addressUserIdIndex = new Map();
  }

  /**
   * Rebuild all indexes from current database state
   */
  rebuild() {
    this.clearAll();

    // 1. Index Products
    const products = this.db.getAll('products') || [];
    for (const p of products) {
      this.indexProduct(p);
    }

    // 2. Index Users
    const users = this.db.getAll('users') || [];
    for (const u of users) {
      this.indexUser(u);
    }

    // 3. Index Orders
    const orders = this.db.getAll('orders') || [];
    for (const o of orders) {
      this.indexOrder(o);
    }

    // 4. Index Inventory Movements
    const movements = this.db.getAll('inventory_movements') || [];
    for (const m of movements) {
      if (m.productId) {
        if (!this.inventoryProductIndex.has(m.productId)) {
          this.inventoryProductIndex.set(m.productId, []);
        }
        this.inventoryProductIndex.get(m.productId).push(m);
      }
    }

    // 5. Index Addresses
    const addresses = this.db.getAll('addresses') || [];
    for (const a of addresses) {
      if (a.userId) {
        if (!this.addressUserIdIndex.has(a.userId)) {
          this.addressUserIdIndex.set(a.userId, []);
        }
        this.addressUserIdIndex.get(a.userId).push(a);
      }
    }
  }

  clearAll() {
    this.productIdIndex.clear();
    this.productSkuIndex.clear();
    this.productStorefrontIndex.clear();
    this.productCategoryIndex.clear();
    this.userEmailIndex.clear();
    this.userIdIndex.clear();
    this.userRoleIndex.clear();
    this.orderIdIndex.clear();
    this.orderUserIdIndex.clear();
    this.orderStatusIndex.clear();
    this.orderHubIndex.clear();
    this.inventoryProductIndex.clear();
    this.addressUserIdIndex.clear();
  }

  indexProduct(p) {
    if (!p) return;
    if (p.id) this.productIdIndex.set(p.id, p);
    if (p.sku) this.productSkuIndex.set(p.sku.toUpperCase(), p);
    if (p.storefrontId) this.productStorefrontIndex.set(p.storefrontId, p);
    
    const cat = (p.category || 'vegetables').toLowerCase();
    if (!this.productCategoryIndex.has(cat)) {
      this.productCategoryIndex.set(cat, new Set());
    }
    this.productCategoryIndex.get(cat).add(p.id);
  }

  unindexProduct(p) {
    if (!p) return;
    if (p.id) this.productIdIndex.delete(p.id);
    if (p.sku) this.productSkuIndex.delete(p.sku.toUpperCase());
    if (p.storefrontId) this.productStorefrontIndex.delete(p.storefrontId);
    const cat = (p.category || 'vegetables').toLowerCase();
    if (this.productCategoryIndex.has(cat)) {
      this.productCategoryIndex.get(cat).delete(p.id);
    }
  }

  indexUser(u) {
    if (!u) return;
    if (u.id) this.userIdIndex.set(u.id, u);
    if (u.email) this.userEmailIndex.set(u.email.toLowerCase().trim(), u);
    const role = (u.role || 'customer').toUpperCase();
    if (!this.userRoleIndex.has(role)) {
      this.userRoleIndex.set(role, new Set());
    }
    this.userRoleIndex.get(role).add(u.id);
  }

  indexOrder(o) {
    if (!o) return;
    const id = o.id || o.orderId;
    if (id) this.orderIdIndex.set(id, o);
    if (o.orderId && o.orderId !== o.id) this.orderIdIndex.set(o.orderId, o);

    if (o.userId) {
      if (!this.orderUserIdIndex.has(o.userId)) {
        this.orderUserIdIndex.set(o.userId, new Set());
      }
      this.orderUserIdIndex.get(o.userId).add(id);
    }

    const status = (o.orderStatus || o.status || 'PLACED').toUpperCase();
    if (!this.orderStatusIndex.has(status)) {
      this.orderStatusIndex.set(status, new Set());
    }
    this.orderStatusIndex.get(status).add(id);

    if (o.hubId) {
      if (!this.orderHubIndex.has(o.hubId)) {
        this.orderHubIndex.set(o.hubId, new Set());
      }
      this.orderHubIndex.get(o.hubId).add(id);
    }
  }

  // --- Lookup Methods ---
  findProductById(id) {
    if (!id) return null;
    const sId = String(id);
    return this.productIdIndex.get(sId) || 
           this.productStorefrontIndex.get(sId) || 
           this.productSkuIndex.get(sId.toUpperCase()) || 
           null;
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.userEmailIndex.get(email.toLowerCase().trim()) || null;
  }

  findUserById(id) {
    if (!id) return null;
    return this.userIdIndex.get(String(id)) || null;
  }

  findOrderById(id) {
    if (!id) return null;
    return this.orderIdIndex.get(String(id)) || null;
  }

  findOrdersByUserId(userId) {
    if (!userId || !this.orderUserIdIndex.has(userId)) return [];
    const ids = this.orderUserIdIndex.get(userId);
    return Array.from(ids).map(id => this.orderIdIndex.get(id)).filter(Boolean);
  }

  findProductsByCategory(category) {
    if (!category) return [];
    const cat = category.toLowerCase().trim();
    if (!this.productCategoryIndex.has(cat)) return [];
    const ids = this.productCategoryIndex.get(cat);
    return Array.from(ids).map(id => this.productIdIndex.get(id)).filter(Boolean);
  }
}

module.exports = IndexManager;
