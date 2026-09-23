const { locationService } = require('../services');
const { sendJson } = require('../../shared/utilities');

class LocationController {
  async getServiceableLocations(req, res) {
    const list = locationService.getLocalGeoDatabase();
    return sendJson(res, 200, list);
  }

  async checkDeliveryServiceability(req, res, lat, lng) {
    const result = locationService.checkServiceability(Number(lat), Number(lng));
    return sendJson(res, 200, result);
  }
}

module.exports = new LocationController();
