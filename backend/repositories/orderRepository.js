const { db } = require('../../database/connection');

class OrderRepository {
  getAll() {
    return db.getAll('orders') || [];
  }

  getById(id) {
    return db.getById('orders', id);
  }

  getByCustomerId(customerId) {
    if (!customerId) return [];
    return (db.getAll('orders') || []).filter(o => o.customerId === customerId);
  }

  getByDeliveryBoyId(deliveryBoyId) {
    if (!deliveryBoyId) return [];
    return (db.getAll('orders') || []).filter(o => o.deliveryBoyId === deliveryBoyId);
  }

  create(order) {
    return db.insert('orders', order);
  }

  update(id, updates) {
    return db.update('orders', id, updates);
  }

  delete(id) {
    return db.delete('orders', id);
  }
}

module.exports = new OrderRepository();
