const { ownerService, deliveryService, orderService } = require('../services');
const { sendJson, parseBody } = require('../../shared/utilities');
const { orderRepository } = require('../repositories');

class OwnerController {
  async getMetrics(req, res) {
    const metrics = ownerService.getStoreMetrics();
    return sendJson(res, 200, metrics);
  }

  async getStaff(req, res) {
    const staff = ownerService.getStaffMembers();
    return sendJson(res, 200, staff);
  }

  async getAllOrders(req, res) {
    const orders = orderRepository.getAll();
    return sendJson(res, 200, orders);
  }

  async assignDeliveryBoy(req, res, orderId) {
    const body = await parseBody(req);
    const deliveryBoyId = body.deliveryBoyId;
    if (!deliveryBoyId) return sendJson(res, 400, { error: 'deliveryBoyId is required' });

    try {
      const updated = deliveryService.assignOrder(orderId, deliveryBoyId, req.auth ? req.auth.user : null);
      return sendJson(res, 200, { success: true, order: updated });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }
}

module.exports = new OwnerController();
