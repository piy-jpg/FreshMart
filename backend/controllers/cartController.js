const { cartService } = require('../services');
const { sendJson, parseBody } = require('../../shared/utilities');

class CartController {
  async getCart(req, res) {
    if (!req.auth || !req.auth.user) {
      return sendJson(res, 200, { items: {} });
    }
    const items = cartService.getCart(req.auth.user.id);
    return sendJson(res, 200, { items: items || {} });
  }

  async saveCart(req, res) {
    if (!req.auth || !req.auth.user) {
      return sendJson(res, 401, { error: 'Authentication required' });
    }
    const body = await parseBody(req);
    cartService.saveCart(req.auth.user.id, body.items || {});
    return sendJson(res, 200, { success: true });
  }

  async mergeCart(req, res) {
    const body = await parseBody(req);
    const guestCart = body.guestCart || {};
    if (!req.auth || !req.auth.user) {
      return sendJson(res, 200, { cart: guestCart });
    }
    const merged = cartService.mergeCart(req.auth.user.id, guestCart);
    return sendJson(res, 200, { success: true, cart: merged });
  }
}

module.exports = new CartController();
