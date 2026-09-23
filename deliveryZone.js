/**
 * ========================================================
 * SABJIHUB DELIVERY ZONE VERIFICATION SERVICE
 * Calculates serviceability & real-time delivery ETA
 * ========================================================
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SabjiHubDeliveryZone = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // Active delivery hubs with operational radii (in kilometers)
  const DELIVERY_HUBS = [
    {
      id: 'hub_noida_central',
      name: 'Noida Central Hub (Sec 62 / Garhi)',
      lat: 28.5800,
      lng: 77.3400,
      radiusKm: 25,
      etaBase: '20 mins',
      zone: 'Noida'
    },
    {
      id: 'hub_greater_noida',
      name: 'Greater Noida & Pari Chowk Hub',
      lat: 28.4744,
      lng: 77.5040,
      radiusKm: 22,
      etaBase: '20 mins',
      zone: 'Greater Noida'
    },
    {
      id: 'hub_ghaziabad',
      name: 'Ghaziabad & Indirapuram Hub',
      lat: 28.6692,
      lng: 77.4538,
      radiusKm: 22,
      etaBase: '20 mins',
      zone: 'Ghaziabad'
    },
    {
      id: 'hub_delhi_ncr',
      name: 'Delhi NCR Hub (South / East / Central)',
      lat: 28.6139,
      lng: 77.2090,
      radiusKm: 28,
      etaBase: '20 mins',
      zone: 'Delhi'
    },
    {
      id: 'hub_gurugram',
      name: 'Gurugram Cybercity Hub',
      lat: 28.4595,
      lng: 77.0266,
      radiusKm: 25,
      etaBase: '20 mins',
      zone: 'Gurugram'
    },
    {
      id: 'hub_bengaluru',
      name: 'Bengaluru Express Hub (Indiranagar)',
      lat: 12.9716,
      lng: 77.5946,
      radiusKm: 25,
      etaBase: '20 mins',
      zone: 'Bengaluru'
    }
  ];

  /**
   * Haversine formula to compute great-circle distance between two coordinates in km
   */
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * FEATURE 6: Check if SabjiHub delivers to the selected location
   * @param {number} latitude
   * @param {number} longitude
   * @returns {{
   *   serviceable: boolean,
   *   eta: string,
   *   zone?: string,
   *   hubName?: string,
   *   distanceKm?: number,
   *   message: string
   * }}
   */
  function checkDeliveryAvailability(latitude, longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return {
        serviceable: false,
        eta: '',
        message: 'Invalid location coordinates'
      };
    }

    let nearestHub = null;
    let minDistance = Infinity;

    for (const hub of DELIVERY_HUBS) {
      const dist = calculateDistanceKm(lat, lng, hub.lat, hub.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestHub = hub;
      }
    }

    // Check if within nearest hub's operational radius
    if (nearestHub && minDistance <= nearestHub.radiusKm) {
      // Dynamic ETA based on distance
      let eta = nearestHub.etaBase || '20 mins';
      if (minDistance <= 3) {
        eta = '15 mins';
      } else if (minDistance <= 10) {
        eta = '20 mins';
      } else {
        eta = '25 mins';
      }

      return {
        serviceable: true,
        eta,
        zone: nearestHub.zone,
        hubName: nearestHub.name,
        distanceKm: Math.round(minDistance * 10) / 10,
        message: `Delivery available • Delivery in ${eta}`
      };
    }

    return {
      serviceable: false,
      eta: '',
      distanceKm: nearestHub ? Math.round(minDistance * 10) / 10 : null,
      message: 'Sorry! We do not deliver to this location yet.'
    };
  }

  return {
    DELIVERY_HUBS,
    calculateDistanceKm,
    checkDeliveryAvailability
  };
}));
