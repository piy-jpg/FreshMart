const { locationController } = require('../controllers');

async function handleLocationRoutes(req, res, pathname, method, queryParams) {
  if (pathname === '/api/locations' && method === 'GET') {
    return locationController.getServiceableLocations(req, res);
  }
  if (pathname === '/api/location/check' && method === 'GET') {
    const lat = queryParams.get('lat') || 28.5993;
    const lng = queryParams.get('lng') || 77.3872;
    return locationController.checkDeliveryServiceability(req, res, lat, lng);
  }

  return false;
}

module.exports = handleLocationRoutes;
