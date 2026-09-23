const { orderController } = require('../controllers');
const { extractUserSession } = require('../middleware');

async function handleOrderRoutes(req, res, pathname, method) {
  if (pathname === '/api/orders' && method === 'POST') {
    req.auth = extractUserSession(req);
    return orderController.create(req, res);
  }

  // /api/orders/:id/status
  const statusMatch = pathname.match(/^\/api\/orders\/([^\/]+)\/status$/);
  if (statusMatch && (method === 'PATCH' || method === 'POST' || method === 'PUT')) {
    req.auth = extractUserSession(req);
    return orderController.updateStatus(req, res, statusMatch[1]);
  }

  // /api/orders/:id/verify-otp
  const otpMatch = pathname.match(/^\/api\/orders\/([^\/]+)\/verify-otp$/);
  if (otpMatch && method === 'POST') {
    req.auth = extractUserSession(req);
    return orderController.verifyOTP(req, res, otpMatch[1]);
  }

  // /api/orders/:id/collect-cod
  const codMatch = pathname.match(/^\/api\/orders\/([^\/]+)\/collect-cod$/);
  if (codMatch && method === 'POST') {
    req.auth = extractUserSession(req);
    return orderController.collectCOD(req, res, codMatch[1]);
  }

  // /api/orders/:id
  const idMatch = pathname.match(/^\/api\/orders\/([^\/]+)$/);
  if (idMatch && method === 'GET') {
    return orderController.getById(req, res, idMatch[1]);
  }

  return false;
}

module.exports = handleOrderRoutes;
