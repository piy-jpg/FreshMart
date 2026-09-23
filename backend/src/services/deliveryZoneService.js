const { HUBS } = require('../config/maps');
class DeliveryZoneService {
  static isEligible(pincode) {
    return HUBS.some(h => h.pincodes.includes(String(pincode)));
  }
}
module.exports = DeliveryZoneService;
