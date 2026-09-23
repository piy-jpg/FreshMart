const { db } = require('../../database/connection');

class DeliveryRepository {
  getDeliveryBoys() {
    if (typeof db.getDeliveryBoys === 'function') {
      return db.getDeliveryBoys();
    }
    return (db.getAll('users') || []).filter(u => {
      const r = (u.role || '').toUpperCase();
      return r === 'DELIVERY_BOY' || r === 'DELIVERY';
    });
  }

  getDeliveryZones() {
    return db.getAll('delivery_zones') || [];
  }

  assignOrderToDeliveryBoy(orderId, deliveryBoyId, actorName = 'Store Owner') {
    return db.assignOrderToDeliveryBoy(orderId, deliveryBoyId, actorName);
  }
}

module.exports = new DeliveryRepository();
