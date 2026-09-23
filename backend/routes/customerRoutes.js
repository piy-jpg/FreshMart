const { customerController } = require('../controllers');
const { extractUserSession } = require('../middleware');

async function handleCustomerRoutes(req, res, pathname, method) {
  if (pathname === '/api/addresses' && method === 'GET') {
    req.auth = extractUserSession(req);
    return customerController.getAddresses(req, res);
  }
  if (pathname === '/api/addresses' && method === 'POST') {
    req.auth = extractUserSession(req);
    return customerController.saveAddress(req, res);
  }
  if (pathname === '/api/customer/orders' && method === 'GET') {
    req.auth = extractUserSession(req);
    return customerController.getMyOrders(req, res);
  }

  return false;
}

module.exports = handleCustomerRoutes;
