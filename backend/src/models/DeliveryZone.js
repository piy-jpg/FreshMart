class DeliveryZone {
  static isValidPincode(pincode, hubs = []) {
    return hubs.some(h => (h.pincodes || []).includes(String(pincode)));
  }
}
module.exports = DeliveryZone;
