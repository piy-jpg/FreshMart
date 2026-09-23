/**
 * In-Memory Database Index Manager
 * Speeds up frequent lookups (by User ID, Order ID, User Email, Delivery Status)
 */
class IndexManager {
  constructor(db) {
    this.db = db;
    this.userEmailIndex = new Map();
    this.orderIdIndex = new Map();
  }

  rebuild() {
    this.userEmailIndex.clear();
    this.orderIdIndex.clear();

    const users = this.db.getAll('users') || [];
    for (const u of users) {
      if (u.email) this.userEmailIndex.set(u.email.toLowerCase(), u.id);
    }

    const orders = this.db.getAll('orders') || [];
    for (const o of orders) {
      if (o.id) this.orderIdIndex.set(o.id, o);
    }
  }

  findUserIdByEmail(email) {
    if (!email) return null;
    return this.userEmailIndex.get(email.toLowerCase()) || null;
  }

  findOrderById(orderId) {
    if (!orderId) return null;
    return this.orderIdIndex.get(orderId) || this.db.getById('orders', orderId);
  }
}

module.exports = IndexManager;
