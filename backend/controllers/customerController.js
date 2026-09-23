const { addressRepository, orderRepository } = require('../repositories');
const { sendJson, parseBody } = require('../../shared/utilities');

class CustomerController {
  async getAddresses(req, res) {
    if (!req.auth || !req.auth.user) {
      return sendJson(res, 200, []);
    }
    const addresses = addressRepository.getByUserId(req.auth.user.id);
    return sendJson(res, 200, addresses);
  }

  async saveAddress(req, res) {
    if (!req.auth || !req.auth.user) {
      return sendJson(res, 401, { error: 'Authentication required' });
    }
    const body = await parseBody(req);
    const newAddress = {
      id: 'addr_' + Date.now(),
      userId: req.auth.user.id,
      ...body,
      createdAt: new Date().toISOString()
    };
    addressRepository.create(newAddress);
    return sendJson(res, 201, { success: true, address: newAddress });
  }

  async getMyOrders(req, res) {
    if (!req.auth || !req.auth.user) {
      return sendJson(res, 200, []);
    }
    const orders = orderRepository.getByCustomerId(req.auth.user.id);
    return sendJson(res, 200, orders);
  }
}

module.exports = new CustomerController();
