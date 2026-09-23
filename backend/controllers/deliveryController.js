const { deliveryService, orderService } = require('../services');
const { sendJson, parseBody } = require('../../shared/utilities');

class DeliveryController {
  async getMyDeliveries(req, res) {
    if (!req.auth || !req.auth.user) {
      return sendJson(res, 401, { error: 'Authentication required' });
    }
    const orders = deliveryService.getDeliveryOrders(req.auth.user);
    return sendJson(res, 200, orders);
  }

  async acceptHandover(req, res, orderId) {
    try {
      const updated = orderService.transitionOrderStep(orderId, 'DELIVERY_BOY_ACCEPTED', req.auth ? req.auth.user : null);
      return sendJson(res, 200, { success: true, order: updated });
    } catch (err) {
      return sendJson(res, err.statusCode || 400, { error: err.message });
    }
  }

  async pickupOrder(req, res, orderId) {
    try {
      const updated = orderService.transitionOrderStep(orderId, 'PICKED_UP', req.auth ? req.auth.user : null);
      return sendJson(res, 200, { success: true, order: updated });
    } catch (err) {
      return sendJson(res, err.statusCode || 400, { error: err.message });
    }
  }

  async startDelivery(req, res, orderId) {
    try {
      const updated = orderService.transitionOrderStep(orderId, 'OUT_FOR_DELIVERY', req.auth ? req.auth.user : null);
      return sendJson(res, 200, { success: true, order: updated });
    } catch (err) {
      return sendJson(res, err.statusCode || 400, { error: err.message });
    }
  }

  async markArrived(req, res, orderId) {
    try {
      const updated = orderService.transitionOrderStep(orderId, 'ARRIVED', req.auth ? req.auth.user : null);
      return sendJson(res, 200, { success: true, order: updated });
    } catch (err) {
      return sendJson(res, err.statusCode || 400, { error: err.message });
    }
  }
}

module.exports = new DeliveryController();
