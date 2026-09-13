const LocationService = require('../services/locationService');
module.exports = {
  checkAvailability: (req, res) => res.json({ hub: LocationService.findNearestHub(req.query.pincode) })
};
