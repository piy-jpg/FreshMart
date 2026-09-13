const { HUBS } = require('../config/maps');
class LocationService {
  static findNearestHub(pincode) {
    return HUBS.find(h => h.pincodes.includes(String(pincode))) || HUBS[0];
  }
}
module.exports = LocationService;
