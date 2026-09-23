const { ownerController } = require('../controllers');
const { extractUserSession, requireOwner } = require('../middleware');

async function handleOwnerRoutes(req, res, pathname, method) {
  if (pathname === '/api/owner/metrics' && method === 'GET') {
    const isAuth = requireOwner(req, res);
    if (!isAuth) return true;
    return ownerController.getMetrics(req, res);
  }

  if (pathname === '/api/owner/staff' && method === 'GET') {
    const isAuth = requireOwner(req, res);
    if (!isAuth) return true;
    return ownerController.getStaff(req, res);
  }

  if (pathname === '/api/owner/fleet' && method === 'GET') {
    const isAuth = requireOwner(req, res);
    if (!isAuth) return true;
    return ownerController.getStaff(req, res);
  }

  if (pathname === '/api/owner/orders' && method === 'GET') {
    const isAuth = requireOwner(req, res);
    if (!isAuth) return true;
    return ownerController.getAllOrders(req, res);
  }

  // /api/owner/orders/:id/assign
  const assignMatch = pathname.match(/^\/api\/owner\/orders\/([^\/]+)\/assign$/);
  if (assignMatch && method === 'POST') {
    const isAuth = requireOwner(req, res);
    if (!isAuth) return true;
    return ownerController.assignDeliveryBoy(req, res, assignMatch[1]);
  }

  return false;
}

module.exports = handleOwnerRoutes;
