const { broadcastEvent } = require('../api/events');

class NotificationService {
  notifyOrderCreated(order) {
    broadcastEvent('ORDER_CREATED', {
      orderId: order.id,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      itemsCount: (order.items || []).length,
      createdAt: order.createdAt
    });
  }

  notifyOrderStatusUpdated(order, previousStatus, newStatus, actorName = 'System') {
    broadcastEvent('ORDER_STATUS_UPDATED', {
      orderId: order.id,
      previousStatus,
      newStatus,
      currentStep: order.currentStep,
      deliveryStatus: order.deliveryStatus,
      deliveryBoyId: order.deliveryBoyId,
      actorName,
      updatedAt: new Date().toISOString()
    });
  }

  notifyOrderAssigned(order, deliveryBoy) {
    broadcastEvent('ORDER_ASSIGNED', {
      orderId: order.id,
      deliveryBoyId: deliveryBoy.id,
      deliveryBoyName: deliveryBoy.name,
      assignedAt: new Date().toISOString()
    });
  }
}

module.exports = new NotificationService();
