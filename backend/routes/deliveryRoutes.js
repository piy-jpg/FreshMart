const { deliveryController } = require('../controllers');
const { extractUserSession } = require('../middleware');

async function handleDeliveryRoutes(req, res, pathname, method) {
  if (pathname === '/api/delivery/orders' && method === 'GET') {
    req.auth = extractUserSession(req);
    return deliveryController.getMyDeliveries(req, res);
  }

  // /api/delivery/orders/:id/accept
  const acceptMatch = pathname.match(/^\/api\/delivery\/orders\/([^\/]+)\/accept$/);
  if (acceptMatch && method === 'POST') {
    req.auth = extractUserSession(req);
    return deliveryController.acceptHandover(req, res, acceptMatch[1]);
  }

  // /api/delivery/orders/:id/pickup
  const pickupMatch = pathname.match(/^\/api\/delivery\/orders\/([^\/]+)\/pickup$/);
  if (pickupMatch && method === 'POST') {
    req.auth = extractUserSession(req);
    return deliveryController.pickupOrder(req, res, pickupMatch[1]);
  }

  // /api/delivery/orders/:id/start-delivery
  const startMatch = pathname.match(/^\/api\/delivery\/orders\/([^\/]+)\/start-delivery$/);
  if (startMatch && method === 'POST') {
    req.auth = extractUserSession(req);
    return deliveryController.startDelivery(req, res, startMatch[1]);
  }

  // /api/delivery/orders/:id/arrived
  const arrivedMatch = pathname.match(/^\/api\/delivery\/orders\/([^\/]+)\/arrived$/);
  if (arrivedMatch && method === 'POST') {
    req.auth = extractUserSession(req);
    return deliveryController.markArrived(req, res, arrivedMatch[1]);
  }

  return false;
}

module.exports = handleDeliveryRoutes;
