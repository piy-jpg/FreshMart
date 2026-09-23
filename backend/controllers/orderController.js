const { orderService, paymentService } = require('../services');
const { validateOrderCreation, validateOTPVerification } = require('../validators');
const { sendJson, parseBody } = require('../../shared/utilities');
const { orderRepository } = require('../repositories');

class OrderController {
  async create(req, res) {
    const body = await parseBody(req);
    const validation = validateOrderCreation(body);
    if (!validation.valid) {
      return sendJson(res, 400, { error: validation.error });
    }

    try {
      const order = orderService.createOrder(validation.data, req.auth ? req.auth.user : null);
      return sendJson(res, 201, { success: true, order });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  async getById(req, res, orderId) {
    const order = orderRepository.getById(orderId);
    if (!order) {
      return sendJson(res, 404, { error: 'Order not found' });
    }
    return sendJson(res, 200, order);
  }

  async updateStatus(req, res, orderId) {
    const body = await parseBody(req);
    const targetStatus = body.status;
    if (!targetStatus) {
      return sendJson(res, 400, { error: 'Status is required' });
    }

    try {
      const updated = orderService.transitionOrderStep(orderId, targetStatus, req.auth ? req.auth.user : null);
      return sendJson(res, 200, { success: true, order: updated });
    } catch (err) {
      const statusCode = err.statusCode || 400;
      return sendJson(res, statusCode, { error: err.message });
    }
  }

  async verifyOTP(req, res, orderId) {
    const body = await parseBody(req);
    const validation = validateOTPVerification(body.otp);
    if (!validation.valid) {
      return sendJson(res, 400, { error: validation.error });
    }

    try {
      const updated = orderService.verifyOrderOTP(orderId, validation.otp, req.auth ? req.auth.user : null);
      return sendJson(res, 200, { success: true, order: updated, message: 'OTP verified successfully' });
    } catch (err) {
      const statusCode = err.statusCode || 400;
      return sendJson(res, statusCode, { error: err.message });
    }
  }

  async collectCOD(req, res, orderId) {
    const body = await parseBody(req);
    try {
      const updated = paymentService.collectCODCash(orderId, body.amount, req.auth ? req.auth.user : null);
      return sendJson(res, 200, { success: true, order: updated, message: 'Cash collection recorded' });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }
}

module.exports = new OrderController();
