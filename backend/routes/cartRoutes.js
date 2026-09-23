const { cartController } = require('../controllers');
const { extractUserSession } = require('../middleware');

async function handleCartRoutes(req, res, pathname, method) {
  if (pathname === '/api/cart' && method === 'GET') {
    req.auth = extractUserSession(req);
    return cartController.getCart(req, res);
  }
  if (pathname === '/api/cart' && method === 'POST') {
    req.auth = extractUserSession(req);
    return cartController.saveCart(req, res);
  }
  if (pathname === '/api/cart/merge' && method === 'POST') {
    req.auth = extractUserSession(req);
    return cartController.mergeCart(req, res);
  }
  return false;
}

module.exports = handleCartRoutes;
