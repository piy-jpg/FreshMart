const handleAuthRoutes = require('./authRoutes');
const handleCartRoutes = require('./cartRoutes');
const handleOrderRoutes = require('./orderRoutes');
const handleDeliveryRoutes = require('./deliveryRoutes');
const handleOwnerRoutes = require('./ownerRoutes');
const handleProductRoutes = require('./productRoutes');
const handleCustomerRoutes = require('./customerRoutes');
const handleLocationRoutes = require('./locationRoutes');

async function handleApiRoutes(req, res, pathname, method, queryParams) {
  if (await handleAuthRoutes(req, res, pathname, method)) return true;
  if (await handleCartRoutes(req, res, pathname, method)) return true;
  if (await handleOrderRoutes(req, res, pathname, method)) return true;
  if (await handleDeliveryRoutes(req, res, pathname, method)) return true;
  if (await handleOwnerRoutes(req, res, pathname, method)) return true;
  if (await handleProductRoutes(req, res, pathname, method)) return true;
  if (await handleCustomerRoutes(req, res, pathname, method)) return true;
  if (await handleLocationRoutes(req, res, pathname, method, queryParams)) return true;
  return false;
}

module.exports = handleApiRoutes;
