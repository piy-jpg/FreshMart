const { db } = require('../../database/connection');
const { deliveryRepository, orderRepository } = require('../repositories');
const notificationService = require('./notificationService');

class DeliveryService {
  getDeliveryOrders(deliveryBoyUser) {
    const allOrders = orderRepository.getAll();
    if (!deliveryBoyUser) return [];

    // Filter orders strictly assigned to this delivery boy or available for pickup
    return allOrders.filter(o =>
      o.deliveryBoyId === deliveryBoyUser.id ||
      o.deliveryBoyId === deliveryBoyUser.employeeId ||
      o.assignedTo === deliveryBoyUser.id ||
      o.assignedTo === deliveryBoyUser.name
    );
  }

  assignOrder(orderId, deliveryBoyId, actor) {
    const order = orderRepository.getById(orderId);
    if (!order) throw new Error('Order not found');

    const boy = db.getById('users', deliveryBoyId) || db.getAll('users').find(u => u.employeeId === deliveryBoyId);
    if (!boy) throw new Error('Delivery partner not found');

    const updated = db.assignOrderToDeliveryBoy(orderId, boy.id, actor ? actor.name : 'Store Owner');
    notificationService.notifyOrderAssigned(updated, boy);
    return updated;
  }
}

module.exports = new DeliveryService();
