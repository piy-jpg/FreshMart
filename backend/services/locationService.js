const { calculateHaversineDistanceKm } = require('../../shared/utilities');
const { APP_CONSTANTS } = require('../../shared/constants');

const LOCAL_GEO_DATABASE = [
  {
    id: 'loc_noida_garhi',
    shortAddress: 'Garhi, Noida',
    address: 'Garhi Chaukhandi, Sector 68 / 121, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301',
    city: 'Noida',
    postalCode: '201301',
    lat: 28.5993,
    lng: 77.3872,
    serviceable: true,
    etaMinutes: 20
  },
  {
    id: 'loc_noida_sec62',
    shortAddress: 'Sector 62, Noida',
    address: 'Sector 62 Institutional Area, Noida, Uttar Pradesh 201309',
    city: 'Noida',
    postalCode: '201309',
    lat: 28.6280,
    lng: 77.3649,
    serviceable: true,
    etaMinutes: 25
  },
  {
    id: 'loc_bengaluru_hal',
    shortAddress: 'HAL, Bengaluru',
    address: 'HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    city: 'Bengaluru',
    postalCode: '560038',
    lat: 12.9698,
    lng: 77.6499,
    serviceable: true,
    etaMinutes: 20
  }
];

class LocationService {
  checkServiceability(lat, lng) {
    const store = APP_CONSTANTS.STORE_ORIGIN;
    const distanceKm = calculateHaversineDistanceKm(lat, lng, store.lat, store.lng);
    const serviceable = distanceKm <= APP_CONSTANTS.MAX_DELIVERY_RADIUS_KM;
    const etaMinutes = distanceKm <= 5 ? 15 : distanceKm <= 12 ? 25 : 35;
    const deliveryFee = distanceKm <= 5 ? 20 : distanceKm <= 10 ? 35 : 50;

    return {
      serviceable,
      distanceKm,
      etaMinutes,
      deliveryFee,
      freeDeliveryEligible: true
    };
  }

  getLocalGeoDatabase() {
    return LOCAL_GEO_DATABASE;
  }
}

module.exports = new LocationService();
