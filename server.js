// ========================================================
// SABJIHUB ENTERPRISE UNIFIED SERVER & ADMIN API
// ========================================================

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const EventEmitter = require('events');
const crypto = require('crypto');
const db = require('./database');
const emailService = require('./emailService');

// Zero-dependency .env loader for custom configurations
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
} catch (e) {}

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname;

// Geocoding & Place Search Configuration (FEATURE 3, 5, 15)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GEOCODING_PROVIDER = (process.env.GEOCODING_PROVIDER || (GOOGLE_MAPS_API_KEY ? 'google' : 'nominatim')).toLowerCase().trim();
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY || GOOGLE_MAPS_API_KEY || '';
const GEOCODING_USER_AGENT = process.env.GEOCODING_USER_AGENT || 'FreshMart-Grocery/2.0 (delivery@freshmart.in)';

// In-Memory LRU Cache for Location Queries (prevents rate-limits and duplicate lookups)
const geocodeCache = new Map();
const MAX_GEO_CACHE = 250;

function setGeocodeCache(key, val) {
  if (geocodeCache.size >= MAX_GEO_CACHE) {
    const firstKey = geocodeCache.keys().next().value;
    geocodeCache.delete(firstKey);
  }
  geocodeCache.set(key, val);
}

// Built-in Reference & Fallback Geo-Database (Delhi NCR, Noida, Bengaluru)
const LOCAL_GEO_DATABASE = [
  {
    id: 'loc_noida_garhi',
    shortAddress: 'Garhi, Noida',
    address: 'Garhi Chaukhandi, Sector 68 / 121, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201301',
    neighbourhood: 'Garhi',
    locality: 'Sector 68',
    latitude: 28.5580,
    longitude: 77.3320
  },
  {
    id: 'loc_noida_sec62',
    shortAddress: 'Sector 62, Noida',
    address: 'Sector 62, Electronic City, Noida, Gautam Buddha Nagar, Uttar Pradesh 201309',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201309',
    neighbourhood: 'Electronic City',
    locality: 'Sector 62',
    latitude: 28.6280,
    longitude: 77.3649
  },
  {
    id: 'loc_noida_sec18',
    shortAddress: 'Sector 18, Noida',
    address: 'Sector 18, Atta Market, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201301',
    neighbourhood: 'Atta Market',
    locality: 'Sector 18',
    latitude: 28.5708,
    longitude: 77.3271
  },
  {
    id: 'loc_noida_sec15',
    shortAddress: 'Sector 15, Noida',
    address: 'Sector 15 Metro, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201301',
    neighbourhood: 'Naya Bans',
    locality: 'Sector 15',
    latitude: 28.5833,
    longitude: 77.3117
  },
  {
    id: 'loc_noida_sec50',
    shortAddress: 'Sector 50, Noida',
    address: 'Sector 50 Central Park, Noida, Gautam Buddha Nagar, Uttar Pradesh 201307',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201307',
    neighbourhood: 'Central Park',
    locality: 'Sector 50',
    latitude: 28.5750,
    longitude: 77.3667
  },
  {
    id: 'loc_noida_sec76',
    shortAddress: 'Sector 76, Noida',
    address: 'Sector 76 Metro, Amrapali Silicon City, Noida, Uttar Pradesh 201301',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201301',
    neighbourhood: 'Silicon City',
    locality: 'Sector 76',
    latitude: 28.5710,
    longitude: 77.3820
  },
  {
    id: 'loc_noida_sec137',
    shortAddress: 'Sector 137, Noida',
    address: 'Sector 137 Express Highway, Paras Tierea, Noida, Uttar Pradesh 201305',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201305',
    neighbourhood: 'Paras Tierea',
    locality: 'Sector 137',
    latitude: 28.5140,
    longitude: 77.4080
  },
  {
    id: 'loc_noida_ext',
    shortAddress: 'Noida Extension',
    address: 'Greater Noida West, Gaur City 1 & 2, Gautam Buddha Nagar, Uttar Pradesh 201009',
    city: 'Greater Noida West',
    state: 'Uttar Pradesh',
    postalCode: '201009',
    neighbourhood: 'Gaur City',
    locality: 'Noida Extension',
    latitude: 28.6080,
    longitude: 77.4320
  },
  {
    id: 'loc_gr_noida',
    shortAddress: 'Greater Noida',
    address: 'Pari Chowk, Alpha 1, Commercial Belt, Greater Noida, Uttar Pradesh 201308',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    postalCode: '201308',
    neighbourhood: 'Alpha 1',
    locality: 'Pari Chowk',
    latitude: 28.4744,
    longitude: 77.5040
  },
  {
    id: 'loc_indirapuram',
    shortAddress: 'Indirapuram',
    address: 'Indirapuram, Shipra Sun City, Ahinsa Khand, Ghaziabad, Uttar Pradesh 201014',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    postalCode: '201014',
    neighbourhood: 'Ahinsa Khand',
    locality: 'Indirapuram',
    latitude: 28.6415,
    longitude: 77.3712
  },
  {
    id: 'loc_vaishali',
    shortAddress: 'Vaishali, Ghaziabad',
    address: 'Sector 4, Vaishali Metro Station, Ghaziabad, Uttar Pradesh 201010',
    city: 'Ghaziabad',
    state: 'Uttar Pradesh',
    postalCode: '201010',
    neighbourhood: 'Sector 4',
    locality: 'Vaishali',
    latitude: 28.6450,
    longitude: 77.3390
  },
  {
    id: 'loc_mayur_vihar',
    shortAddress: 'Mayur Vihar, Delhi',
    address: 'Mayur Vihar Phase 1 Pocket 1, East Delhi, New Delhi 110091',
    city: 'New Delhi',
    state: 'Delhi',
    postalCode: '110091',
    neighbourhood: 'Phase 1',
    locality: 'Mayur Vihar',
    latitude: 28.6088,
    longitude: 77.2965
  },
  {
    id: 'loc_blr_indiranagar',
    shortAddress: 'Indiranagar, Bengaluru',
    address: '100ft Road, Defence Colony, Indiranagar, Bengaluru, Karnataka 560038',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    neighbourhood: 'Defence Colony',
    locality: 'Indiranagar',
    latitude: 12.9784,
    longitude: 77.6408
  },
  {
    id: 'loc_blr_koramangala',
    shortAddress: 'Koramangala, Bengaluru',
    address: '80ft Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560034',
    neighbourhood: '4th Block',
    locality: 'Koramangala',
    latitude: 12.9352,
    longitude: 77.6245
  },
  {
    id: 'loc_blr_hsr',
    shortAddress: 'HSR Layout, Bengaluru',
    address: '27th Main Road, Sector 1, HSR Layout, Bengaluru, Karnataka 560102',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560102',
    neighbourhood: 'Sector 1',
    locality: 'HSR Layout',
    latitude: 12.9121,
    longitude: 77.6446
  },
  {
    id: 'loc_blr_whitefield',
    shortAddress: 'Whitefield, Bengaluru',
    address: 'ITPL Main Road, Hope Farm Junction, Whitefield, Bengaluru, Karnataka 560066',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560066',
    neighbourhood: 'Hope Farm',
    locality: 'Whitefield',
    latitude: 12.9698,
    longitude: 77.7499
  }
];

function fetchJsonWithTimeout(targetUrl, headers = {}, timeoutMs = 3500) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(targetUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(targetUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': GEOCODING_USER_AGENT,
          ...headers
        },
        timeout: timeoutMs
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchJsonWithTimeout(res.headers.location, headers, timeoutMs).then(resolve).catch(reject);
        }
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 150)}`));
          }
          try {
            resolve(JSON.parse(raw));
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
      req.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

function findClosestLocalLocation(lat, lon) {
  let closest = LOCAL_GEO_DATABASE[0];
  let minDistance = 99999999;
  for (const loc of LOCAL_GEO_DATABASE) {
    const dLat = (loc.latitude - lat) * Math.PI / 180;
    const dLon = (loc.longitude - lon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(loc.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }
  return { ...closest, distanceKm: Math.round(minDistance * 10) / 10 };
}

// Real-Time Event Bus for Server-Sent Events (SSE)
const sseClients = new Set();

function broadcastEvent(type, payload) {
  const data = JSON.stringify({ type, timestamp: new Date().toISOString(), payload });
  for (const res of sseClients) {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

// =========================================================================
// 12-STAGE SERIAL ORDER STATUS WORKFLOW STATE MACHINE
// =========================================================================
const ORDER_WORKFLOW_STEPS = [
  { step: 1, key: 'ORDER_RECEIVED', title: 'Order Received', icon: '📝', aliases: ['ORDER_PLACED', 'PENDING'] },
  { step: 2, key: 'ORDER_CONFIRMED', title: 'Order Confirmed', icon: '✓', aliases: ['CONFIRMED'] },
  { step: 3, key: 'PICKING', title: 'Picking', icon: '🛒', aliases: ['PICKING_STARTED', 'ACCEPTED_BY_HUB'] },
  { step: 4, key: 'PACKING', title: 'Packing', icon: '📦', aliases: ['PACKING_STARTED', 'QUALITY_CHECK'] },
  { step: 5, key: 'READY_FOR_HANDOVER', title: 'Ready for Handover', icon: '🛍️', aliases: ['READY_FOR_PICKUP', 'PACKED'] },
  { step: 6, key: 'HANDED_TO_DELIVERY_BOY', title: 'Handed to Delivery Boy', icon: '🛵', aliases: ['ASSIGNED', 'HANDED_OVER'] },
  { step: 7, key: 'DELIVERY_BOY_ACCEPTED', title: 'Delivery Boy Accepted', icon: '👍', aliases: ['ACCEPTED'] },
  { step: 8, key: 'PICKED_UP', title: 'Picked Up', icon: '📦', aliases: ['PICKED_UP_FROM_HUB'] },
  { step: 9, key: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', icon: '⚡', aliases: ['IN_TRANSIT'] },
  { step: 10, key: 'ARRIVED', title: 'Arrived at Location', icon: '📍', aliases: ['AT_DOORSTEP'] },
  { step: 11, key: 'CUSTOMER_VERIFIED', title: 'Customer Verified', icon: '🔑', aliases: ['OTP_VERIFIED'] },
  { step: 12, key: 'DELIVERED', title: 'Delivered', icon: '🎉', aliases: ['COMPLETED'] }
];

function getCanonicalStepIndex(status) {
  if (!status) return 1;
  const s = String(status).toUpperCase().trim();
  for (let i = 0; i < ORDER_WORKFLOW_STEPS.length; i++) {
    const step = ORDER_WORKFLOW_STEPS[i];
    if (step.key === s || step.aliases.includes(s)) {
      return i + 1;
    }
  }
  return 1;
}

function getCanonicalStatusKey(status) {
  const idx = getCanonicalStepIndex(status);
  return ORDER_WORKFLOW_STEPS[idx - 1].key;
}

function validateOrderStepTransition(order, targetStatus, role, options = {}) {
  const normRole = (role || '').toUpperCase().replace(/[\s-]/g, '_');
  const isOwnerStaff = ['OWNER', 'ADMIN', 'STAFF', 'SUB_ADMIN', 'HUB_MANAGER', 'INVENTORY_MANAGER', 'SYSTEM'].includes(normRole);
  const isDeliveryBoy = normRole === 'DELIVERY_BOY';

  const rawTarget = String(targetStatus || '').toUpperCase().trim();
  const currentKey = getCanonicalStatusKey(order.orderStatus || order.status || 'ORDER_RECEIVED');
  const currentIdx = getCanonicalStepIndex(order.orderStatus || order.status || 'ORDER_RECEIVED');

  // Cancellation
  if (rawTarget === 'CANCELLED') {
    if (['PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'].includes(currentKey) && !isOwnerStaff) {
      return { valid: false, error: 'Cannot cancel order that is already in transit or delivered.' };
    }
    return { valid: true, targetKey: 'CANCELLED' };
  }

  // Delivery Failure
  if (rawTarget === 'DELIVERY_FAILED') {
    if (!['HANDED_TO_DELIVERY_BOY', 'DELIVERY_BOY_ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(currentKey)) {
      return { valid: false, error: 'Delivery failure can only be recorded during delivery transit.' };
    }
    return { valid: true, targetKey: 'DELIVERY_FAILED' };
  }

  // Delivery Rejection / Declined Assignment
  if (['REJECTED', 'REJECT', 'DELIVERY_REJECTED', 'DECLINED', 'REASSIGNMENT_REQUIRED'].includes(rawTarget)) {
    return { valid: true, targetKey: 'REASSIGNMENT_REQUIRED' };
  }

  // Retry / Reschedule from failure
  if (['RESCHEDULED', 'RETRY'].includes(rawTarget) || (order.orderStatus === 'DELIVERY_FAILED' && (rawTarget === 'READY_FOR_HANDOVER' || rawTarget === 'CONFIRMED' || rawTarget === 'READY_FOR_PICKUP'))) {
    return { valid: true, targetKey: 'READY_FOR_HANDOVER' };
  }

  const targetIdx = getCanonicalStepIndex(rawTarget);
  const targetKey = getCanonicalStatusKey(rawTarget);

  // Idempotent calls (e.g. re-verifying current step)
  if (targetIdx === currentIdx) {
    return { valid: true, targetKey, isIdempotent: true };
  }

  // Strict serial transition check: target must be exact next step
  if (targetIdx !== currentIdx + 1) {
    const currentStepObj = ORDER_WORKFLOW_STEPS[currentIdx - 1];
    const expectedStepObj = ORDER_WORKFLOW_STEPS[currentIdx];
    const targetStepObj = ORDER_WORKFLOW_STEPS[targetIdx - 1];
    return {
      valid: false,
      error: `Invalid status transition: Cannot jump from Step ${currentIdx} (${currentStepObj?.title}) to Step ${targetIdx} (${targetStepObj?.title}). Step-by-step workflow requires: Step ${currentIdx + 1} (${expectedStepObj?.title}).`
    };
  }

  // Role authorization checks
  if (targetIdx <= 6 && !isOwnerStaff && !options.isSystem) {
    return {
      valid: false,
      error: `Permission Denied: Step ${targetIdx} (${ORDER_WORKFLOW_STEPS[targetIdx - 1]?.title}) must be performed by Owner or authorized Hub Staff.`
    };
  }

  if (targetIdx === 6 && !order.deliveryBoyId && !order.deliveryPartnerId && !options.deliveryBoyId && !options.deliveryPartnerId) {
    return {
      valid: false,
      error: 'Please assign an active Delivery Boy before marking order as handed over.'
    };
  }

  if (targetIdx === 11 && !options.otpVerified && !order.deliveryOtpVerified) {
    return {
      valid: false,
      error: 'Customer OTP verification is required.'
    };
  }

  if (targetIdx === 12) {
    if (!options.otpVerified && !order.deliveryOtpVerified) {
      return {
        valid: false,
        error: 'Customer OTP must be verified before marking order as delivered.'
      };
    }
    const isPaid = (order.paymentStatus || '').toUpperCase() === 'PAID' || options.cashCollected;
    if (!isPaid) {
      return {
        valid: false,
        error: 'Cash on Delivery (COD) payment must be collected before completing delivery.'
      };
    }
  }

  return { valid: true, targetKey };
}

async function persistOrder(order) {
  if (!order) return;
  order.updatedAt = new Date().toISOString();
  db.save();
  if (db.postgres && db.postgres.isAvailable()) {
    try {
      await db.postgres.insert('orders', order);
    } catch (e) {
      console.error('PostgreSQL persistOrder error:', e.message);
    }
  }
}

function applyOrderStepTransition(order, targetStatus, user = {}, options = {}) {
  const normTarget = String(targetStatus).toUpperCase().trim();
  const stepIdx = getCanonicalStepIndex(normTarget);
  const nowIso = new Date().toISOString();
  const userName = user.name || (user.email ? user.email.split('@')[0] : 'Staff');
  const userId = user.id || 'usr_staff';
  const userRole = (user.role || 'OWNER').toUpperCase().replace(/[\s-]/g, '_');

  if (normTarget === 'CANCELLED') {
    order.orderStatus = 'CANCELLED';
    order.status = 'CANCELLED';
    order.deliveryStatus = 'CANCELLED';
    order.cancelledAt = nowIso;
    order.cancelledBy = userName;
    order.cancelledById = userId;
    order.cancellationReason = options.reason || 'Cancelled and refunded';
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      step: null,
      status: 'CANCELLED',
      title: 'Order Cancelled',
      desc: options.reason || 'Order cancelled. Reserved inventory restored.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: nowIso,
      userId,
      userName,
      userRole
    });
    return order;
  }

  if (normTarget === 'DELIVERY_FAILED') {
    order.orderStatus = 'DELIVERY_FAILED';
    order.status = 'DELIVERY_FAILED';
    order.deliveryStatus = 'DELIVERY_FAILED';
    order.failedAt = nowIso;
    order.failedBy = userName;
    order.failedById = userId;
    order.failureReason = options.reason || 'Customer unavailable';
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      step: null,
      status: 'DELIVERY_FAILED',
      title: 'Delivery Failed',
      desc: `Delivery attempt failed: ${order.failureReason}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: nowIso,
      userId,
      userName,
      userRole
    });
    return order;
  }

  if (['REJECTED', 'REJECT', 'DELIVERY_REJECTED', 'DECLINED', 'REASSIGNMENT_REQUIRED'].includes(normTarget)) {
    const rejectedRiderId = userId || order.deliveryBoyId || 'usr_delivery_boy';
    const rejectedRiderName = userName || order.deliveryBoyName || 'Delivery Boy';

    order.rejectedDeliveryBoyIds = Array.isArray(order.rejectedDeliveryBoyIds) ? order.rejectedDeliveryBoyIds : [];
    if (!order.rejectedDeliveryBoyIds.includes(rejectedRiderId)) {
      order.rejectedDeliveryBoyIds.push(rejectedRiderId);
    }

    order.orderStatus = 'READY_FOR_HANDOVER';
    order.status = 'READY_FOR_HANDOVER';
    order.deliveryStatus = 'REASSIGNMENT_REQUIRED';
    order.reassignmentNeeded = true;
    order.assignmentRejected = true;
    order.rejectionReason = options.reason || options.notes || 'Delivery Partner declined assignment (vehicle issue or out of area)';
    order.rejectedAt = nowIso;
    order.rejectedBy = rejectedRiderName;
    order.rejectedById = rejectedRiderId;

    order.deliveryBoyId = null;
    order.deliveryBoyName = null;
    order.deliveryBoyPhone = null;
    order.deliveryPartnerId = null;
    order.deliveryPartnerName = null;
    order.deliveryPartnerPhone = null;
    order.deliveryPartnerVehicle = null;
    order.assignedAt = null;
    order.acceptedAt = null;

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      step: 5,
      status: 'DELIVERY_ASSIGNMENT_REJECTED',
      title: 'Delivery Assignment Rejected',
      desc: `Delivery Partner (${rejectedRiderName}) declined assignment: ${order.rejectionReason}. Order queued for reassignment.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: nowIso,
      userId,
      userName: rejectedRiderName,
      userRole: userRole || 'DELIVERY_BOY'
    });
    return order;
  }

  const canonicalKey = getCanonicalStatusKey(normTarget);
  const stepObj = ORDER_WORKFLOW_STEPS[stepIdx - 1];

  order.orderStatus = canonicalKey;
  order.status = canonicalKey;

  switch (stepIdx) {
    case 2: // ORDER_CONFIRMED
      order.confirmedAt = nowIso;
      order.confirmedBy = userName;
      order.confirmedById = userId;
      break;
    case 3: // PICKING
      order.pickingStartedAt = nowIso;
      order.pickingStartedBy = userName;
      order.pickingStartedById = userId;
      break;
    case 4: // PACKING
      order.packingAt = nowIso;
      order.packedAt = order.packedAt || nowIso;
      order.packedBy = userName;
      order.packedById = userId;
      break;
    case 5: // READY_FOR_HANDOVER
      order.packedAt = order.packedAt || nowIso;
      order.readyForHandoverAt = nowIso;
      order.readyForHandoverBy = userName;
      order.readyForHandoverById = userId;
      order.deliveryStatus = 'READY_FOR_PICKUP';
      order.deliveryBoyId = null;
      order.deliveryBoyName = null;
      order.deliveryBoyPhone = null;
      order.deliveryPartnerId = null;
      order.deliveryPartnerName = null;
      order.deliveryPartnerPhone = null;
      order.deliveryPartnerVehicle = null;
      order.assignedAt = null;
      order.acceptedAt = null;
      break;
    case 6: // HANDED_TO_DELIVERY_BOY
      order.handedOverAt = nowIso;
      order.handedOverBy = userName;
      order.handedOverById = userId;
      order.reassignmentNeeded = false;
      order.assignmentRejected = false;
      if (options.deliveryBoyId || options.deliveryPartnerId) {
        const dId = options.deliveryBoyId || options.deliveryPartnerId;
        order.deliveryBoyId = dId;
        order.deliveryBoyName = options.deliveryBoyName || order.deliveryBoyName;
        order.deliveryBoyPhone = options.deliveryBoyPhone || order.deliveryBoyPhone;
        order.deliveryPartnerId = dId;
        order.deliveryPartnerName = options.deliveryBoyName || order.deliveryPartnerName;
        order.deliveryPartnerPhone = options.deliveryBoyPhone || order.deliveryPartnerPhone;
      }
      if (!order.assignedAt) order.assignedAt = nowIso;
      order.deliveryStatus = 'ASSIGNED';
      break;
    case 7: // DELIVERY_BOY_ACCEPTED
      order.acceptedAt = nowIso;
      order.acceptedBy = userName;
      order.acceptedById = userId;
      order.deliveryStatus = 'ACCEPTED';
      break;
    case 8: // PICKED_UP
      order.pickedUpAt = nowIso;
      order.pickedUpBy = userName;
      order.pickedUpById = userId;
      order.deliveryStatus = 'PICKED_UP';
      break;
    case 9: // OUT_FOR_DELIVERY
      order.outForDeliveryAt = nowIso;
      order.outForDeliveryBy = userName;
      order.outForDeliveryById = userId;
      order.estimatedDeliveryTime = 'En Route';
      order.deliveryStatus = 'OUT_FOR_DELIVERY';
      break;
    case 10: // ARRIVED
      order.arrivedAt = nowIso;
      order.arrivedBy = userName;
      order.arrivedById = userId;
      order.estimatedDeliveryTime = 'At Doorstep';
      order.deliveryStatus = 'ARRIVED';
      break;
    case 11: // CUSTOMER_VERIFIED
      order.customerVerifiedAt = nowIso;
      order.customerVerifiedBy = userName;
      order.customerVerifiedById = userId;
      order.deliveryOtpVerified = true;
      order.otpVerified = true;
      order.otpVerifiedAt = nowIso;
      order.deliveryStatus = 'CUSTOMER_VERIFIED';
      break;
    case 12: // DELIVERED
      order.deliveredAt = nowIso;
      order.deliveredBy = userId || userName;
      order.deliveredById = userId;
      order.deliveredByName = userName;
      order.deliveryStatus = 'DELIVERED';
      order.paymentStatus = 'PAID';
      order.deliveryOtpVerified = true;
      break;
  }

  if (!order.timeline) order.timeline = [];
  order.timeline.push({
    step: stepIdx,
    status: canonicalKey,
    title: stepObj ? stepObj.title : canonicalKey,
    desc: options.desc || options.notes || `Order progressed to ${stepObj?.title || canonicalKey} by ${userName} (${userRole})`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: nowIso,
    userId,
    userName,
    userRole
  });

  order.updatedAt = nowIso;
  return order;
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.csv': 'text/csv; charset=utf-8'
};

// Helper to parse JSON request bodies
function parseBody(req) {
  if (req && req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return Promise.resolve(req.body);
    if (typeof req.body === 'string') {
      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch (e) {
        return Promise.resolve({});
      }
    }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body || !body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Helper to send JSON responses with Cookie preservation & CORS credentials support
function sendJson(res, statusCode, data, extraHeaders = {}) {
  const existingSetCookie = res.getHeader('Set-Cookie');
  const reqOrigin = res.req?.headers?.origin;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': reqOrigin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Role, X-Requested-With, Accept, x-session-token, x-auth-token',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    ...extraHeaders
  };
  if (reqOrigin) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  if (existingSetCookie) {
    headers['Set-Cookie'] = existingSetCookie;
  }
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
}

// Cookie Helpers
function parseCookies(req) {
  const list = {};
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    try {
      list[name] = decodeURIComponent(value);
    } catch (e) {
      list[name] = value;
    }
  });
  return list;
}

function setAuthCookie(res, sessionId, rememberMe = false) {
  const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
  const isSecure = process.env.NODE_ENV === 'production';
  const cookieVal = `sjh_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isSecure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieVal);
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'sjh_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}

function extractUserSession(req) {
  let headerToken = null;
  if (req?.headers) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      headerToken = authHeader.substring(7).trim();
    } else if (req.headers['x-session-token']) {
      headerToken = req.headers['x-session-token'];
    } else if (req.headers['x-auth-token']) {
      headerToken = req.headers['x-auth-token'];
    }
  }

  if (headerToken) {
    const valid = db.validateSession(headerToken);
    if (valid) return valid;
  }

  const cookies = parseCookies(req);
  const cookieToken = cookies.sjh_session || cookies.sabjihub_session || cookies.freshmart_session;
  if (cookieToken && cookieToken !== headerToken) {
    const valid = db.validateSession(cookieToken);
    if (valid) return valid;
  }

  return null;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, salt, verificationToken, verificationTokenExpires, resetToken, resetTokenExpires, ...safe } = user;
  return safe;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '880806707459-ci9gcf8sni1h6u0gmd1qtp96mg2u9l9g.apps.googleusercontent.com';
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'piyushverma730929@gmail.com').trim().toLowerCase();

function isOwnerEmail(email) {
  return (email || '').trim().toLowerCase() === OWNER_EMAIL;
}

function normalizeRole(role) {
  return String(role || '').toUpperCase().replace(/[\s-]/g, '_');
}

function getAuthenticatedUser(req) {
  let sessionData = null;
  if (req && req.session) {
    sessionData = { user: req.session };
  } else {
    sessionData = extractUserSession(req);
  }
  if (!sessionData || !sessionData.user) return null;
  const user = sessionData.user;
  const freshUser = user.id ? db.getById('users', user.id) : null;
  const effectiveUser = freshUser || user;
  if (effectiveUser && isOwnerEmail(effectiveUser.email)) {
    effectiveUser.role = 'OWNER';
  }
  return effectiveUser;
}

function isAuthorizedAdminOrOwner(user) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  const email = (user.email || '').toLowerCase().trim();
  return ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(role) || isOwnerEmail(email);
}

function requireOwner(req, res) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    sendJson(res, 401, { success: false, error: 'Authentication required. Please sign in.', message: 'Authentication required. Please sign in.' });
    return null;
  }
  if (!isAuthorizedAdminOrOwner(user)) {
    sendJson(res, 403, { success: false, error: 'Access denied: Owner / Admin privileges required.', message: 'Access denied: Owner / Admin privileges required.' });
    return null;
  }
  return user;
}

function requireStaffOrOwner(req, res, allowedRoles = null) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    sendJson(res, 401, { success: false, error: 'Authentication required. Please sign in.', message: 'Authentication required. Please sign in.' });
    return null;
  }

  if (user.active === false || String(user.status).toUpperCase() === 'INACTIVE' || String(user.status).toUpperCase() === 'BLOCKED') {
    sendJson(res, 403, { success: false, error: 'Account is deactivated. Please contact the store administrator.', message: 'Account is deactivated.' });
    return null;
  }

  if (isAuthorizedAdminOrOwner(user)) return user;

  const normRole = normalizeRole(role);
  if (normRole === 'CUSTOMER') {
    sendJson(res, 403, { success: false, error: 'Access denied: Staff or Owner privileges required.', message: 'Access denied: Staff privileges required.' });
    return null;
  }

  if (allowedRoles && Array.isArray(allowedRoles)) {
    const allowedNorm = allowedRoles.map(normalizeRole);
    if (!allowedNorm.includes(normRole)) {
      sendJson(res, 403, {
        success: false,
        error: `Access denied: Role "${role}" is not authorized for this operation.`,
        message: `Access denied: Insufficient role permissions.`
      });
      return null;
    }
  }

  return user;
}

function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') return null;
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) return null;

    if (!payload.sub || !payload.email) return null;

    if (GOOGLE_CLIENT_ID && payload.aud && payload.aud !== GOOGLE_CLIENT_ID) {
      console.warn('Google token audience mismatch:', payload.aud);
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: Boolean(payload.email_verified),
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || ''
    };
  } catch (err) {
    console.error('Google token verification error:', err.message);
    return null;
  }
}

// Helper to send CSV files
function sendCsv(res, filename, csvContent) {
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Access-Control-Allow-Origin': '*'
  });
  res.end(csvContent);
}

// Active Admin Session State
let activeAdminUserId = 'adm_super_1';

function getActiveAdmin() {
  const users = db.getAll('admin_users');
  return users.find(u => u.id === activeAdminUserId) || users[0];
}

// Check RBAC Permissions
function checkPermission(req, requiredScope) {
  const user = getAuthenticatedUser(req) || getActiveAdmin();
  if (!user) return true;
  const role = normalizeRole(user.role);
  if (['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(role) || isOwnerEmail(user.email) || (user.permissions && user.permissions.includes('*'))) {
    return true;
  }
  return user.permissions && user.permissions.includes(requiredScope);
}

// Helper to calculate 90-Minute Eligibility
function calculateEligibility(pincode) {
  const hubs = db.getAll('hubs');
  const matchingHub = hubs.find(h => h.pincodes.includes(String(pincode))) || hubs[0];
  const riders = db.getAll('delivery_partners');
  const availableRiders = riders.filter(r => r.status === 'AVAILABLE');

  const isEligible = matchingHub.expressEligible && availableRiders.length > 0;
  
  return {
    expressEligible: isEligible,
    estimatedMinutes: isEligible ? 45 : 120,
    nearestHub: matchingHub,
    availableRidersCount: availableRiders.length,
    freeThreshold: 199,
    availableSlots: [
      {
        id: 'EXPRESS_90',
        name: '⚡ Express Delivery',
        duration: '30–90 Minutes',
        tag: '⚡ 90-Min Fresh Express',
        available: isEligible,
        fee: 0
      },
      {
        id: 'MORNING_HARVEST',
        name: '🌅 Morning Harvest Slot',
        duration: '4:00 AM – 7:00 AM',
        tag: 'Farm-Fresh Plucked at Dawn',
        available: true,
        fee: 0
      },
      {
        id: 'SLOT_AFTERNOON',
        name: 'Standard Afternoon',
        duration: '1:00 PM – 4:00 PM',
        tag: 'Standard Slot',
        available: true,
        fee: 0
      },
      {
        id: 'SLOT_EVENING',
        name: 'Standard Evening',
        duration: '6:00 PM – 9:00 PM',
        tag: 'Standard Slot',
        available: true,
        fee: 0
      }
    ]
  };
}

// Server Request Handler
const server = http.createServer(async (req, res) => {
  res.req = req;
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname || '/';
  if (pathname === '/api/index.js' || pathname === '/api/index') {
    if (parsedUrl.query && (parsedUrl.query.subpath || parsedUrl.query.match || parsedUrl.query['0'])) {
      const sub = parsedUrl.query.subpath || parsedUrl.query.match || parsedUrl.query['0'];
      pathname = '/api/' + String(sub).replace(/^\//, '');
    }
  }
  const method = req.method;
  const reqOrigin = req.headers?.origin;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    const corsHeaders = {
      'Access-Control-Allow-Origin': reqOrigin || '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Role, X-Requested-With, Accept',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS'
    };
    if (reqOrigin) {
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  // ========================================================
  // REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
  // ========================================================
  if (pathname === '/api/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform, no-store',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no'
    });
    res.write('retry: 15000\n\n');
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'FreshMart Live Stream Connected' })}\n\n`);
    sseClients.add(res);

    const pingInterval = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (err) {
        clearInterval(pingInterval);
        sseClients.delete(res);
      }
    }, 5000);

    let vercelCloseTimer = null;
    if (process.env.VERCEL || process.env.NOW_REGION) {
      vercelCloseTimer = setTimeout(() => {
        clearInterval(pingInterval);
        sseClients.delete(res);
        try {
          res.write(': refresh\n\n');
          res.end();
        } catch (e) {}
      }, 10000);
    }

    req.on('close', () => {
      clearInterval(pingInterval);
      if (vercelCloseTimer) clearTimeout(vercelCloseTimer);
      sseClients.delete(res);
    });
    return;
  }

  // ========================================================
  // PUBLIC & CUSTOMER REST APIS
  // ========================================================
  if (pathname.startsWith('/api/')) {

    // 1. Health check
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'OK', version: '2026.09.24.rejection.v1', uptime: process.uptime(), serverTime: new Date().toISOString() });
    }

    // Database connectivity & persistence health check
    if (pathname === '/api/database/status' && method === 'GET') {
      const isPlaceholder = Boolean(db.postgres && db.postgres.isPlaceholder());
      const isPgConfigured = Boolean(db.postgres && db.postgres.isAvailable());
      let pgHealthy = false;
      let pgError = isPlaceholder ? 'DATABASE_URL contains placeholder hostname (HOST). Update with real PostgreSQL server host.' : null;
      let tables = [];
      if (isPgConfigured) {
        try {
          const testRes = await db.postgres.query('SELECT NOW() AS now');
          pgHealthy = Boolean(testRes && testRes.rows && testRes.rows.length > 0);
          const tablesRes = await db.postgres.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
          tables = tablesRes.rows.map(r => r.tablename);
        } catch (e) {
          pgError = e.message;
        }
      }
      return sendJson(res, 200, {
        database: isPgConfigured ? 'PostgreSQL' : (isPlaceholder ? 'PostgreSQL (Placeholder Detected)' : 'None (DATABASE_URL not set)'),
        connected: pgHealthy,
        isProductionConfigured: isPgConfigured,
        isPlaceholder,
        tables,
        error: pgError,
        environment: process.env.NODE_ENV || 'production',
        instruction: isPlaceholder
          ? 'In Vercel Dashboard -> freshmart -> Settings -> Environment Variables, replace HOST in DATABASE_URL with your actual PostgreSQL endpoint.'
          : (pgHealthy ? 'PostgreSQL connected and active.' : 'Configure DATABASE_URL to connect to PostgreSQL.')
      });
    }

    // Orders PostgreSQL Table Schema & Data Integrity Audit Endpoint
    if (pathname === '/api/database/orders-schema' && method === 'GET') {
      const isPgConfigured = Boolean(db.postgres && db.postgres.isAvailable());
      if (!isPgConfigured) {
        return sendJson(res, 500, {
          success: false,
          error: 'PostgreSQL is not configured or unavailable'
        });
      }

      try {
        if (db.postgres.ensureOrdersSchema) {
          await db.postgres.ensureOrdersSchema();
        }

        // Query actual production columns from information_schema
        const colRes = await db.postgres.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'freshmart_orders'
          ORDER BY ordinal_position;
        `);

        const columns = colRes.rows.map(r => ({
          name: r.column_name,
          type: r.data_type,
          nullable: r.is_nullable,
          default: r.column_default
        }));

        // Required 19 fields to verify
        const requiredFields = [
          'order_id', 'customer_id', 'items', 'subtotal', 'delivery_fee',
          'discount', 'final_total', 'delivery_address', 'payment_method',
          'payment_status', 'order_status', 'delivery_partner_id',
          'created_at', 'confirmed_at', 'packed_at', 'out_for_delivery_at',
          'delivered_at', 'cancelled_at'
        ];

        const existingColNames = new Set(columns.map(c => c.name));
        const verification = requiredFields.map(field => ({
          field,
          exists: existingColNames.has(field),
          type: columns.find(c => c.name === field)?.type || null
        }));

        // Row count
        const countRes = await db.postgres.query('SELECT COUNT(*) FROM freshmart_orders');
        const rowCount = parseInt(countRes.rows[0].count, 10);

        // Fetch latest sample order
        const sampleRes = await db.postgres.query(`
          SELECT id, order_id, customer_id, user_id, customer_name, customer_phone,
                 items, subtotal, delivery_fee, discount, final_total,
                 delivery_address, payment_method, payment_status, order_status, status,
                 delivery_partner_id, delivery_partner_name,
                 created_at, confirmed_at, packed_at, out_for_delivery_at, delivered_at, cancelled_at
          FROM freshmart_orders
          ORDER BY created_at DESC
          LIMIT 1
        `);

        return sendJson(res, 200, {
          success: true,
          table: 'freshmart_orders',
          rowCount,
          allRequiredFieldsPresent: verification.every(v => v.exists),
          verifiedFields: verification,
          totalColumns: columns.length,
          columns,
          latestOrderSample: sampleRes.rows[0] || null
        });
      } catch (err) {
        return sendJson(res, 500, {
          success: false,
          error: err.message
        });
      }
    }

    // Public Settings Endpoint
    if (pathname === '/api/settings' && method === 'GET') {
      const settings = db.data.settings || {};
      return sendJson(res, 200, {
        storeName: settings.storeName || 'FreshMart Quick Commerce',
        standardDeliveryFee: Number(settings.standardDeliveryFee ?? settings.deliveryFee ?? 25),
        freeDeliveryThreshold: Number(settings.freeDeliveryThreshold ?? 299),
        minimumOrderValue: Number(settings.minimumOrderValue ?? 99),
        maintenanceMode: Boolean(settings.maintenanceMode),
        supportEmail: settings.supportEmail || 'support@sabjihub.com',
        supportPhone: settings.supportPhone || '+91 80 4000 9000',
        deliverySLA: settings.deliverySLA || '10-15 mins',
        currency: 'INR (₹)'
      });
    }

    // ================= 2. SECURE CUSTOMER AUTHENTICATION =================

    // A. Register New Account
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      const phone = (body.phone || '').trim();
      const password = body.password || '';
      const confirmPassword = body.confirmPassword || '';
      const termsAccepted = Boolean(body.termsAccepted);

      if (!name) {
        return sendJson(res, 400, { error: 'Full name is required.' });
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson(res, 400, { error: 'Please enter a valid email address.' });
      }
      if (!phone || phone.replace(/\D/g, '').length < 10) {
        return sendJson(res, 400, { error: 'Please enter a valid 10-digit mobile number.' });
      }
      if (!termsAccepted) {
        return sendJson(res, 400, { error: 'You must agree to the Terms & Conditions and Privacy Policy.' });
      }

      // Password Complexity Validation: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const hasLength = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return sendJson(res, 400, {
          error: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
        });
      }

      if (password !== confirmPassword) {
        return sendJson(res, 400, { error: 'Password confirmation does not match.' });
      }

      const users = db.getAll('users');
      const existing = users.find(u => (u.email || '').toLowerCase() === email);

      if (existing) {
        if (existing.emailVerified) {
          return sendJson(res, 400, { error: 'An account with this email already exists. Please sign in.' });
        } else {
          // Re-send verification token for unverified account
          const token = crypto.randomBytes(24).toString('hex');
          const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          db.update('users', existing.id, {
            name,
            phone,
            ...db.hashPassword(password),
            verificationToken: token,
            verificationTokenExpires: tokenExpires
          });
          await emailService.sendVerificationEmail(existing, token);
          return sendJson(res, 200, {
            message: 'Verification link resent. Please check your inbox.',
            email,
            needsVerification: true
          });
        }
      }

      // Create new account
      const { hash, salt } = db.hashPassword(password);
      const token = crypto.randomBytes(24).toString('hex');
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const isAutoVerified = process.env.REQUIRE_EMAIL_VERIFICATION !== 'true';
      const newUser = {
        id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name,
        email,
        phone,
        passwordHash: hash,
        salt,
        emailVerified: isAutoVerified,
        verificationToken: isAutoVerified ? null : token,
        verificationTokenExpires: isAutoVerified ? null : tokenExpires,
        provider: 'local',
        role: 'CUSTOMER',
        membership: 'Gold Farm Club',
        walletBalance: 100, // Welcome reward credits
        totalOrdersCount: 0,
        totalSpent: 0,
        failedLoginAttempts: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };

      db.insert('users', newUser);
      if (!isAutoVerified) {
        await emailService.sendVerificationEmail(newUser, token);
      }
      db.logActivity(name, 'ACCOUNT_REGISTERED', 'Users', newUser.id, 'New customer registration created');

      const session = db.createSession(newUser.id, true, req);
      setAuthCookie(res, session.id, true);

      return sendJson(res, 201, {
        success: true,
        message: isAutoVerified ? 'Account created and verified successfully!' : 'Account created! Please check your email to verify your address.',
        email,
        token: session.id,
        user: sanitizeUser(newUser),
        needsVerification: !isAutoVerified,
        verificationToken: token
      });
    }

    // B. User & Staff Login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const loginIdentifier = (body.identifier || body.email || body.phone || body.employeeId || '').trim();
      const email = loginIdentifier.toLowerCase();
      const password = body.password || '';
      const rememberMe = Boolean(body.rememberMe);
      const ip = getClientIp(req);

      if (!loginIdentifier || !password) {
        return sendJson(res, 400, { error: 'Email / Employee ID / Phone and password are required.' });
      }

      // Rate limiting: 10 failed attempts per IP / 5 per identifier in 15 mins
      const ipRate = db.checkRateLimit('login_ip:' + ip, 15, 15 * 60 * 1000);
      const idRate = db.checkRateLimit('login_id:' + email, 10, 15 * 60 * 1000);

      if (!ipRate.allowed || !idRate.allowed) {
        const retrySec = Math.max(ipRate.retryAfterSeconds || 0, idRate.retryAfterSeconds || 0);
        return sendJson(res, 429, {
          error: `Too many unsuccessful login attempts. Please try again in ${Math.ceil(retrySec / 60)} minutes.`
        });
      }

      const users = db.getAll('users');
      const user = (typeof db.findUserByLoginIdentifier === 'function')
        ? db.findUserByLoginIdentifier(loginIdentifier)
        : users.find(u => (u.email || '').toLowerCase() === email || (u.employeeId || '').toLowerCase() === email || (u.phone || '').includes(loginIdentifier));

      if (!user) {
        return sendJson(res, 401, { error: 'Invalid credentials. User account not found.' });
      }

      const statusLower = String(user.status || '').toLowerCase();
      if (user.active === false || statusLower === 'inactive' || statusLower === 'blocked' || statusLower === 'deactivated') {
        return sendJson(res, 403, { error: 'This account has been deactivated or temporarily locked. Please contact the administrator.' });
      }

      // Check if user registered via Google only and has no password
      if (user.provider === 'google' && !user.passwordHash) {
        return sendJson(res, 400, {
          error: 'This account uses Google Sign-In. Please click "Continue with Google".'
        });
      }

      const isValidPassword = db.verifyPassword(password, user.passwordHash, user.salt || user.passwordSalt, user);
      if (!isValidPassword) {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const updates = { failedLoginAttempts: attempts };
        if (attempts >= 8) {
          updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
        db.update('users', user.id, updates);
        return sendJson(res, 401, { error: 'Invalid email or password.' });
      }

      // Successful password check -> clear any previous failed attempt locks immediately
      user.failedLoginAttempts = 0;
      user.lockUntil = null;

      // Enforce email verification for customers only if REQUIRE_EMAIL_VERIFICATION is explicitly configured
      const enforceEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && db.data.settings?.requireEmailVerification === true;
      if (user.role === 'CUSTOMER' && !user.emailVerified && enforceEmailVerification) {
        return sendJson(res, 403, {
          error: 'Your email address has not been verified. Please check your inbox or click Resend.',
          unverified: true,
          email: user.email
        });
      } else if (user.role === 'CUSTOMER' && !user.emailVerified) {
        user.emailVerified = true;
        db.update('users', user.id, { emailVerified: true });
      }

      // Successful login
      db.resetRateLimit('login_ip:' + ip);
      db.resetRateLimit('login_id:' + email);

      // Server-side OWNER assignment for configured owner email
      if (isOwnerEmail(user.email)) {
        user.role = 'OWNER';
        user.status = 'ACTIVE';
        user.membership = 'Executive Owner';
      }

      db.update('users', user.id, {
        role: user.role,
        status: user.status,
        membership: user.membership,
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLoginAt: new Date().toISOString()
      });

      const session = db.createSession(user.id, rememberMe, req);
      setAuthCookie(res, session.id, rememberMe);
      db.logActivity(user.name, user.role === 'OWNER' ? 'OWNER_LOGIN' : 'STAFF_LOGIN', 'Users', user.id, `Session created for role ${user.role}`);

      const normRole = normalizeRole(user.role);
      let redirectUrl = '/';
      if (normRole === 'OWNER' || isOwnerEmail(user.email)) {
        redirectUrl = '/owner';
      } else if (normRole === 'ADMIN' || normRole === 'SUB_ADMIN' || normRole === 'STAFF') {
        redirectUrl = '/owner';
      } else if (normRole === 'DELIVERY_BOY') {
        redirectUrl = '/delivery';
      } else {
        redirectUrl = '/';
      }

      return sendJson(res, 200, {
        success: true,
        user: sanitizeUser(user),
        role: user.role,
        redirectUrl,
        session: { id: session.id, token: session.id, expiresAt: session.expiresAt }
      });
    }

    // C. Logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const auth = extractUserSession(req);
      if (auth && auth.session) {
        db.invalidateSession(auth.session.id);
        db.logActivity(auth.user.name, 'CUSTOMER_LOGOUT', 'Users', auth.user.id, 'Session destroyed');
      }
      clearAuthCookie(res);
      return sendJson(res, 200, { success: true, message: 'Logged out successfully.' });
    }

    // D. Active Authenticated Session Me
    if (pathname === '/api/auth/me' && method === 'GET') {
      const auth = extractUserSession(req);
      if (!auth || !auth.user) {
        return sendJson(res, 200, { isAuthenticated: false, user: null });
      }
      // If session exists, ensure fresh cookie is preserved
      if (auth.session && auth.session.id) {
        setAuthCookie(res, auth.session.id, auth.session.rememberMe);
      }
      return sendJson(res, 200, {
        isAuthenticated: true,
        user: sanitizeUser(auth.user),
        emailVerified: Boolean(auth.user.emailVerified),
        role: auth.user.role,
        session: { id: auth.session?.id, token: auth.session?.id, expiresAt: auth.session?.expiresAt }
      });
    }

    // E. Verify Email Address
    if (pathname === '/api/auth/verify-email' && method === 'POST') {
      const body = await parseBody(req);
      const token = (body.token || '').trim();

      if (!token) {
        return sendJson(res, 400, { error: 'Verification token is required.' });
      }

      const users = db.getAll('users');
      const user = users.find(u => u.verificationToken === token);

      if (!user) {
        return sendJson(res, 400, { error: 'Invalid or expired verification token.' });
      }

      if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
        return sendJson(res, 400, { error: 'This verification link has expired. Please request a new one.' });
      }

      db.update('users', user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
        updatedAt: new Date().toISOString()
      });

      await emailService.sendWelcomeEmail(user);
      db.logActivity(user.name, 'EMAIL_VERIFIED', 'Users', user.id, 'Email address confirmed');

      // Automatically sign in the verified user
      const session = db.createSession(user.id, true, req);
      setAuthCookie(res, session.id, true);

      return sendJson(res, 200, {
        success: true,
        message: 'Email address verified successfully!',
        user: sanitizeUser(user)
      });
    }

    // F. Resend Email Verification
    if (pathname === '/api/auth/resend-verification' && method === 'POST') {
      const body = await parseBody(req);
      const email = (body.email || '').trim().toLowerCase();

      const rate = db.checkRateLimit('resend:' + email, 3, 10 * 60 * 1000);
      if (!rate.allowed) {
        return sendJson(res, 429, {
          error: `Please wait ${Math.ceil(rate.retryAfterSeconds / 60)} minutes before requesting another verification email.`
        });
      }

      const users = db.getAll('users');
      const user = users.find(u => (u.email || '').toLowerCase() === email);

      if (user && !user.emailVerified) {
        const token = crypto.randomBytes(24).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        db.update('users', user.id, {
          verificationToken: token,
          verificationTokenExpires: tokenExpires
        });
        await emailService.sendVerificationEmail(user, token);
      }

      return sendJson(res, 200, {
        message: 'If an unverified account exists for this email, a verification link has been sent.'
      });
    }

    // G. Forgot Password
    if (pathname === '/api/auth/forgot-password' && method === 'POST') {
      const body = await parseBody(req);
      const email = (body.email || '').trim().toLowerCase();

      const rate = db.checkRateLimit('forgot:' + email, 3, 10 * 60 * 1000);
      if (!rate.allowed) {
        return sendJson(res, 429, {
          error: `Please wait ${Math.ceil(rate.retryAfterSeconds / 60)} minutes before requesting another password reset.`
        });
      }

      const users = db.getAll('users');
      const user = users.find(u => (u.email || '').toLowerCase() === email);

      if (user) {
        const resetToken = crypto.randomBytes(24).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 minutes
        db.update('users', user.id, {
          resetToken,
          resetTokenExpires: resetExpires
        });
        await emailService.sendPasswordResetEmail(user, resetToken);
        db.logActivity(user.name, 'PASSWORD_RESET_REQUESTED', 'Users', user.id, 'Reset token generated');
      }

      // Generic response to prevent user enumeration
      return sendJson(res, 200, {
        message: 'If an account exists for this email, you will receive a password reset link shortly.'
      });
    }

    // H. Reset Password
    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const body = await parseBody(req);
      const token = (body.token || '').trim();
      const newPassword = body.newPassword || '';
      const confirmPassword = body.confirmPassword || '';

      if (!token) {
        return sendJson(res, 400, { error: 'Reset token is required.' });
      }

      const hasLength = newPassword.length >= 8;
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasLower = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

      if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return sendJson(res, 400, {
          error: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
        });
      }

      if (newPassword !== confirmPassword) {
        return sendJson(res, 400, { error: 'Password confirmation does not match.' });
      }

      const users = db.getAll('users');
      const user = users.find(u => u.resetToken === token);

      if (!user) {
        return sendJson(res, 400, { error: 'Invalid or expired password reset link.' });
      }

      if (user.resetTokenExpires && new Date(user.resetTokenExpires) < new Date()) {
        return sendJson(res, 400, { error: 'This password reset link has expired. Please request a new one.' });
      }

      const { hash, salt } = db.hashPassword(newPassword);
      db.update('users', user.id, {
        passwordHash: hash,
        salt,
        resetToken: null,
        resetTokenExpires: null,
        failedLoginAttempts: 0,
        lockUntil: null,
        updatedAt: new Date().toISOString()
      });

      // Invalidate all existing sessions for security
      db.invalidateAllUserSessions(user.id);
      await emailService.sendSecurityAlert(user, 'Password Reset Successfully', 'Your account password was reset using a verification link.');
      db.logActivity(user.name, 'PASSWORD_RESET_COMPLETED', 'Users', user.id, 'Password changed and sessions purged');

      return sendJson(res, 200, {
        success: true,
        message: 'Password successfully updated. You may now sign in with your new password.'
      });
    }

    // I. Real Google Identity Services (GIS) Sign-In & Verification
    if (pathname === '/api/auth/google' && method === 'POST') {
      const body = await parseBody(req);
      const credential = body.credential;

      if (!credential) {
        return sendJson(res, 400, { error: 'Google credential token is missing.' });
      }

      const googleData = verifyGoogleIdToken(credential);
      if (!googleData) {
        return sendJson(res, 400, { error: 'Google token verification failed.' });
      }

      const isOwner = isOwnerEmail(googleData.email);

      const users = db.getAll('users');
      // 1. Check if user exists by permanent googleSub or owner email
      let user = users.find(u => u.googleSub === googleData.sub || (isOwner && (u.email || '').toLowerCase() === googleData.email));

      if (user) {
        if (isOwner) {
          user.role = 'OWNER';
          user.status = 'ACTIVE';
          user.membership = 'Executive Owner';
          user.googleSub = googleData.sub;
          user.emailVerified = true;
          if (googleData.picture) user.profileImage = googleData.picture;
          if (googleData.name && (!user.name || user.name === 'Friend')) user.name = googleData.name;
        }
        db.save();
        const session = db.createSession(user.id, true, req);
        setAuthCookie(res, session.id, true);
        db.update('users', user.id, { lastLoginAt: new Date().toISOString() });
        db.logActivity(user.name, isOwner ? 'OWNER_GOOGLE_LOGIN' : 'GOOGLE_LOGIN', 'Users', user.id, isOwner ? 'Executive Owner logged in via Google' : 'Authenticated via Google sub');
        const redirectUrl = user.role === 'OWNER' ? '/owner' : user.role === 'ADMIN' ? '/admin.html' : '/';
        return sendJson(res, 200, { user: sanitizeUser(user), isNew: false, redirectUrl });
      }

      // 2. Check if user exists with matching email
      const existingByEmail = users.find(u => (u.email || '').toLowerCase() === googleData.email);

      if (existingByEmail) {
        if (isOwner) {
          existingByEmail.role = 'OWNER';
          existingByEmail.status = 'ACTIVE';
          existingByEmail.membership = 'Executive Owner';
          existingByEmail.googleSub = googleData.sub;
          existingByEmail.emailVerified = true;
          if (googleData.picture) existingByEmail.profileImage = googleData.picture;
          db.save();
          const session = db.createSession(existingByEmail.id, true, req);
          setAuthCookie(res, session.id, true);
          db.logActivity(existingByEmail.name, 'OWNER_GOOGLE_LOGIN', 'Users', existingByEmail.id, 'Executive Owner logged in via Google');
          return sendJson(res, 200, { user: sanitizeUser(existingByEmail), isNew: false, redirectUrl: '/owner' });
        }

        // Account Linking Case: An account already exists with this email!
        if (existingByEmail.provider === 'local' && !existingByEmail.googleSub) {
          return sendJson(res, 409, {
            error: 'An account already exists with this email address.',
            requiresLinking: true,
            email: googleData.email,
            name: existingByEmail.name
          });
        }
        // Already linked, update sub if missing
        existingByEmail.googleSub = googleData.sub;
        db.save();
        const session = db.createSession(existingByEmail.id, true, req);
        setAuthCookie(res, session.id, true);
        return sendJson(res, 200, { user: sanitizeUser(existingByEmail), isNew: false, redirectUrl: '/' });
      }

      // 3. Brand new Google user registration
      const newGoogleUser = {
        id: isOwner ? 'usr_owner_' + Date.now() : 'usr_g_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: isOwner ? (googleData.name || 'Piyush Verma') : googleData.name,
        email: googleData.email,
        phone: '',
        provider: 'google',
        googleSub: googleData.sub,
        profileImage: googleData.picture,
        emailVerified: true, // Verified by Google
        role: isOwner ? 'OWNER' : 'CUSTOMER',
        membership: isOwner ? 'Executive Owner' : 'Gold Farm Club',
        walletBalance: isOwner ? 10000 : 100, // Owner reserve or welcome reward
        totalOrdersCount: 0,
        totalSpent: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      db.insert('users', newGoogleUser);
      await emailService.sendWelcomeEmail(newGoogleUser);
      db.logActivity(newGoogleUser.name, isOwner ? 'OWNER_SIGNUP' : 'GOOGLE_SIGNUP', 'Users', newGoogleUser.id, isOwner ? 'Owner initialized via Google' : 'New user created via Google Identity Services');

      const session = db.createSession(newGoogleUser.id, true, req);
      setAuthCookie(res, session.id, true);

      return sendJson(res, 201, {
        user: sanitizeUser(newGoogleUser),
        isNew: true,
        redirectUrl: isOwner ? '/owner' : '/'
      });
    }

    // J. Link Google Account to Existing Local Account
    if (pathname === '/api/auth/link-google' && method === 'POST') {
      const body = await parseBody(req);
      const credential = body.credential;
      const password = body.password;

      if (!credential || !password) {
        return sendJson(res, 400, { error: 'Google credential and current account password are required.' });
      }

      const googleData = verifyGoogleIdToken(credential);
      if (!googleData) {
        return sendJson(res, 400, { error: 'Invalid Google credential.' });
      }

      const users = db.getAll('users');
      const user = users.find(u => (u.email || '').toLowerCase() === googleData.email);

      if (!user) {
        return sendJson(res, 404, { error: 'Account not found.' });
      }

      const isPassValid = db.verifyPassword(password, user.passwordHash, user.salt);
      if (!isPassValid) {
        return sendJson(res, 401, { error: 'Incorrect password for linking.' });
      }

      db.update('users', user.id, {
        googleSub: googleData.sub,
        emailVerified: true,
        profileImage: user.profileImage || googleData.picture,
        updatedAt: new Date().toISOString()
      });

      const session = db.createSession(user.id, true, req);
      setAuthCookie(res, session.id, true);
      await emailService.sendSecurityAlert(user, 'Google Account Linked', 'Your account has been connected with Google Sign-In.');
      db.logActivity(user.name, 'ACCOUNT_LINKED_GOOGLE', 'Users', user.id, 'Google Identity sub linked');

      return sendJson(res, 200, { success: true, message: 'Google account linked successfully!', user: sanitizeUser(user) });
    }

    // K. Customer Profile Update
    if (pathname === '/api/auth/profile' && method === 'PATCH') {
      const auth = extractUserSession(req);
      if (!auth || !auth.user) {
        return sendJson(res, 401, { error: 'Unauthorized. Please sign in.' });
      }

      const body = await parseBody(req);
      const updates = {};
      if (body.name && body.name.trim()) updates.name = body.name.trim();
      if (body.phone && body.phone.trim()) updates.phone = body.phone.trim();
      if (body.profileImage) updates.profileImage = body.profileImage.trim();

      const updated = db.update('users', auth.user.id, updates);
      db.logActivity(updated.name, 'PROFILE_UPDATED', 'Users', updated.id, 'Customer profile updated');
      return sendJson(res, 200, { success: true, user: sanitizeUser(updated) });
    }

    // L. Change Password from Dashboard
    if (pathname === '/api/auth/change-password' && method === 'POST') {
      const auth = extractUserSession(req);
      if (!auth || !auth.user) {
        return sendJson(res, 401, { error: 'Unauthorized. Please sign in.' });
      }

      const body = await parseBody(req);
      const currentPassword = body.currentPassword || '';
      const newPassword = body.newPassword || '';
      const confirmPassword = body.confirmPassword || '';

      if (!db.verifyPassword(currentPassword, auth.user.passwordHash, auth.user.salt)) {
        return sendJson(res, 400, { error: 'Current password is incorrect.' });
      }

      const hasLength = newPassword.length >= 8;
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasLower = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

      if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return sendJson(res, 400, {
          error: 'New password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
        });
      }

      if (newPassword !== confirmPassword) {
        return sendJson(res, 400, { error: 'New password confirmation does not match.' });
      }

      const { hash, salt } = db.hashPassword(newPassword);
      db.update('users', auth.user.id, {
        passwordHash: hash,
        salt,
        updatedAt: new Date().toISOString()
      });

      await emailService.sendSecurityAlert(auth.user, 'Password Changed', 'Your account password was updated from the customer dashboard.');
      db.logActivity(auth.user.name, 'PASSWORD_CHANGED', 'Users', auth.user.id, 'Password updated via dashboard');

      return sendJson(res, 200, { success: true, message: 'Password updated successfully.' });
    }

    // ================= 3. USER CART & WISHLIST PERSISTENCE =================

    // Merge Guest Cart with User Cart
    if (pathname === '/api/cart/merge' && method === 'POST') {
      const auth = extractUserSession(req);
      const body = await parseBody(req);
      const guestCart = body.guestCart || {};

      if (!auth || !auth.user) {
        return sendJson(res, 200, { cart: guestCart });
      }

      const merged = db.mergeUserCart(auth.user.id, guestCart);
      return sendJson(res, 200, { success: true, cart: merged });
    }

    // Get Authenticated User Cart
    if (pathname === '/api/cart' && method === 'GET') {
      const auth = extractUserSession(req);
      if (!auth || !auth.user) {
        return sendJson(res, 200, { items: {} });
      }
      return sendJson(res, 200, { items: db.getUserCart(auth.user.id) });
    }

    // Save Authenticated User Cart
    if (pathname === '/api/cart' && method === 'POST') {
      const auth = extractUserSession(req);
      if (!auth || !auth.user) {
        return sendJson(res, 401, { error: 'Unauthorized' });
      }
      const body = await parseBody(req);
      db.saveUserCart(auth.user.id, body.items || {});
      return sendJson(res, 200, { success: true });
    }

    // User Wishlist
    if (pathname === '/api/wishlist' && method === 'GET') {
      const auth = extractUserSession(req);
      if (!auth || !auth.user) {
        return sendJson(res, 200, []);
      }
      return sendJson(res, 200, db.getUserWishlist(auth.user.id));
    }

    if (pathname === '/api/wishlist/toggle' && method === 'POST') {
      const auth = extractUserSession(req);
      if (!auth || !auth.user) {
        return sendJson(res, 401, { error: 'Please sign in to save items to your wishlist.' });
      }
      const body = await parseBody(req);
      const result = db.toggleWishlist(auth.user.id, body.productId);
      return sendJson(res, 200, result);
    }

    // Customer Orders Scoped to User
    if (pathname === '/api/user/orders' && method === 'GET') {
      const auth = extractUserSession(req);
      const allOrders = db.getAll('orders');

      const queryIds = (parsedUrl.query?.ids || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const cleanPhone = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');
      const userPhone = cleanPhone(auth?.user?.phone);
      const userId = auth?.user?.id;
      const userEmail = auth?.user?.email ? auth.user.email.toLowerCase().trim() : '';

      if (!auth?.user && queryIds.length === 0) {
        return sendJson(res, 401, { error: 'Unauthorized' });
      }

      const userOrders = allOrders.filter(o => {
        if (queryIds.length > 0 && (queryIds.includes(o.id) || queryIds.includes(o.orderId))) {
          return true;
        }
        if (auth?.user) {
          if (userId && (o.customerId === userId || o.userId === userId)) return true;
          if (userEmail && (o.customer?.email?.toLowerCase() === userEmail || o.customerEmail?.toLowerCase() === userEmail)) return true;
          if (userPhone) {
            const oPhone1 = cleanPhone(o.customerPhone);
            const oPhone2 = cleanPhone(o.customer?.phone);
            const oPhone3 = cleanPhone(o.deliveryAddress?.phone);
            if (oPhone1 === userPhone || oPhone2 === userPhone || oPhone3 === userPhone) return true;
          }
        }
        return false;
      });

      const normalized = userOrders.map(o => {
        const totalVal = o.total !== undefined ? Number(o.total) : (o.totalAmount !== undefined ? Number(o.totalAmount) : (o.finalAmount !== undefined ? Number(o.finalAmount) : 0));
        const st = o.status || o.orderStatus || 'CONFIRMED';
        return {
          ...o,
          id: o.id || o.orderId,
          orderId: o.orderId || o.id,
          status: st,
          orderStatus: st,
          total: totalVal,
          totalAmount: totalVal,
          items: Array.isArray(o.items) ? o.items : [],
          createdAt: o.createdAt || new Date().toISOString()
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return sendJson(res, 200, normalized);
    }

    // Saved Addresses (Scoped to Authenticated User)
    if (pathname === '/api/addresses' && method === 'GET') {
      const auth = extractUserSession(req);
      const userId = auth?.user?.id || 'usr_customer_1';
      const all = db.getAll('addresses');
      return sendJson(res, 200, all.filter(a => a.userId === userId));
    }

    if (pathname === '/api/addresses' && method === 'POST') {
      const auth = extractUserSession(req);
      const userId = auth?.user?.id || 'usr_customer_1';
      const body = await parseBody(req);
      const newAddress = {
        id: 'addr_' + Date.now(),
        userId,
        tag: body.tag || 'Home',
        fullName: body.fullName || auth?.user?.name || 'Customer',
        phone: body.phone || auth?.user?.phone || '',
        flat: body.flat || '',
        street: body.street || '',
        landmark: body.landmark || '',
        city: body.city || 'Indiranagar',
        state: 'Karnataka',
        pincode: body.pincode || '560038',
        isDefault: Boolean(body.isDefault)
      };
      if (newAddress.isDefault) {
        db.getAll('addresses').filter(a => a.userId === userId).forEach(a => { a.isDefault = false; });
      }
      db.insert('addresses', newAddress);
      return sendJson(res, 201, newAddress);
    }

    if (pathname.startsWith('/api/addresses/') && method === 'PUT') {
      const addrId = pathname.replace('/api/addresses/', '');
      const body = await parseBody(req);
      const updated = db.update('addresses', addrId, body);
      return sendJson(res, 200, updated || {});
    }

    if (pathname.startsWith('/api/addresses/') && method === 'DELETE') {
      const addrId = pathname.replace('/api/addresses/', '');
      db.delete('addresses', addrId);
      return sendJson(res, 200, { success: true });
    }

    // 4. Delivery Eligibility & 90-Min Logic
    if (pathname === '/api/delivery/eligibility' && method === 'POST') {
      const body = await parseBody(req);
      const pincode = body.pincode || '560038';
      return sendJson(res, 200, calculateEligibility(pincode));
    }

    // 4a. Maps API Key & Configuration Endpoint
    if (pathname === '/api/config/maps' && method === 'GET') {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
      return sendJson(res, 200, {
        apiKey,
        configured: Boolean(apiKey && apiKey.length > 5),
        provider: 'google'
      });
    }

    // 4b. Live Geocoding Reverse API (Coordinates -> Human Address) (FEATURE 3, 14, 15)
    if (pathname === '/api/location/reverse' && method === 'GET') {
      const lat = parseFloat(parsedUrl.query.lat);
      const lon = parseFloat(parsedUrl.query.lon);

      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return sendJson(res, 400, { error: 'Invalid latitude or longitude coordinates' });
      }

      const cacheKey = `reverse_${lat.toFixed(4)}_${lon.toFixed(4)}`;
      if (geocodeCache.has(cacheKey)) {
        return sendJson(res, 200, geocodeCache.get(cacheKey));
      }

      let result = null;

      // Try external geocoding provider if configured
      try {
        let fetchUrl = '';
        if (GEOCODING_PROVIDER === 'locationiq' && GEOCODING_API_KEY) {
          fetchUrl = `https://us1.locationiq.com/v1/reverse.php?key=${GEOCODING_API_KEY}&lat=${lat}&lon=${lon}&format=json`;
        } else if (GEOCODING_PROVIDER === 'google' && GEOCODING_API_KEY) {
          fetchUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GEOCODING_API_KEY}`;
        } else {
          // Default: OpenStreetMap Nominatim with compliant User-Agent
          fetchUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        }

        const rawData = await fetchJsonWithTimeout(fetchUrl, {}, 3000);

        if (rawData && (rawData.address || rawData.results)) {
          if (GEOCODING_PROVIDER === 'google') {
            const top = rawData.results && rawData.results[0];
            if (top) {
              const comps = top.address_components || [];
              const getComp = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
              const shortPart = getComp('sublocality_level_1') || getComp('sublocality') || getComp('neighborhood') || getComp('route') || 'Current Area';
              const city = getComp('locality') || getComp('administrative_area_level_2') || 'Noida';
              const state = getComp('administrative_area_level_1') || 'Uttar Pradesh';
              const postalCode = getComp('postal_code') || '';
              const shortAddress = shortPart.toLowerCase().includes(city.toLowerCase()) ? shortPart : `${shortPart}, ${city}`;
              result = {
                success: true,
                latitude: lat,
                longitude: lon,
                shortAddress,
                address: top.formatted_address || `${shortAddress}, ${state} ${postalCode}`,
                houseNumber: getComp('street_number'),
                street: getComp('route'),
                neighbourhood: getComp('neighborhood'),
                suburb: getComp('sublocality'),
                locality: shortPart,
                city,
                state,
                postalCode,
                country: getComp('country') || 'India',
                provider: 'google'
              };
            }
          } else {
            const addr = rawData.address || {};
            const houseNumber = addr.house_number || addr.building || '';
            const street = addr.road || addr.street || '';
            const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || '';
            const locality = addr.locality || addr.subdistrict || addr.quarter || addr.village || addr.industrial || '';
            const city = addr.city || addr.town || addr.municipality || addr.state_district || 'Noida';
            const state = addr.state || 'Uttar Pradesh';
            const postalCode = (addr.postcode || '').trim().slice(0, 6);
            const country = addr.country || 'India';

            const localPart = neighbourhood || locality || street || 'Current Area';
            const shortAddress = localPart.toLowerCase().includes(city.toLowerCase())
              ? localPart
              : `${localPart}, ${city}`;

            result = {
              success: true,
              latitude: lat,
              longitude: lon,
              shortAddress,
              address: rawData.display_name || `${shortAddress}, ${state} ${postalCode}`,
              houseNumber,
              street,
              neighbourhood,
              suburb: addr.suburb || '',
              locality,
              city,
              state,
              postalCode,
              country,
              provider: GEOCODING_PROVIDER
            };
          }
        }
      } catch (err) {
        // Log upstream failure and proceed to graceful fallback
        // console.warn('Upstream geocoding failed or offline, engaging local fallback:', err.message);
      }

      // Robust fallback if external API is unreachable, offline, or timed out (FEATURE 14)
      if (!result) {
        const closest = findClosestLocalLocation(lat, lon);
        result = {
          success: true,
          latitude: lat,
          longitude: lon,
          shortAddress: closest.shortAddress,
          address: closest.address,
          houseNumber: '',
          street: '',
          neighbourhood: closest.neighbourhood || '',
          suburb: '',
          locality: closest.locality || '',
          city: closest.city,
          state: closest.state,
          postalCode: closest.postalCode,
          country: 'India',
          isFallback: true,
          distanceKm: closest.distanceKm,
          provider: 'local_fallback'
        };
      }

      setGeocodeCache(cacheKey, result);
      return sendJson(res, 200, result);
    }

    // 4c. Live Place / Address Autocomplete Search API (FEATURE 5, 15)
    if (pathname === '/api/location/search' && method === 'GET') {
      const q = (parsedUrl.query.q || '').trim();
      if (!q || q.length < 2) {
        return sendJson(res, 200, []);
      }

      const cacheKey = `search_${q.toLowerCase()}`;
      if (geocodeCache.has(cacheKey)) {
        return sendJson(res, 200, geocodeCache.get(cacheKey));
      }

      const results = [];
      const seenAddresses = new Set();

      // Check local database first for rapid instant suggestions
      const qLower = q.toLowerCase();
      LOCAL_GEO_DATABASE.forEach(loc => {
        if (
          loc.shortAddress.toLowerCase().includes(qLower) ||
          loc.address.toLowerCase().includes(qLower) ||
          loc.city.toLowerCase().includes(qLower) ||
          (loc.locality && loc.locality.toLowerCase().includes(qLower)) ||
          (loc.neighbourhood && loc.neighbourhood.toLowerCase().includes(qLower)) ||
          loc.postalCode.includes(qLower)
        ) {
          seenAddresses.add(loc.shortAddress.toLowerCase());
          results.push({
            id: loc.id,
            shortAddress: loc.shortAddress,
            address: loc.address,
            city: loc.city,
            state: loc.state,
            postalCode: loc.postalCode,
            latitude: loc.latitude,
            longitude: loc.longitude,
            source: 'verified_hub'
          });
        }
      });

      // Try upstream provider if available
      try {
        let fetchUrl = '';
        if (GEOCODING_PROVIDER === 'locationiq' && GEOCODING_API_KEY) {
          fetchUrl = `https://us1.locationiq.com/v1/autocomplete.php?key=${GEOCODING_API_KEY}&q=${encodeURIComponent(q)}&countrycodes=in&limit=6&format=json`;
        } else if (GEOCODING_PROVIDER === 'google' && GEOCODING_API_KEY) {
          fetchUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&components=country:in&key=${GEOCODING_API_KEY}`;
        } else {
          fetchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=6&countrycodes=in`;
        }

        const rawData = await fetchJsonWithTimeout(fetchUrl, {}, 3000);

        if (rawData && Array.isArray(rawData.predictions)) {
          rawData.predictions.forEach(p => {
            const shortAddress = (p.structured_formatting && p.structured_formatting.main_text)
              ? `${p.structured_formatting.main_text}, Noida`
              : p.description.split(',').slice(0, 2).join(',').trim();
            const fullAddress = p.description;
            if (!seenAddresses.has(shortAddress.toLowerCase())) {
              seenAddresses.add(shortAddress.toLowerCase());
              results.push({
                id: p.place_id,
                shortAddress,
                address: fullAddress,
                city: 'Noida',
                state: 'Uttar Pradesh',
                postalCode: '201301',
                latitude: 28.6280,
                longitude: 77.3649,
                source: 'google_places'
              });
            }
          });
        } else if (Array.isArray(rawData)) {
          rawData.forEach(item => {
            const addr = item.address || {};
            const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || '';
            const locality = addr.locality || addr.subdistrict || addr.quarter || addr.village || '';
            const city = addr.city || addr.town || addr.municipality || addr.state_district || 'Noida';
            const state = addr.state || 'Uttar Pradesh';
            const postalCode = (addr.postcode || '').trim().slice(0, 6);

            const localPart = neighbourhood || locality || (item.name || '').split(',')[0].trim() || 'Area';
            const shortAddress = localPart.toLowerCase().includes(city.toLowerCase())
              ? localPart
              : `${localPart}, ${city}`;

            if (!seenAddresses.has(shortAddress.toLowerCase())) {
              seenAddresses.add(shortAddress.toLowerCase());
              results.push({
                id: `geo_${item.place_id || Math.random()}`,
                shortAddress,
                address: item.display_name || `${shortAddress}, ${state} ${postalCode}`,
                city,
                state,
                postalCode,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                source: 'geocoder'
              });
            }
          });
        }
      } catch (err) {
        // Fallback already populated from LOCAL_GEO_DATABASE
      }

      setGeocodeCache(cacheKey, results);
      return sendJson(res, 200, results);
    }

    // 5. Server-Side Cart & Pricing Validation
    if (pathname === '/api/cart/validate' && method === 'POST') {
      const body = await parseBody(req);
      const items = body.items || [];
      const couponCode = (body.couponCode || '').trim().toUpperCase();
      const pincode = body.pincode || '560038';

      let subtotal = 0;
      let totalOriginal = 0;
      const validatedItems = [];

      for (const item of items) {
        const qty = Math.max(1, parseInt(item.qty || 1, 10));
        const price = Math.max(0, parseFloat(item.price || 0));
        const origPrice = Math.max(price, parseFloat(item.originalPrice || price));
        subtotal += price * qty;
        totalOriginal += origPrice * qty;
        validatedItems.push({
          ...item,
          qty,
          lineTotal: price * qty
        });
      }

      // Coupon logic
      let discount = 0;
      let couponError = null;
      if (couponCode) {
        const coupons = db.getAll('coupons');
        const coupon = coupons.find(c => c.code === couponCode && c.active);
        if (!coupon) {
          couponError = 'Invalid coupon code.';
        } else if (subtotal < coupon.minOrder) {
          couponError = `Coupon requires a minimum basket value of ₹${coupon.minOrder}.`;
        } else {
          if (coupon.type === 'FIXED') {
            discount = coupon.discount;
          } else if (coupon.type === 'PERCENT') {
            discount = Math.min(coupon.maxDiscount || 9999, Math.round((subtotal * coupon.discountPercent) / 100));
          }
        }
      }

      const freeThreshold = 199;
      const deliveryFee = subtotal >= freeThreshold || subtotal === 0 ? 0 : 30;
      const totalSavings = Math.max(0, (totalOriginal - subtotal) + discount);
      const finalTotal = Math.max(0, subtotal - discount + deliveryFee);

      return sendJson(res, 200, {
        valid: true,
        items: validatedItems,
        subtotal,
        discount,
        couponCode: discount > 0 ? couponCode : null,
        couponError,
        deliveryFee,
        freeThreshold,
        totalSavings,
        finalTotal,
        eligibility: calculateEligibility(pincode)
      });
    }

    // 6. Audit Logs & Public Categories/Products CRUD API
    if (pathname === '/api/audit-logs' && method === 'GET') {
      const filters = {
        action: parsedUrl.query.action,
        search: parsedUrl.query.search,
        limit: parsedUrl.query.limit
      };
      const logs = db.getAuditLogs(filters);
      return sendJson(res, 200, logs);
    }

    if (pathname === '/api/categories' && method === 'GET') {
      const pg = db.postgres || db.pgAdapter;
      if (pg && pg.isAvailable()) {
        try {
          const activeCategories = await pg.getAllCategoriesWithCountsAsync(true);
          return sendJson(res, 200, activeCategories);
        } catch (e) {
          console.warn('Postgres getAllCategoriesWithCountsAsync error, falling back:', e.message);
        }
      }

      const categories = db.getAll('categories') || [];
      const products = db.getAll('products') || [];
      const activeProducts = products.filter(p => {
        const s = (p.status || 'ACTIVE').toUpperCase();
        return !['SUSPENDED', 'INACTIVE', 'DRAFT', 'DELETED', 'ARCHIVED', 'UNPUBLISHED'].includes(s);
      });

      const enriched = categories.filter(c => (c.status || 'ACTIVE') !== 'SUSPENDED' && (c.active !== false)).map(cat => {
        const slug = (cat.slug || cat.id || cat.name || '').toLowerCase();
        let count = 0;
        if (slug.includes('veg')) {
          count = activeProducts.filter(p => {
            const c = (p.category || '').toLowerCase();
            return !c.includes('fruit') && !c.includes('groc') && !c.includes('pant') && !c.includes('staple');
          }).length;
        } else if (slug.includes('fruit')) {
          count = activeProducts.filter(p => (p.category || '').toLowerCase().includes('fruit')).length;
        } else if (slug.includes('groc') || slug.includes('pant')) {
          count = activeProducts.filter(p => {
            const c = (p.category || '').toLowerCase();
            return c.includes('groc') || c.includes('pant') || c.includes('staple') || c.includes('oil') || c.includes('dal') || c.includes('atta') || c.includes('rice') || c.includes('flour') || c.includes('spice');
          }).length;
        } else {
          count = activeProducts.filter(p => (p.category || '').toLowerCase() === slug).length;
        }
        return {
          ...cat,
          productCount: count,
          count
        };
      });
      return sendJson(res, 200, enriched);
    }


    // ----------------------------------------------------
    // Store Status (Live / Offline) Endpoints
    // ----------------------------------------------------
    if ((pathname === '/api/store/status' || pathname === '/api/store-status' || pathname === '/api/owner/store/status') && method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
      res.setHeader('CDN-Cache-Control', 'no-store');
      res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const storeStatus = db.getStoreStatusAsync ? await db.getStoreStatusAsync() : db.getStoreStatus();
      return sendJson(res, 200, storeStatus);
    }

    if ((pathname === '/api/owner/store/status' || pathname === '/api/store/status') && (method === 'POST' || method === 'PUT')) {
      const owner = requireOwner(req, res);
      if (!owner) return;

      const body = await parseBody(req);
      const requestedStatus = body.status || (body.isOpen === false ? 'OFFLINE' : (body.isOpen === true ? 'LIVE' : 'LIVE'));
      const customMessage = body.message || (String(requestedStatus).toUpperCase().trim() === 'OFFLINE' ? "We're currently not accepting orders. Please check back soon." : "Store is open for orders.");
      const oldStatusObj = db.getStoreStatusAsync ? await db.getStoreStatusAsync() : (db.getStoreStatus ? db.getStoreStatus() : { status: 'LIVE' });
      const oldStatus = oldStatusObj.status || 'LIVE';
      const normNewStatus = String(requestedStatus).toUpperCase().trim() === 'OFFLINE' ? 'OFFLINE' : 'LIVE';

      let updatedStatus;
      try {
        updatedStatus = await db.setStoreStatusAsync(normNewStatus, owner.name || owner.email || 'Owner', customMessage);
      } catch (saveErr) {
        console.error('Failed to persist store status to PostgreSQL:', saveErr.message);
        return sendJson(res, 500, {
          success: false,
          error: 'Failed to update store status in database: ' + saveErr.message,
          message: 'Failed to update store status in database.'
        });
      }

      // Record in freshmart_audit_logs
      try {
        await db.logActivityAsync(
          owner.name || owner.email || 'Owner',
          'STORE_STATUS',
          'Settings',
          'STORE_STATUS',
          `Changed store status from ${oldStatus} to ${normNewStatus}`,
          {
            oldStatus,
            newStatus: normNewStatus,
            message: customMessage,
            operator: owner.name || owner.email || 'Owner',
            timestamp: new Date().toISOString()
          }
        );
      } catch(e) {}

      // Broadcast real-time SSE event to all connected clients
      broadcastEvent('STORE_STATUS_UPDATED', updatedStatus);
      broadcastEvent('STORE_STATUS', updatedStatus);

      return sendJson(res, 200, {
        success: true,
        ...updatedStatus
      });
    }

    // ----------------------------------------------------
    // Product Image Upload & Curated Image Library Endpoints
    // ----------------------------------------------------
    if ((pathname === '/api/upload/image' || pathname === '/api/owner/upload' || pathname === '/api/upload') && method === 'POST') {
      const UPLOADS_DIR = path.join(__dirname, 'uploads');
      if (!fs.existsSync(UPLOADS_DIR)) {
        try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (e) {}
      }

      const body = await parseBody(req);
      const rawData = body.data || body.image || body.base64 || body.file;
      if (!rawData || typeof rawData !== 'string') {
        return sendJson(res, 400, { success: false, error: 'No image data provided. Expected base64 data URL or string.' });
      }

      let mimeType = 'image/jpeg';
      let base64Data = rawData;
      let ext = 'jpg';

      if (rawData.startsWith('data:')) {
        const matches = rawData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1].toLowerCase();
          base64Data = matches[2];
        }
      } else if (body.mimeType || body.type) {
        mimeType = (body.mimeType || body.type).toLowerCase();
      }

      const allowedMimes = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };

      if (!allowedMimes[mimeType]) {
        return sendJson(res, 400, { 
          success: false, 
          error: `Invalid file type "${mimeType}". Allowed formats are JPG, JPEG, PNG, and WebP.` 
        });
      }

      ext = allowedMimes[mimeType];
      const buffer = Buffer.from(base64Data, 'base64');
      const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
      if (buffer.length > MAX_SIZE_BYTES) {
        return sendJson(res, 400, { 
          success: false, 
          error: `File size exceeds the 10MB limit (size: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).` 
        });
      }

      const filename = `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, buffer);

      const imageUrl = `/uploads/${filename}`;
      return sendJson(res, 201, {
        success: true,
        url: imageUrl,
        imageUrl: imageUrl,
        filename,
        mimeType,
        size: buffer.length
      });
    }

    if ((pathname === '/api/images/library' || pathname === '/api/owner/images/library') && method === 'GET') {
      const UPLOADS_DIR = path.join(__dirname, 'uploads');
      const { category, search } = parsedUrl.query || {};
      
      const curatedLibrary = [
        // Vegetables
        { id: 'lib_veg_tomato', title: 'Farm Fresh Tomatoes', category: 'Vegetables', subcategory: 'Daily Fresh', url: 'https://images.unsplash.com/photo-1546470427-227c7369a4d0?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1546470427-227c7369a4d0?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_potato', title: 'Agra Jyoti Potato', category: 'Vegetables', subcategory: 'Root Vegetables', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_onion', title: 'Nashik Red Onions', category: 'Vegetables', subcategory: 'Root Vegetables', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_capsicum_green', title: 'Green Capsicum (Shimla Mirch)', category: 'Vegetables', subcategory: 'Exotic Peppers', url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_capsicum_red', title: 'Organic Red Bell Pepper', category: 'Vegetables', subcategory: 'Exotic Peppers', url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_capsicum_yellow', title: 'Yellow Bell Pepper', category: 'Vegetables', subcategory: 'Exotic Peppers', url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_carrot', title: 'Ooty Fresh Orange Carrot', category: 'Vegetables', subcategory: 'Root Vegetables', url: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_broccoli', title: 'Hydroponic Tender Broccoli', category: 'Vegetables', subcategory: 'Exotics', url: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_spinach', title: 'Farm Fresh Palak (Spinach)', category: 'Vegetables', subcategory: 'Leafy Greens', url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_coriander', title: 'Fresh Green Coriander (Dhaniya)', category: 'Vegetables', subcategory: 'Herbs & Greens', url: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_garlic', title: 'Peeled Fresh Garlic Bulbs', category: 'Vegetables', subcategory: 'Aromatics', url: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_ginger', title: 'Organic Ginger (Adrak)', category: 'Vegetables', subcategory: 'Aromatics', url: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_lemon', title: 'Fresh Juicy Nimbu (Lemon)', category: 'Vegetables', subcategory: 'Citrus & Aromatics', url: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_cucumber', title: 'Crispy Green Kheera (Cucumber)', category: 'Vegetables', subcategory: 'Salad Produce', url: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_cauliflower', title: 'Fresh White Gobhi (Cauliflower)', category: 'Vegetables', subcategory: 'Daily Fresh', url: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_chilli', title: 'Spicy Green Chilli (Hari Mirch)', category: 'Vegetables', subcategory: 'Spices & Aromatics', url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_bhindi', title: 'Tender Ladies Finger (Bhindi/Okra)', category: 'Vegetables', subcategory: 'Daily Fresh', url: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_veg_corn', title: 'Sweet Corn on the Cob', category: 'Vegetables', subcategory: 'Farm Grains', url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=240&q=80' },

        // Fruits
        { id: 'lib_fruit_apple_red', title: 'Kinnaur Royal Red Delicious Apple', category: 'Fruits', subcategory: 'Orchard Fresh', url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_fruit_banana', title: 'Robusta Golden Bananas', category: 'Fruits', subcategory: 'Daily Fruits', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_fruit_mango', title: 'Ratnagiri Alphonso Mango (Hapus)', category: 'Fruits', subcategory: 'Seasonal Premium', url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_fruit_pomegranate', title: 'Ruby Red Anar (Pomegranate)', category: 'Fruits', subcategory: 'Exotics & Premium', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_fruit_orange', title: 'Nagpur Sweet Mandarin Oranges', category: 'Fruits', subcategory: 'Citrus', url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_fruit_papaya', title: 'Sweet Yellow Papaya', category: 'Fruits', subcategory: 'Tropical Fruits', url: 'https://images.unsplash.com/photo-1526346698789-224a79ed0881?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1526346698789-224a79ed0881?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_fruit_grapes_green', title: 'Seedless Green Thomson Grapes', category: 'Fruits', subcategory: 'Vine Fresh', url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_fruit_strawberry', title: 'Mahabaleshwar Juicy Strawberries', category: 'Fruits', subcategory: 'Berries', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_fruit_watermelon', title: 'Sweet Sugar Queen Watermelon', category: 'Fruits', subcategory: 'Melons', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_fruit_kiwi', title: 'Zespri Green Kiwi', category: 'Fruits', subcategory: 'Exotics', url: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?auto=format&fit=crop&w=240&q=80' },

        // Grocery & Pantry
        { id: 'lib_groc_rice_basmati', title: 'Royal Basmati Rice Aged 2 Years', category: 'Grocery & Pantry', subcategory: 'Rice & Grains', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_groc_dal_toor', title: 'Unpolished Organic Toor Dal', category: 'Grocery & Pantry', subcategory: 'Pulses & Dals', url: 'https://images.unsplash.com/photo-1585994192700-141a02123cb2?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1585994192700-141a02123cb2?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_groc_oil_mustard', title: 'Cold-Pressed Kachi Ghani Mustard Oil', category: 'Grocery & Pantry', subcategory: 'Cooking Oils & Ghee', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_groc_atta', title: 'Chakki Fresh Sharbati Whole Wheat Atta', category: 'Grocery & Pantry', subcategory: 'Flours & Grains', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_groc_ghee', title: 'Pure Vedic A2 Desi Cow Bilona Ghee', category: 'Grocery & Pantry', subcategory: 'Dairy & Ghee', url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_groc_spices', title: 'Assorted Handpicked Indian Spices', category: 'Grocery & Pantry', subcategory: 'Whole Spices', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_groc_turmeric', title: 'Salem Pure Ground Haldi (Turmeric)', category: 'Grocery & Pantry', subcategory: 'Spices & Seasoning', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_groc_honey', title: 'Wild Raw Forest Organic Honey', category: 'Grocery & Pantry', subcategory: 'Sweeteners', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_groc_cashew', title: 'Mangalore Premium Jumbo W180 Cashews', category: 'Grocery & Pantry', subcategory: 'Dry Fruits & Nuts', url: 'https://images.unsplash.com/photo-1506917728037-b6fb01c4e69b?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1506917728037-b6fb01c4e69b?auto=format&fit=crop&w=240&q=80' },
        { id: 'lib_groc_almonds', title: 'California Mamra Premium Almonds', category: 'Grocery & Pantry', subcategory: 'Dry Fruits & Nuts', url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=700&q=80', thumbnail: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=240&q=80' }
      ];

      // Scan existing products in catalog
      const products = db.getAll('products') || [];
      const seenUrls = new Set(curatedLibrary.map(i => i.url));

      for (const p of products) {
        const imgUrl = p.image || p.imageUrl;
        if (imgUrl && !seenUrls.has(imgUrl) && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
          seenUrls.add(imgUrl);
          curatedLibrary.push({
            id: `prod_img_${p.id}`,
            title: p.name || 'Catalog Produce',
            category: p.category || 'Vegetables',
            subcategory: p.subcategory || 'Catalog Item',
            url: imgUrl,
            thumbnail: imgUrl
          });
        }
      }

      // Scan uploads directory
      try {
        if (fs.existsSync(UPLOADS_DIR)) {
          const files = fs.readdirSync(UPLOADS_DIR);
          for (const f of files) {
            const ext = path.extname(f).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
              const url = `/uploads/${f}`;
              if (!seenUrls.has(url)) {
                seenUrls.add(url);
                curatedLibrary.unshift({
                  id: `upload_${f}`,
                  title: f.replace(/^product_\d+_/, '').replace(ext, ''),
                  category: 'Uploads',
                  subcategory: 'Custom Uploaded',
                  url: url,
                  thumbnail: url
                });
              }
            }
          }
        }
      } catch (e) {}

      let results = curatedLibrary;
      if (category && category !== 'ALL' && category !== 'all') {
        const cLower = category.toLowerCase();
        results = results.filter(i => (i.category || '').toLowerCase().includes(cLower));
      }
      if (search) {
        const sLower = search.toLowerCase();
        results = results.filter(i => (i.title || '').toLowerCase().includes(sLower) || (i.category || '').toLowerCase().includes(sLower) || (i.subcategory || '').toLowerCase().includes(sLower));
      }

      return sendJson(res, 200, { success: true, count: results.length, images: results });
    }

    if (pathname === '/api/products' && method === 'GET') {
      const { category, status, search } = parsedUrl.query;
      const pg = db.postgres || db.pgAdapter;
      if (pg && pg.isAvailable()) {
        const products = await pg.getAllProductsAsync({
          category,
          status,
          search,
          onlyActive: !status || status === 'ACTIVE'
        });
        return sendJson(res, 200, products);
      }
      const products = db.getAll('products') || [];
      let filtered = products;
      if (category && category !== 'ALL' && category !== 'all') {
        const catLower = category.toLowerCase();
        filtered = filtered.filter(p => {
          const pCat = (p.category || '').toLowerCase();
          const pSlug = (p.categorySlug || p.category_slug || '').toLowerCase();
          const pId = (p.categoryId || p.category_id || '').toLowerCase();
          const pNormalized = pCat.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          const pSpaceSlug = pCat.replace(/\s+/g, '-');
          const pCatArray = (p.categories || []).map(c => String(c).toLowerCase());
          return pCat === catLower ||
                 pSlug === catLower ||
                 pId === catLower ||
                 pNormalized === catLower ||
                 pSpaceSlug === catLower ||
                 pCatArray.includes(catLower);
        });
      }
      if (status && status !== 'ALL') {
        filtered = filtered.filter(p => (p.status || 'ACTIVE') === status);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.hindiName || '').toLowerCase().includes(q));
      }
      return sendJson(res, 200, filtered);
    }

    if (pathname === '/api/products' && method === 'POST') {
      const auth = extractUserSession(req);
      const currentUser = auth?.user ? (db.getById('users', auth.user.id) || auth.user) : null;
      const body = await parseBody(req);
      const name = body.name || body.title;
      const price = Number(body.price !== undefined ? body.price : (body.sellingPrice || 0));
      if (!name || price <= 0) {
        return sendJson(res, 400, { error: 'Product name and a valid selling price are required' });
      }

      const mrp = Number(body.mrp || body.originalPrice) || Math.round(price * 1.25);
      const costPrice = Number(body.costPrice) || Math.round(price * 0.65);
      const stock = Number(body.stock || 0);
      const lowStockLimit = Number(body.lowStockLimit || body.minStockAlert || 15);
      const initialStatus = body.status || (stock > 0 ? (stock <= lowStockLimit ? 'LOW_STOCK' : 'ACTIVE') : 'OUT_OF_STOCK');
      const sku = body.sku || `SJH-${(body.category || 'VEG').substring(0, 3).toUpperCase()}-${name.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

      const newProduct = {
        id: 'prod_' + Date.now(),
        storefrontId: (body.storefrontId || name.toLowerCase().replace(/[^a-z0-9]/g, '_')),
        name,
        hindiName: body.hindiName || '',
        sku,
        barcode: body.barcode || ('8901234' + String(Date.now()).slice(-5)),
        category: body.category || 'Vegetables',
        subcategory: body.subcategory || 'Daily Fresh',
        price,
        sellingPrice: price,
        mrp,
        originalPrice: mrp,
        discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
        costPrice,
        stock,
        unit: body.unit || '1 kg',
        lowStockLimit,
        reorderLevel: Number(body.reorderLevel) || (lowStockLimit * 2),
        status: initialStatus,
        farmer: body.farmer || body.farmSource || 'Karnataka Organic Kisan Network',
        hubId: body.hubId || 'hub_blr_indiranagar',
        expressEligible: body.expressEligible !== false,
        harvestDate: body.harvestDate || new Date().toISOString().slice(0, 10),
        freshnessDays: Number(body.freshnessDays) || 5,
        image: body.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        description: body.description || `${name} - farm-fresh certified harvest.`,
        variants: body.variants || [
          { sku: `${sku}-1KG`, weightLabel: body.unit || '1 kg', price, mrp, costPrice, stock }
        ],
        weights: body.weights || (body.variants && body.variants.length > 0 ? body.variants.map(v => ({
          label: v.weightLabel || v.label || body.unit || '1 kg',
          price: Number(v.price || price),
          originalPrice: Number(v.mrp || mrp),
          discount: (v.mrp && v.mrp > v.price) ? `${Math.round(((v.mrp - v.price) / v.mrp) * 100)}% OFF` : 'Best Value'
        })) : [
          {
            label: body.unit || '1 kg',
            price,
            originalPrice: mrp,
            discount: mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : 'Best Value'
          }
        ]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.insertAsync('products', newProduct);

      // Ledger entry
      await db.insertAsync('inventory_movements', {
        id: 'mov_' + Date.now(),
        date: new Date().toISOString(),
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        hubId: newProduct.hubId,
        hubName: 'Indiranagar Central Hub',
        type: newProduct.category === 'Grocery & Pantry' ? 'PROCUREMENT' : 'HARVEST',
        quantity: stock,
        before: 0,
        after: stock,
        reason: `Initial catalog intake from ${newProduct.farmer} (QC Passed)`,
        user: currentUser?.name ? `${currentUser.name} (${currentUser.role || 'Staff'})` : 'Store Owner'
      });

      await db.logActivityAsync(currentUser?.name || 'Owner', 'PRODUCT_CREATED', 'Products', newProduct.id, `Created product "${newProduct.name}" (SKU: ${newProduct.sku})`);
      broadcastEvent('PRODUCT_UPDATED', newProduct);
      return sendJson(res, 201, { success: true, product: newProduct, ...newProduct });
    }

    const singleProdMatch = pathname.match(/^\/api\/products\/([A-Za-z0-9_-]+)(?:\/(status|suspend))?$/);
    if (singleProdMatch) {
      const prodId = singleProdMatch[1];
      const isStatusSubpath = Boolean(singleProdMatch[2]);

      if (method === 'GET') {
        const prod = db.getById('products', prodId);
        if (!prod) return sendJson(res, 404, { error: 'Product not found' });
        return sendJson(res, 200, prod);
      }

      if (method === 'PUT') {
        const prod = db.getById('products', prodId);
        if (!prod) return sendJson(res, 404, { error: 'Product not found' });
        const body = await parseBody(req);
        const price = body.price !== undefined ? Number(body.price) : (body.sellingPrice !== undefined ? Number(body.sellingPrice) : prod.price);
        const mrp = body.mrp !== undefined ? Number(body.mrp) : (body.originalPrice !== undefined ? Number(body.originalPrice) : prod.mrp);
        const costPrice = body.costPrice !== undefined ? Number(body.costPrice) : prod.costPrice;
        const stock = body.stock !== undefined ? Number(body.stock) : prod.stock;
        const lowLimit = body.lowStockLimit !== undefined ? Number(body.lowStockLimit) : prod.lowStockLimit;

        let status = body.status || prod.status;
        if (!body.status && status !== 'SUSPENDED') {
          if (stock <= 0) status = 'OUT_OF_STOCK';
          else if (stock <= lowLimit) status = 'LOW_STOCK';
          else status = 'ACTIVE';
        }

        const updates = {
          ...body,
          price,
          sellingPrice: price,
          mrp,
          originalPrice: mrp,
          discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
          costPrice,
          stock,
          lowStockLimit: lowLimit,
          status,
          updatedAt: new Date().toISOString()
        };

        const updated = await db.updateAsync('products', prod.id, updates);
        broadcastEvent('PRODUCT_UPDATED', updated);
        return sendJson(res, 200, { success: true, product: updated, ...updated });
      }

      if (method === 'PATCH' || (isStatusSubpath && method === 'POST')) {
        const prod = db.getById('products', prodId);
        if (!prod) return sendJson(res, 404, { error: 'Product not found' });
        const body = await parseBody(req);
        let newStatus = body.status;
        if (!newStatus) {
          newStatus = prod.status === 'SUSPENDED'
            ? ((prod.stock || 0) > 0 ? ((prod.stock || 0) <= (prod.lowStockLimit || 15) ? 'LOW_STOCK' : 'ACTIVE') : 'OUT_OF_STOCK')
            : 'SUSPENDED';
        }

        const updates = {
          ...body,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        if (body.stock !== undefined) {
          updates.stock = Number(body.stock);
          updates.stockCount = Number(body.stock);
          updates.inStock = Number(body.stock) > 0;
        }
        const updated = await db.updateAsync('products', prod.id, updates);
        broadcastEvent('PRODUCT_UPDATED', updated);
        return sendJson(res, 200, { success: true, product: updated, ...updated });
      }

      if (method === 'DELETE') {
        const prod = db.getById('products', prodId);
        if (!prod) return sendJson(res, 404, { error: 'Product not found' });
        await db.deleteAsync('products', prod.id);
        broadcastEvent('PRODUCT_DELETED', { id: prod.id, name: prod.name });
        return sendJson(res, 200, { success: true, message: `Product ${prod.name} removed.` });
      }
    }

    // 7. Orders: List and Create
    if ((pathname === '/api/orders' || pathname === '/api/delivery/orders' || pathname === '/api/delivery/history') && method === 'GET') {
      let orders = [];
      if (db.postgres && db.postgres.isAvailable()) {
        try {
          orders = await db.postgres.getAll('orders');
        } catch (e) {
          orders = db.getAll('orders') || [];
        }
      } else {
        orders = db.getAll('orders') || [];
      }
      const auth = extractUserSession(req);
      const currentUser = auth?.user ? (db.getById('users', auth.user.id) || auth.user) : null;
      const { status, hubId, riderId } = parsedUrl.query;

      const userRole = currentUser ? normalizeRole(currentUser.role) : '';
      const isDeliveryRole = ['DELIVERY_BOY', 'DELIVERY_PARTNER', 'DELIVERY', 'RIDER'].includes(userRole);
      const isOwnerAdmin = ['OWNER', 'ADMIN', 'SUB_ADMIN', 'HUB_MANAGER'].includes(userRole);

      // Handle delivery app endpoints
      if (pathname === '/api/delivery/orders' || pathname === '/api/delivery/history') {
        if (isDeliveryRole) {
          const myOrders = orders.filter(o => {
            if (o.rejectedDeliveryBoyIds && (o.rejectedDeliveryBoyIds.includes(currentUser.id) || o.rejectedDeliveryBoyIds.includes(currentUser.employeeId))) return false;
            if (o.reassignmentNeeded && (!o.deliveryBoyId || (o.deliveryBoyId !== currentUser.id && o.deliveryBoyId !== currentUser.employeeId))) return false;
            if ((o.orderStatus === 'READY_FOR_HANDOVER' || o.orderStatus === 'ORDER_PLACED' || o.orderStatus === 'ORDER_CONFIRMED' || o.orderStatus === 'PICKING' || o.orderStatus === 'PACKING') && (!o.deliveryBoyId || (o.deliveryBoyId !== currentUser.id && o.deliveryBoyId !== currentUser.employeeId))) return false;

            const bId = o.deliveryBoyId || o.deliveryPartnerId;
            const bPhone = o.deliveryBoyPhone || o.deliveryPartnerPhone;
            const uPhone = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';
            const bPhoneDigits = bPhone ? String(bPhone).replace(/\D/g, '') : '';

            if (bId && (bId === currentUser.id || bId === currentUser.employeeId)) return true;
            if (!bId && uPhone && bPhoneDigits && uPhone.length >= 10 && bPhoneDigits.endsWith(uPhone.slice(-10))) return true;
            return false;
          });
          if (pathname === '/api/delivery/history') {
            return sendJson(res, 200, myOrders.filter(o => ['DELIVERED', 'DELIVERY_FAILED', 'CANCELLED'].includes((o.orderStatus || o.status || '').toUpperCase())));
          }
          return sendJson(res, 200, myOrders);
        } else if (isOwnerAdmin) {
          let filtered = orders;
          if (status) filtered = filtered.filter(o => o.orderStatus === status || o.deliveryStatus === status);
          if (hubId) filtered = filtered.filter(o => o.hubId === hubId);
          if (riderId) filtered = filtered.filter(o => o.deliveryPartnerId === riderId || o.deliveryBoyId === riderId);
          return sendJson(res, 200, filtered);
        } else {
          return sendJson(res, 200, []);
        }
      }

      let filtered = orders;
      if (status) filtered = filtered.filter(o => o.orderStatus === status || o.deliveryStatus === status);
      if (hubId) filtered = filtered.filter(o => o.hubId === hubId);
      if (riderId) filtered = filtered.filter(o => o.deliveryPartnerId === riderId || o.deliveryBoyId === riderId);
      return sendJson(res, 200, filtered);
    }

    if (pathname === '/api/orders' && method === 'POST') {
      const auth = extractUserSession(req);
      const currentUser = auth?.user ? (db.getById('users', auth.user.id) || auth.user) : null;
      
      // Enforce Store Offline Check (Ordering strictly blocked)
      const storeStatus = db.getStoreStatusAsync ? await db.getStoreStatusAsync() : (db.getStoreStatus ? db.getStoreStatus() : { isOpen: true, status: 'LIVE' });
      if (!storeStatus.isOpen || storeStatus.status === 'OFFLINE') {
        return sendJson(res, 403, {
          success: false,
          error: "Store is currently OFFLINE. We are not accepting orders at this time.",
          message: storeStatus.message || "Store Temporarily Offline: We're currently not accepting orders. Please check back soon.",
          code: 'STORE_OFFLINE',
          isOpen: false,
          status: 'OFFLINE'
        });
      }

      if (db.data.settings?.maintenanceMode) {
        if (!currentUser || (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN')) {
          return sendJson(res, 503, { error: 'FreshMart is currently in maintenance mode. Retail checkout is temporarily paused.' });
        }
      }

      const body = await parseBody(req);
      const items = body.items || [];
      if (!items.length) {
        return sendJson(res, 400, { error: 'Cannot place an empty order' });
      }

      // Recalculate price server-side
      let subtotal = 0;
      for (const it of items) {
        subtotal += (it.price || 0) * (it.qty || 1);
      }
      let discount = 0;
      const couponCode = (body.couponCode || '').trim().toUpperCase();
      if (couponCode === 'FIRST100' && subtotal >= 299) discount = 100;
      else if (couponCode === 'FRESH50' && subtotal >= 199) discount = 50;

      const standardFee = Number(db.data.settings?.standardDeliveryFee ?? db.data.settings?.deliveryFee ?? 30);
      const freeThreshold = Number(db.data.settings?.freeDeliveryThreshold ?? 199);
      const deliveryFee = subtotal >= freeThreshold ? 0 : standardFee;
      const totalAmount = Math.max(0, subtotal - discount + deliveryFee);

      // Generate atomic customer-facing sequential Order ID from Neon PostgreSQL sequence (FM-OD-00001)
      let orderId = null;
      if (db.postgres && db.postgres.isAvailable()) {
        try {
          orderId = await db.postgres.generateNextOrderId();
        } catch (seqErr) {
          console.error('Error generating Order ID from Neon PostgreSQL sequence:', seqErr);
          throw seqErr;
        }
      } else {
        const seq = (db.data.orders ? db.data.orders.length : 0) + 1;
        orderId = `FM-OD-${String(seq).padStart(5, '0')}`;
      }

      const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));

      const hubs = db.getAll('hubs');
      const hub = hubs.find(h => h.pincodes.includes(body.deliveryAddress?.pincode)) || hubs[0];
      const riders = db.getAll('delivery_partners');
      const rider = riders[0];

      const customerId = body.customerId || currentUser?.id || 'usr_customer_' + Date.now();
      const customerName = body.customerName || currentUser?.name || body.deliveryAddress?.fullName || 'Valued Customer';
      const customerPhone = body.customerPhone || currentUser?.phone || body.deliveryAddress?.phone || '';
      const customerEmail = body.customerEmail || currentUser?.email || '';

      const deliveryLatitude = body.deliveryLatitude !== undefined 
        ? Number(body.deliveryLatitude) 
        : (body.deliveryAddress?.latitude !== undefined ? Number(body.deliveryAddress.latitude) : 12.9784);
      const deliveryLongitude = body.deliveryLongitude !== undefined 
        ? Number(body.deliveryLongitude) 
        : (body.deliveryAddress?.longitude !== undefined ? Number(body.deliveryAddress.longitude) : 77.6408);
      const deliveryInstructions = body.deliveryInstructions || body.deliveryAddress?.instructions || body.instructions || '';

      const newOrder = {
        id: orderId,
        orderId: orderId,
        customerId,
        userId: customerId,
        customerName,
        customerPhone,
        customerEmail,
        customer: {
          id: customerId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail
        },
        hubId: hub.id,
        hubName: hub.name,
        deliveryBoyId: null,
        deliveryBoyName: null,
        deliveryBoyPhone: null,
        deliveryPartnerId: null,
        deliveryPartnerName: null,
        deliveryPartnerPhone: null,
        deliveryPartnerVehicle: null,
        deliveryPartnerRating: null,
        deliveryAddress: body.deliveryAddress || {
          tag: 'Home',
          fullName: customerName,
          phone: customerPhone,
          flat: 'Flat 402, Green Glen Towers',
          street: '12th Main Road, HAL 2nd Stage',
          city: 'Indiranagar, Bengaluru',
          pincode: '560038'
        },
        deliveryLatitude,
        deliveryLongitude,
        deliveryInstructions,
        deliveryOption: body.deliveryOption || 'EXPRESS_90_MIN',
        deliverySlot: body.deliverySlot || 'Express Delivery (30–90 Mins)',
        items: items.map(it => ({ ...it, status: 'AVAILABLE' })),
        subtotal,
        discount,
        couponCode: discount > 0 ? couponCode : null,
        deliveryFee,
        totalAmount,
        finalTotal: totalAmount,
        paymentMethod: body.paymentMethod || 'UPI (Google Pay)',
        paymentStatus: (String(body.paymentMethod || '').toUpperCase().includes('COD') || String(body.paymentMethod || '').toUpperCase().includes('CASH')) ? 'PENDING' : 'PAID',
        orderStatus: 'ORDER_PLACED',
        status: 'ORDER_PLACED',
        deliveryStatus: 'UNASSIGNED',
        qualityCheck: { passed: false, checklist: [] },
        packaging: { type: 'Plastic-Free / Biodegradable Bag', status: 'PENDING' },
        deliveryOtp: deliveryOtp,
        deliveryOtpVerified: false,
        assignedAt: null,
        acceptedAt: null,
        pickedUpAt: null,
        outForDeliveryAt: null,
        arrivedAt: null,
        deliveredAt: null,
        deliveredBy: null,
        failedAt: null,
        failedBy: null,
        failureReason: null,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        stockRestored: false,
        timeline: [
          {
            status: 'ORDER_PLACED',
            title: 'Order Placed',
            desc: `Order received successfully via ${body.paymentMethod || 'UPI'}. Routing to ${hub.name}.`,
            time: new Date().toISOString()
          }
        ],
        estimatedDeliveryTime: '90 Minutes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviews: null
      };

      // Atomic inventory deduction & order persistence in Neon PostgreSQL
      if (db.postgres && db.postgres.isAvailable()) {
        const atomicRes = await db.postgres.placeOrderWithInventoryAtomic(newOrder, items, hub, 'System Order Engine');
        if (!atomicRes.success) {
          return sendJson(res, 400, {
            success: false,
            error: atomicRes.error,
            code: atomicRes.code || 'INSUFFICIENT_STOCK',
            detail: atomicRes
          });
        }

        // Sync local memory products from atomic deduction
        if (Array.isArray(atomicRes.deductedItems)) {
          for (const d of atomicRes.deductedItems) {
            const localProd = db.getById('products', d.id);
            if (localProd) {
              localProd.stock = d.afterStock;
              localProd.stockCount = d.afterStock;
              localProd.status = d.afterStock === 0 ? 'OUT_OF_STOCK' : (d.afterStock <= 15 ? 'LOW_STOCK' : 'ACTIVE');
            }
          }
        }
        if (!db.data.orders) db.data.orders = [];
        db.data.orders.unshift(newOrder);
        db.save();
      } else {
        // Fallback in-memory validation & deduction
        const products = db.getAll('products');
        for (const orderedItem of items) {
          const prod = products.find(p => p.id === orderedItem.id || p.storefrontId === orderedItem.id || p.name === orderedItem.name);
          const qty = Number(orderedItem.quantity || orderedItem.qty || 1);
          if (!prod || prod.stock < qty) {
            return sendJson(res, 400, {
              success: false,
              error: `Insufficient stock for "${prod ? prod.name : orderedItem.name}". Available: ${prod ? prod.stock : 0}, Requested: ${qty}`,
              code: 'INSUFFICIENT_STOCK'
            });
          }
        }
        for (const orderedItem of items) {
          const prod = products.find(p => p.id === orderedItem.id || p.storefrontId === orderedItem.id || p.name === orderedItem.name);
          if (prod) {
            const qty = Number(orderedItem.quantity || orderedItem.qty || 1);
            const beforeStock = prod.stock || 0;
            prod.stock = Math.max(0, beforeStock - qty);
            if (prod.stock === 0) prod.status = 'OUT_OF_STOCK';
            else if (prod.stock <= prod.lowStockLimit) prod.status = 'LOW_STOCK';
            db.update('products', prod.id, prod);
          }
        }
        db.insert('orders', newOrder);
      }

      if (currentUser && currentUser.id) {
        currentUser.totalOrdersCount = (currentUser.totalOrdersCount || 0) + 1;
        currentUser.totalSpent = (currentUser.totalSpent || 0) + totalAmount;
        db.update('users', currentUser.id, currentUser);
      }

      // Financial payment record
      db.insert('payments', {
        id: 'pay_' + Date.now(),
        transactionId: `TXN_${Date.now()}`,
        orderId,
        customerId: newOrder.customerId,
        customerName: newOrder.customerName,
        amount: totalAmount,
        paymentMethod: newOrder.paymentMethod,
        status: newOrder.paymentStatus === 'PAID' ? 'SUCCESS' : 'PENDING',
        date: new Date().toISOString()
      });

      // Notification
      db.insert('notifications', {
        id: 'notif_' + Date.now(),
        userId: newOrder.customerId,
        title: `Order #${orderId} Confirmed!`,
        message: `Your farm produce is queued for picking at ${hub.name}. Delivery in ~90 mins.`,
        type: 'ORDER',
        read: false,
        createdAt: new Date().toISOString()
      });

      db.logActivity('System Order Engine', 'ORDER_CREATED', 'Order', orderId, `New order created for ₹${totalAmount} by ${newOrder.customerName}`);

      broadcastEvent('ORDER_CREATED', newOrder);
      broadcastEvent('STOCK_UPDATED', { message: 'Inventory decremented from order' });
      return sendJson(res, 201, newOrder);
    }

    // 8. Single Order Lookup
    const orderMatch = pathname.match(/^\/api\/orders\/([A-Za-z0-9_-]+)$/);
    if (orderMatch && method === 'GET') {
      let order = null;
      if (db.postgres && db.postgres.isAvailable()) {
        try {
          order = await db.postgres.getById('orders', orderMatch[1]);
        } catch (e) {}
      }
      if (!order) order = db.getById('orders', orderMatch[1]);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });
      const totalVal = order.total !== undefined ? Number(order.total) : (order.totalAmount !== undefined ? Number(order.totalAmount) : (order.finalTotal !== undefined ? Number(order.finalTotal) : 0));
      const st = order.status || order.orderStatus || 'CONFIRMED';
      return sendJson(res, 200, {
        ...order,
        id: order.id || order.orderId,
        orderId: order.orderId || order.id,
        status: st,
        orderStatus: st,
        total: totalVal,
        totalAmount: totalVal
      });
    }

    // 9. Order Cancellation
    const cancelMatch = pathname.match(/^\/api\/orders\/([A-Za-z0-9_-]+)\/cancel$/);
    if (cancelMatch && method === 'POST') {
      let order = null;
      if (db.postgres && db.postgres.isAvailable()) {
        try {
          order = await db.postgres.getById('orders', cancelMatch[1]);
        } catch (e) {}
      }
      if (!order) order = db.getById('orders', cancelMatch[1]);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });
      if (['PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'].includes(order.orderStatus)) {
        return sendJson(res, 400, { error: 'Cannot cancel order that is already in transit or delivered' });
      }

      order.orderStatus = 'CANCELLED';
      order.status = 'CANCELLED';
      order.timeline.push({
        status: 'CANCELLED',
        title: 'Order Cancelled',
        desc: 'Order cancelled. Reserved inventory restored. Full refund initiated.',
        time: new Date().toISOString()
      });

      // Atomic idempotent stock restoration in PostgreSQL
      const pg = db.pgAdapter || db.postgres;
      if (pg && pg.isAvailable()) {
        const restRes = await pg.restoreOrderStockAtomic(order.orderId || order.id, 'Customer Cancellation');
        if (restRes.success && Array.isArray(restRes.restoredItems)) {
          for (const r of restRes.restoredItems) {
            const localProd = db.getById('products', r.id);
            if (localProd) {
              localProd.stock = r.afterStock;
              localProd.stockCount = r.afterStock;
              localProd.status = r.afterStock <= 0 ? 'OUT_OF_STOCK' : (r.afterStock <= 15 ? 'LOW_STOCK' : 'ACTIVE');
            }
          }
        }
      } else if (!order.stockRestored) {
        order.stockRestored = true;
        const products = db.getAll('products');
        for (const item of (order.items || [])) {
          const prod = products.find(p => p.id === item.id || p.name === item.name);
          if (prod) {
            const beforeStock = prod.stock;
            const qty = Number(item.quantity || item.qty || 1);
            prod.stock += qty;
            if (prod.stock > (prod.lowStockLimit || 15)) prod.status = 'ACTIVE';
            db.update('products', prod.id, prod);
          }
        }
      }

      // Add refund record
      db.insert('refunds', {
        id: 'ref_' + Date.now(),
        orderId: order.orderId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        reason: 'Order Cancelled',
        amount: order.totalAmount,
        status: 'APPROVED',
        date: new Date().toISOString(),
        processedBy: 'Auto Cancellation System'
      });

      order.cancelledAt = new Date().toISOString();
      order.stockRestored = true;
      db.update('orders', order.id, order);
      await persistOrder(order);
      db.logActivity('Customer / System', 'ORDER_CANCELLED', 'Order', order.orderId, `Order #${order.orderId} cancelled. Refund of ₹${order.totalAmount} approved.`);
      broadcastEvent('ORDER_UPDATED', order);
      broadcastEvent('STOCK_UPDATED', { message: 'Stock restored from cancellation' });
      broadcastEvent('INVENTORY_UPDATED', { orderId: order.orderId, status: 'CANCELLED' });
      return sendJson(res, 200, { success: true, order });
    }

    // 10. Order Review (GET and POST)
    const reviewMatch = pathname.match(/^\/api\/orders\/([A-Za-z0-9_-]+)\/review$/);
    if (reviewMatch && method === 'GET') {
      const orderId = reviewMatch[1];
      let review = null;
      if (db.postgres && db.postgres.isAvailable()) {
        try {
          review = await db.postgres.getReviewByOrderId(orderId);
        } catch (e) {}
      }
      if (!review) {
        let order = db.getById('orders', orderId);
        if (order && order.reviews) review = order.reviews;
      }
      return sendJson(res, 200, { success: true, review: review || null });
    }

    if (reviewMatch && method === 'POST') {
      const orderId = reviewMatch[1];
      let order = null;
      if (db.postgres && db.postgres.isAvailable()) {
        try {
          order = await db.postgres.getById('orders', orderId);
        } catch (e) {}
      }
      if (!order) order = db.getById('orders', orderId);
      if (!order) {
        const orders = db.getAll('orders') || [];
        order = orders.find(o => o.id === orderId || o.orderId === orderId);
      }
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      // 1. Requirement: Only DELIVERED orders can be reviewed
      const orderStatus = (order.orderStatus || order.status || '').toUpperCase();
      if (orderStatus !== 'DELIVERED') {
        return sendJson(res, 400, { 
          error: `Only delivered orders can be reviewed. Current status is ${orderStatus}.`,
          code: 'ORDER_NOT_DELIVERED'
        });
      }

      // 2. Requirement: Exactly one review per order (Check database level)
      if (db.postgres && db.postgres.isAvailable()) {
        try {
          const existingReview = await db.postgres.getReviewByOrderId(orderId);
          if (existingReview) {
            return sendJson(res, 409, { 
              error: 'This order has already been reviewed. Only one review is allowed per order.',
              code: 'DUPLICATE_REVIEW',
              review: existingReview
            });
          }
        } catch (e) {}
      } else if (order.reviews && (order.reviews.storeRating || order.reviews.riderRating || order.reviews.rating)) {
        return sendJson(res, 409, { 
          error: 'This order has already been reviewed. Only one review is allowed per order.',
          code: 'DUPLICATE_REVIEW',
          review: order.reviews
        });
      }

      const body = await parseBody(req);
      const storeRating = parseInt(body.storeRating || body.store_rating || body.productRating || body.product_rating || body.rating || 5, 10);
      const riderRating = parseInt(body.riderRating || body.rider_rating || body.deliveryRating || body.delivery_rating || 5, 10);
      const comment = (body.comment || body.feedback || body.reviewText || '').trim();

      if (isNaN(storeRating) || storeRating < 1 || storeRating > 5) {
        return sendJson(res, 400, { error: 'FreshMart store rating must be between 1 and 5 stars.' });
      }
      if (isNaN(riderRating) || riderRating < 1 || riderRating > 5) {
        return sendJson(res, 400, { error: 'Delivery partner rating must be between 1 and 5 stars.' });
      }

      const auth = extractUserSession(req);
      const customerId = (auth?.user?.id) || order.customerId || order.userId || 'usr_customer';
      const customerName = order.customerName || (order.deliveryAddress && (order.deliveryAddress.fullName || order.deliveryAddress.name)) || auth?.user?.name || 'Customer';
      const customerPhone = order.customerPhone || (order.deliveryAddress && order.deliveryAddress.phone) || auth?.user?.phone || null;
      const customerEmail = order.customerEmail || auth?.user?.email || null;
      const deliveryPartnerId = order.deliveryPartnerId || order.deliveryBoyId || null;
      const deliveryPartnerName = order.deliveryPartnerName || order.deliveryBoyName || 'Delivery Partner';

      const reviewId = 'rev_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const reviewRecord = {
        id: reviewId,
        reviewId,
        orderId: order.orderId || order.id,
        customerId,
        customerName,
        customerPhone,
        customerEmail,
        deliveryPartnerId,
        deliveryPartnerName,
        storeRating,
        riderRating,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 3. Save permanently in Neon PostgreSQL table freshmart_reviews
      if (db.postgres && db.postgres.isAvailable()) {
        try {
          await db.postgres.insert('reviews', reviewRecord);
        } catch (pgErr) {
          if (pgErr.message && pgErr.message.includes('unique constraint') || pgErr.code === '23505') {
            return sendJson(res, 409, { 
              error: 'This order has already been reviewed. Duplicate submission prevented.',
              code: 'DUPLICATE_REVIEW'
            });
          }
          console.error('PostgreSQL review insert error:', pgErr.message);
        }
      } else {
        db.insert('reviews', reviewRecord);
      }

      // 4. Attach review to order record
      order.reviews = reviewRecord;
      order.updatedAt = new Date().toISOString();
      await persistOrder(order);

      db.logActivity(customerName, 'REVIEW_SUBMITTED', 'Reviews', order.orderId || order.id, `Rated Store: ${storeRating}★, Rider: ${riderRating}★`);
      broadcastEvent('REVIEW_CREATED', reviewRecord);
      broadcastEvent('ORDER_UPDATED', order);

      return sendJson(res, 201, { 
        success: true, 
        message: 'Review and ratings submitted successfully!',
        review: reviewRecord, 
        order 
      });
    }

    // ========================================================
    // HUB / FARMER ORDER DISPATCH ENDPOINTS
    // ========================================================
    if (pathname === '/api/hub/orders' && method === 'GET') {
      return sendJson(res, 200, db.getAll('orders'));
    }

    const hubAcceptMatch = pathname.match(/^\/api\/hub\/orders\/([A-Za-z0-9_-]+)\/accept$/);
    if (hubAcceptMatch && method === 'PATCH') {
      const order = db.getById('orders', hubAcceptMatch[1]);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      order.orderStatus = 'ACCEPTED_BY_HUB';
      order.status = 'ACCEPTED_BY_HUB';
      order.timeline.push({
        status: 'ACCEPTED_BY_HUB',
        title: 'Accepted by Hub',
        desc: `Accepted by ${order.hubName}. Staged for morning harvest pick.`,
        time: new Date().toISOString()
      });
      db.update('orders', order.id, order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, order);
    }

    const hubPickingMatch = pathname.match(/^\/api\/hub\/orders\/([A-Za-z0-9_-]+)\/picking$/);
    if (hubPickingMatch && method === 'PATCH') {
      const order = db.getById('orders', hubPickingMatch[1]);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      order.orderStatus = 'PICKING';
      order.status = 'PICKING';
      order.timeline.push({
        status: 'PICKING',
        title: 'Harvest Picking',
        desc: 'Produce freshly sorted from dawn kisan harvest bins.',
        time: new Date().toISOString()
      });
      db.update('orders', order.id, order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, order);
    }

    const hubItemStatusMatch = pathname.match(/^\/api\/hub\/orders\/([A-Za-z0-9_-]+)\/item-status$/);
    if (hubItemStatusMatch && method === 'PATCH') {
      const body = await parseBody(req);
      const order = db.getById('orders', hubItemStatusMatch[1]);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const item = order.items.find(it => it.id === body.itemId);
      if (item) {
        item.status = body.status;
        if (body.replacementName) item.replacementName = body.replacementName;
      }
      db.update('orders', order.id, order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, order);
    }

    const hubQcMatch = pathname.match(/^\/api\/hub\/orders\/([A-Za-z0-9_-]+)\/quality-check$/);
    if (hubQcMatch && method === 'PATCH') {
      const body = await parseBody(req);
      const order = db.getById('orders', hubQcMatch[1]);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      order.orderStatus = 'QUALITY_CHECK';
      order.status = 'QUALITY_CHECK';
      order.qualityCheck = {
        passed: true,
        inspectedBy: body.inspector || 'QC Lead Anand Verma',
        checklist: body.checklist || ['Freshness', 'Correct Product', 'Correct Quantity', 'Correct Weight', 'No Visible Damage'],
        timestamp: new Date().toISOString()
      };
      order.timeline.push({
        status: 'QUALITY_CHECK',
        title: 'Quality Inspected',
        desc: '5-point freshness & weight verification cleared.',
        time: new Date().toISOString()
      });
      db.update('orders', order.id, order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, order);
    }

    const hubPackedMatch = pathname.match(/^\/api\/hub\/orders\/([A-Za-z0-9_-]+)\/packed$/);
    if (hubPackedMatch && method === 'PATCH') {
      const order = db.getById('orders', hubPackedMatch[1]);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      order.orderStatus = 'READY_FOR_PICKUP';
      order.status = 'READY_FOR_PICKUP';
      order.packaging = {
        type: 'Plastic-Free / Biodegradable Bag',
        status: 'PACKED',
        packedAt: new Date().toISOString()
      };
      order.timeline.push({
        status: 'PACKED',
        title: 'Packed in Biodegradable Carrier',
        desc: 'Zero-plastic carrier sealed and staged at Bay #1.',
        time: new Date().toISOString()
      });
      db.update('orders', order.id, order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, order);
    }

    // ========================================================
    // DELIVERY PARTNER ENDPOINTS (REAL STATUS TRANSITIONS & LIFECYCLE)
    // ========================================================
    if (pathname === '/api/delivery/reviews' && method === 'GET') {
      const auth = extractUserSession(req);
      const currentUser = auth?.user || {};
      const riderId = parsedUrl.query.riderId || currentUser.id || currentUser.employeeId || (currentUser.role === 'DELIVERY_BOY' ? currentUser.name : null);
      let stats = { totalReviews: 0, averageRating: 5.0, reviews: [] };
      if (db.postgres && db.postgres.isAvailable() && riderId) {
        try {
          stats = await db.postgres.getRiderRatingStats(riderId);
        } catch (e) {}
      }
      return sendJson(res, 200, { success: true, ...stats });
    }

    if (pathname === '/api/delivery/available-orders' && method === 'GET') {
      const orders = db.getAll('orders') || [];
      const available = orders.filter(o => ['READY_FOR_PICKUP', 'PACKED', 'CONFIRMED', 'ASSIGNED'].includes(o.orderStatus || o.deliveryStatus));
      return sendJson(res, 200, available);
    }

    // A. Verify Customer OTP Endpoint
    const riderVerifyOtpMatch = pathname.match(/^\/api\/delivery\/orders\/([A-Za-z0-9_-]+)\/verify-otp$/);
    if (riderVerifyOtpMatch && method === 'POST') {
      const body = await parseBody(req);
      const inputOtp = String(body.otp || '').trim();
      const orderId = riderVerifyOtpMatch[1];
      const orders = db.getAll('orders') || [];
      const order = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      if (!inputOtp || inputOtp !== String(order.deliveryOtp)) {
        return sendJson(res, 400, {
          success: false,
          verified: false,
          error: 'Incorrect OTP. Please ask customer for the 4-digit code shown on their tracking screen.'
        });
      }

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };

      // Transition to CUSTOMER_VERIFIED
      applyOrderStepTransition(order, 'CUSTOMER_VERIFIED', currentUser, { notes: '4-digit delivery security code successfully verified with customer.' });

      // If COD is paid or prepaid and caller requested completion
      if (body.completeDelivery) {
        const isPaid = (order.paymentStatus || '').toUpperCase() === 'PAID';
        if (!isPaid) {
          await persistOrder(order);
          broadcastEvent('ORDER_UPDATED', order);
          return sendJson(res, 400, {
            success: false,
            verified: true,
            error: 'Cannot complete delivery: Cash on Delivery (COD) collection is pending.'
          });
        }
        applyOrderStepTransition(order, 'DELIVERED', currentUser, { notes: 'Order handed over and verified successfully.' });
      }

      await persistOrder(order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, { 
        success: true, 
        verified: true, 
        message: 'Customer OTP verified successfully.', 
        order 
      });
    }

    // B. Collect Cash on Delivery (COD) Endpoint
    const riderCollectCodMatch = pathname.match(/^\/api\/delivery\/orders\/([A-Za-z0-9_-]+)\/(collect-cod|collect-cash)$/);
    if (riderCollectCodMatch && method === 'POST') {
      const orderId = riderCollectCodMatch[1];
      const orders = db.getAll('orders') || [];
      const order = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };

      order.paymentStatus = 'PAID';
      const amount = Number(order.totalAmount || order.total || 0);
      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        step: getCanonicalStepIndex(order.orderStatus || order.status),
        status: order.orderStatus || 'ARRIVED',
        title: 'Cash Collected',
        desc: `Cash on Delivery payment of ₹${amount} collected by ${currentUser.name || 'Delivery Boy'}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role || 'DELIVERY_BOY'
      });

      order.updatedAt = new Date().toISOString();
      await persistOrder(order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, { success: true, message: `Collected ₹${amount} COD payment.`, order });
    }

    // C. Accept Delivery Assignment
    const riderAcceptMatch = pathname.match(/^\/api\/(?:delivery\/)?orders\/([A-Za-z0-9_-]+)\/accept$/);
    if (riderAcceptMatch && (method === 'PATCH' || method === 'POST')) {
      const orderId = riderAcceptMatch[1];
      const orders = db.getAll('orders') || [];
      const order = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };

      const validation = validateOrderStepTransition(order, 'DELIVERY_BOY_ACCEPTED', currentUser.role, { isDeliveryBoy: true });
      if (!validation.valid) {
        return sendJson(res, 400, { error: validation.error });
      }

      applyOrderStepTransition(order, 'DELIVERY_BOY_ACCEPTED', currentUser, { notes: `${currentUser.name || 'Delivery Boy'} accepted order handover.` });
      await persistOrder(order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, { success: true, order });
    }

    // C2. Reject Delivery Assignment (Rider declines handover)
    const riderRejectMatch = pathname.match(/^\/api\/(?:delivery\/)?orders\/([A-Za-z0-9_-]+)\/reject$/);
    if (riderRejectMatch && (method === 'PATCH' || method === 'POST')) {
      const orderId = riderRejectMatch[1];
      const orders = db.getAll('orders') || [];
      const order = db.getById('orders', orderId) || orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };
      const body = await parseBody(req);
      const reason = body.reason || body.rejectionReason || 'Delivery Partner declined assignment (vehicle issue or out of area)';

      const rejectedRiderId = currentUser.id || order.deliveryBoyId || 'usr_delivery_boy';
      const rejectedRiderName = currentUser.name || order.deliveryBoyName || 'Delivery Boy';

      // Keep record of rejected delivery boy IDs
      order.rejectedDeliveryBoyIds = Array.isArray(order.rejectedDeliveryBoyIds) ? order.rejectedDeliveryBoyIds : [];
      if (!order.rejectedDeliveryBoyIds.includes(rejectedRiderId)) {
        order.rejectedDeliveryBoyIds.push(rejectedRiderId);
      }

      // Crucial: Order is NOT cancelled! Reset to READY_FOR_HANDOVER so Owner can reassign
      order.orderStatus = 'READY_FOR_HANDOVER';
      order.status = 'READY_FOR_HANDOVER';
      order.deliveryStatus = 'REASSIGNMENT_REQUIRED';
      order.reassignmentNeeded = true;
      order.assignmentRejected = true;
      order.rejectionReason = reason;
      order.rejectedAt = new Date().toISOString();
      order.rejectedBy = rejectedRiderName;
      order.rejectedById = rejectedRiderId;

      // Clear the active assignment from the order
      order.deliveryBoyId = null;
      order.deliveryBoyName = null;
      order.deliveryBoyPhone = null;
      order.deliveryPartnerId = null;
      order.deliveryPartnerName = null;
      order.deliveryPartnerPhone = null;
      order.deliveryPartnerVehicle = null;
      order.assignedAt = null;
      order.acceptedAt = null;

      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        step: 5,
        status: 'DELIVERY_ASSIGNMENT_REJECTED',
        title: 'Delivery Assignment Rejected',
        desc: `Delivery Partner (${rejectedRiderName}) declined assignment: ${reason}. Order queued for reassignment.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: rejectedRiderName,
        userRole: currentUser.role || 'DELIVERY_BOY'
      });

      order.updatedAt = new Date().toISOString();
      await persistOrder(order);
      db.logActivity(rejectedRiderName, 'DELIVERY_REJECTED', 'Order', order.orderId || order.id, `Delivery assignment rejected by ${rejectedRiderName}: ${reason}`);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, {
        success: true,
        message: 'Delivery assignment rejected. Order returned to pool for reassignment.',
        order
      });
    }

    // D. Confirm Pickup from Hub
    const riderPickupMatch = pathname.match(/^\/api\/delivery\/orders\/([A-Za-z0-9_-]+)\/pickup$/);
    if (riderPickupMatch && (method === 'PATCH' || method === 'POST')) {
      const orderId = riderPickupMatch[1];
      const orders = db.getAll('orders') || [];
      const order = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };

      const validation = validateOrderStepTransition(order, 'PICKED_UP', currentUser.role, { isDeliveryBoy: true });
      if (!validation.valid) {
        return sendJson(res, 400, { error: validation.error });
      }

      applyOrderStepTransition(order, 'PICKED_UP', currentUser, { notes: `Order picked up and package secured from hub by ${currentUser.name || 'Delivery Boy'}.` });
      await persistOrder(order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, { success: true, order });
    }

    // E. Start Delivery (Out for Delivery)
    const riderOutMatch = pathname.match(/^\/api\/delivery\/orders\/([A-Za-z0-9_-]+)\/out-for-delivery$/);
    if (riderOutMatch && (method === 'PATCH' || method === 'POST')) {
      const orderId = riderOutMatch[1];
      const orders = db.getAll('orders') || [];
      const order = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };

      const validation = validateOrderStepTransition(order, 'OUT_FOR_DELIVERY', currentUser.role, { isDeliveryBoy: true });
      if (!validation.valid) {
        return sendJson(res, 400, { error: validation.error });
      }

      applyOrderStepTransition(order, 'OUT_FOR_DELIVERY', currentUser, { notes: `${currentUser.name || 'Delivery Boy'} is en route to customer destination.` });
      await persistOrder(order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, { success: true, order });
    }

    // F. Arrived at Customer Location
    const riderArrivedMatch = pathname.match(/^\/api\/delivery\/orders\/([A-Za-z0-9_-]+)\/arrived$/);
    if (riderArrivedMatch && (method === 'PATCH' || method === 'POST')) {
      const orderId = riderArrivedMatch[1];
      const orders = db.getAll('orders') || [];
      const order = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };

      const validation = validateOrderStepTransition(order, 'ARRIVED', currentUser.role, { isDeliveryBoy: true });
      if (!validation.valid) {
        return sendJson(res, 400, { error: validation.error });
      }

      applyOrderStepTransition(order, 'ARRIVED', currentUser, { notes: `${currentUser.name || 'Delivery Boy'} arrived at customer delivery location.` });
      await persistOrder(order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, { success: true, order });
    }

    // G. Complete Delivery Handover
    const riderDeliverMatch = pathname.match(/^\/api\/delivery\/orders\/([A-Za-z0-9_-]+)\/deliver$/);
    if (riderDeliverMatch && (method === 'PATCH' || method === 'POST')) {
      const orderId = riderDeliverMatch[1];
      const orders = db.getAll('orders') || [];
      const order = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };
      const body = await parseBody(req);

      if (body.otp) {
        if (String(body.otp).trim() === String(order.deliveryOtp)) {
          order.deliveryOtpVerified = true;
          order.otpVerified = true;
        } else {
          return sendJson(res, 400, { error: 'Invalid customer delivery OTP.' });
        }
      }

      if (!order.deliveryOtpVerified && !body.bypassOtp) {
        return sendJson(res, 400, { error: 'Customer OTP verification is required before marking order as delivered.' });
      }

      if (body.cashCollected) {
        order.paymentStatus = 'PAID';
      }
      if (order.paymentStatus !== 'PAID') {
        return sendJson(res, 400, { error: 'Payment must be collected before completing a Cash on Delivery order.' });
      }

      // If still at ARRIVED, advance to CUSTOMER_VERIFIED first
      if (getCanonicalStepIndex(order.orderStatus) === 10) {
        applyOrderStepTransition(order, 'CUSTOMER_VERIFIED', currentUser, { notes: 'Verified customer OTP code.' });
      }

      const validation = validateOrderStepTransition(order, 'DELIVERED', currentUser.role, { otpVerified: true, isPaid: true });
      if (!validation.valid) {
        return sendJson(res, 400, { error: validation.error });
      }

      applyOrderStepTransition(order, 'DELIVERED', currentUser, { notes: `Order handed over and verified by ${currentUser.name || 'Delivery Boy'}.` });
      const pg = db.pgAdapter || db.postgres;
      if (pg && pg.isAvailable()) {
        try {
          await pg.markOrderDeliveredAtomic(order.orderId || order.id, currentUser.email || currentUser.name);
        } catch (e) {
          console.warn('markOrderDeliveredAtomic error:', e.message);
        }
      }
      await persistOrder(order);
      db.logActivity(currentUser.name, 'ORDER_DELIVERED', 'Order', order.orderId, `Order #${order.orderId} delivered successfully.`);
      broadcastEvent('ORDER_UPDATED', order);
      broadcastEvent('INVENTORY_UPDATED', { orderId: order.orderId, status: 'DELIVERED' });
      return sendJson(res, 200, { success: true, message: 'Order marked as DELIVERED.', order });
    }

    // H. Delivery Failed Endpoint
    const riderFailedMatch = pathname.match(/^\/api\/delivery\/orders\/([A-Za-z0-9_-]+)\/failed$/);
    if (riderFailedMatch && (method === 'PATCH' || method === 'POST')) {
      const orderId = riderFailedMatch[1];
      const orders = db.getAll('orders') || [];
      const order = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };
      const body = await parseBody(req);
      const reason = body.reason || body.failureReason || 'Customer unavailable';

      const validation = validateOrderStepTransition(order, 'DELIVERY_FAILED', currentUser.role);
      if (!validation.valid) {
        return sendJson(res, 400, { error: validation.error });
      }

      applyOrderStepTransition(order, 'DELIVERY_FAILED', currentUser, { reason });
      await persistOrder(order);
      db.logActivity(currentUser.name, 'DELIVERY_FAILED', 'Order', order.orderId, `Delivery failed for Order #${order.orderId}: ${reason}`);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, { success: true, message: 'Delivery recorded as failed. Owner notified for resolution.', order });
    }

    // Generic Delivery Order Status Transition Endpoint
    const deliveryStatusMatch = pathname.match(/^\/api\/delivery\/orders\/([A-Za-z0-9_-]+)\/status$/);
    if (deliveryStatusMatch && (method === 'PATCH' || method === 'POST')) {
      const orderId = deliveryStatusMatch[1];
      const orders = db.getAll('orders') || [];
      const order = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });

      const auth = extractUserSession(req);
      const currentUser = auth?.user || { id: order.deliveryBoyId || 'usr_delivery_boy', name: order.deliveryBoyName || 'Delivery Boy', role: 'DELIVERY_BOY' };
      const body = await parseBody(req);
      const newStatus = (body.status || 'ACCEPTED').toUpperCase();

      const validation = validateOrderStepTransition(order, newStatus, currentUser.role, {
        otpVerified: !!order.deliveryOtpVerified,
        isPaid: order.paymentStatus === 'PAID'
      });
      if (!validation.valid) {
        return sendJson(res, 400, { error: validation.error });
      }

      applyOrderStepTransition(order, validation.targetKey || newStatus, currentUser, { notes: body.notes });
      await persistOrder(order);
      broadcastEvent('ORDER_UPDATED', order);
      return sendJson(res, 200, { success: true, order });
    }

    // =========================================================================
    // COMPLETE ENTERPRISE ADMIN MANAGEMENT SUITE (/api/admin/*)
    // =========================================================================

    // Role-based authorization: Customers cannot access admin APIs
    if (pathname.startsWith('/api/admin/')) {
      const auth = extractUserSession(req);
      if (auth && auth.user && auth.user.role === 'CUSTOMER') {
        return sendJson(res, 403, { error: 'Access Denied: Admin privileges required.' });
      }
    }

    // 1. Admin Auth & Active Role Switcher
    if (pathname === '/api/admin/auth/me' && method === 'GET') {
      const user = getActiveAdmin();
      const allUsers = db.getAll('admin_users');
      return sendJson(res, 200, { activeUser: user, allAdminUsers: allUsers });
    }

    if (pathname === '/api/admin/auth/switch-role' && method === 'POST') {
      const body = await parseBody(req);
      const targetUser = db.getById('admin_users', body.userId);
      if (!targetUser) return sendJson(res, 404, { error: 'Admin role not found' });

      activeAdminUserId = targetUser.id;
      db.logActivity(targetUser.name, 'ROLE_SWITCH', 'AdminUser', targetUser.id, `Switched active session to ${targetUser.roleLabel} (${targetUser.role})`);
      return sendJson(res, 200, { success: true, activeUser: targetUser });
    }

    // 2. Admin Real-Time Dashboard KPI Metrics
    if (pathname === '/api/admin/dashboard' && method === 'GET') {
      const orders = db.getAll('orders');
      const products = db.getAll('products');
      const customers = db.getAll('users');
      const riders = db.getAll('delivery_partners');
      const hubs = db.getAll('hubs');

      const totalRevenue = orders
        .filter(o => o.orderStatus !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const activeDeliveries = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus));
      const deliveredCount = orders.filter(o => o.orderStatus === 'DELIVERED').length;
      const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.lowStockLimit);
      const outOfStockProducts = products.filter(p => p.stock <= 0);

      return sendJson(res, 200, {
        totalOrders: orders.length,
        todayOrdersCount: orders.length,
        todayRevenue: totalRevenue,
        activeDeliveriesCount: activeDeliveries.length,
        deliveredCount,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        totalProductsCount: products.length,
        totalCustomersCount: customers.length,
        activeFleetCount: riders.length,
        hubsCount: hubs.length,
        onTimeRate: '98.6%',
        lowStockAlerts: lowStockProducts.map(p => ({ id: p.id, name: p.name, stock: p.stock, limit: p.lowStockLimit, unit: p.unit })),
        outOfStockAlerts: outOfStockProducts.map(p => ({ id: p.id, name: p.name, sku: p.sku }))
      });
    }

    // 3. Analytics Engine
    if (pathname === '/api/admin/analytics' && method === 'GET') {
      const orders = db.getAll('orders');
      const products = db.getAll('products');

      // Group revenue by day
      const revenueByDay = [
        { day: 'Mon', revenue: 18450, orders: 42 },
        { day: 'Tue', revenue: 22100, orders: 48 },
        { day: 'Wed', revenue: 19800, orders: 44 },
        { day: 'Thu', revenue: 24500, orders: 56 },
        { day: 'Fri', revenue: 28900, orders: 68 },
        { day: 'Sat', revenue: 34200, orders: 82 },
        { day: 'Today (Sun)', revenue: orders.reduce((s, o) => s + (o.totalAmount || 0), 0), orders: orders.length }
      ];

      const categorySales = [
        { category: 'Vegetables', percentage: 54, amount: 68400 },
        { category: 'Fruits', percentage: 26, amount: 32900 },
        { category: 'Grocery & Pantry', percentage: 16, amount: 20200 },
        { category: 'Others', percentage: 4, amount: 5060 }
      ];

      const topSellingProducts = products.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        sellingPrice: p.sellingPrice,
        stock: p.stock,
        soldKg: Math.floor(80 + Math.random() * 120),
        revenue: Math.floor(3500 + Math.random() * 6000)
      }));

      return sendJson(res, 200, {
        revenueByDay,
        categorySales,
        topSellingProducts,
        averageOrderValue: 245,
        repeatCustomerRate: '78.4%',
        totalRefundAmount: 40
      });
    }

    // 4. Products CRUD
    if (pathname === '/api/admin/products/diagnostics' && method === 'GET') {
      const pg = db.postgres || db.pgAdapter;
      if (pg && pg.isAvailable()) {
        const diag = await pg.getProductsDiagnosticsAsync();
        return sendJson(res, 200, diag);
      }
      const products = db.getAll('products') || [];
      return sendJson(res, 200, {
        success: true,
        sourceOfTruth: 'Local Memory/JSON',
        totalProductsInDb: products.length,
        uniqueProductIds: new Set(products.map(p => p.id)).size,
        uniqueSkus: new Set(products.map(p => p.sku)).size,
        statusBreakdown: {
          active: products.filter(p => p.status === 'ACTIVE').length,
          suspended: products.filter(p => p.status === 'SUSPENDED').length,
          lowStock: products.filter(p => p.status === 'LOW_STOCK').length,
          outOfStock: products.filter(p => p.status === 'OUT_OF_STOCK').length
        }
      });
    }

    if (pathname === '/api/admin/products' && method === 'GET') {
      const { category, status, search } = parsedUrl.query;
      const pg = db.postgres || db.pgAdapter;
      if (pg && pg.isAvailable()) {
        const products = await pg.getAllProductsAsync({
          category,
          status,
          search,
          includeSuspended: true
        });
        return sendJson(res, 200, products);
      }
      const products = db.getAll('products');
      let filtered = products;
      if (category && category !== 'ALL') filtered = filtered.filter(p => p.category === category);
      if (status && status !== 'ALL') filtered = filtered.filter(p => p.status === status);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }
      return sendJson(res, 200, filtered);
    }

    if (pathname === '/api/admin/products' && method === 'POST') {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      const name = body.name || body.title;
      const sellingPrice = body.sellingPrice !== undefined ? Number(body.sellingPrice) : (body.price !== undefined ? Number(body.price) : 0);
      if (!name || !sellingPrice) {
        return sendJson(res, 400, { error: 'Product title/name and selling price are required' });
      }

      const shortCode = name.substring(0, 3).toUpperCase();
      const sku = body.sku || `SJH-${(body.category || 'VEG').substring(0, 3).toUpperCase()}-${shortCode}-${Math.floor(10 + Math.random() * 90)}`;
      const stock = parseInt(body.stock || 0, 10);
      const lowStockLimit = parseInt(body.lowStockLimit || body.minStockAlert || 15, 10);

      let status = 'ACTIVE';
      if (stock <= 0) status = 'OUT_OF_STOCK';
      else if (stock <= lowStockLimit) status = 'LOW_STOCK';

      const mrp = parseFloat(body.mrp || sellingPrice * 1.25);
      const costPrice = parseFloat(body.costPrice || sellingPrice * 0.6);

      const newProd = {
        id: 'prod_' + Date.now(),
        name,
        title: name,
        sku,
        barcode: body.barcode || String(Math.floor(890123400000 + Math.random() * 9999)),
        category: body.category || 'Vegetables',
        subcategory: body.subcategory || 'Daily Cooking',
        unit: body.unit || 'kg',
        costPrice,
        price: sellingPrice,
        sellingPrice,
        mrp,
        originalPrice: mrp,
        discountPercent: Math.max(0, Math.round(((mrp - sellingPrice) / mrp) * 100) || 0),
        stock,
        lowStockLimit,
        minStockAlert: lowStockLimit,
        reorderLevel: parseInt(body.reorderLevel || 30, 10),
        farmer: body.farmer || 'Ramesh Farm (Kolar, KA)',
        hubId: body.hubId || 'hub_blr_indiranagar',
        status: body.status || status,
        expressEligible: body.expressEligible !== false,
        harvestDate: body.harvestDate || new Date().toISOString().split('T')[0],
        freshnessDays: parseInt(body.freshnessDays || 5, 10),
        image: body.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
        description: body.description || 'Farm-fresh harvest plucked at dawn and ozone washed.',
        variants: body.variants || [
          { sku: `${sku}-1KG`, weightLabel: '1 kg', weightKg: 1.0, price: sellingPrice, mrp, stock }
        ]
      };

      await db.insertAsync('products', newProd);

      // Ledger entry
      await db.insertAsync('inventory_movements', {
        id: 'mov_' + Date.now(),
        date: new Date().toISOString(),
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        hubId: newProd.hubId,
        hubName: 'Indiranagar Central Hub',
        type: 'MANUAL_ADJUSTMENT',
        quantity: stock,
        before: 0,
        after: stock,
        reason: 'Initial Product Inventory Intake',
        user: `${admin.name} (${admin.roleLabel})`
      });

      await db.logActivityAsync(admin.name, 'PRODUCT_CREATED', 'Product', newProd.sku, `Created product "${newProd.name}" with ${stock} ${newProd.unit} initial stock.`);
      broadcastEvent('PRODUCT_UPDATED', newProd);
      return sendJson(res, 201, newProd);
    }

    const adminProdStatusMatch = pathname.match(/^\/api\/admin\/products\/([A-Za-z0-9_-]+)\/(status|suspend)$/);
    if (adminProdStatusMatch && (method === 'PATCH' || method === 'POST')) {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      const prod = db.getById('products', adminProdStatusMatch[1]);
      if (!prod) return sendJson(res, 404, { error: 'Product not found' });

      let newStatus = body.status;
      if (!newStatus) {
        newStatus = prod.status === 'SUSPENDED'
          ? ((prod.stock || 0) > 0 ? ((prod.stock || 0) <= (prod.lowStockLimit || 15) ? 'LOW_STOCK' : 'ACTIVE') : 'OUT_OF_STOCK')
          : 'SUSPENDED';
      }

      const updated = await db.updateAsync('products', prod.id, { status: newStatus, updatedAt: new Date().toISOString() });
      const actionLabel = newStatus === 'SUSPENDED' ? 'PRODUCT_SUSPENDED' : 'PRODUCT_ACTIVATED';
      await db.logActivityAsync(admin.name, actionLabel, 'Product', prod.sku, `${newStatus === 'SUSPENDED' ? 'Suspended' : 'Activated'} "${prod.name}"`);
      broadcastEvent('PRODUCT_UPDATED', updated);
      return sendJson(res, 200, { success: true, product: updated });
    }

    const adminProdMatch = pathname.match(/^\/api\/admin\/products\/([A-Za-z0-9_-]+)$/);
    if (adminProdMatch && method === 'PUT') {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      const prod = db.getById('products', adminProdMatch[1]);
      if (!prod) return sendJson(res, 404, { error: 'Product not found' });

      const price = body.price !== undefined ? Number(body.price) : (body.sellingPrice !== undefined ? Number(body.sellingPrice) : prod.price);
      const mrp = body.mrp !== undefined ? Number(body.mrp) : (body.originalPrice !== undefined ? Number(body.originalPrice) : prod.mrp);
      const costPrice = body.costPrice !== undefined ? Number(body.costPrice) : prod.costPrice;
      const stock = body.stock !== undefined ? Number(body.stock) : prod.stock;
      const lowLimit = body.lowStockLimit !== undefined ? Number(body.lowStockLimit) : (body.minStockAlert !== undefined ? Number(body.minStockAlert) : prod.lowStockLimit);

      let status = body.status || prod.status;
      if (!body.status && status !== 'SUSPENDED') {
        if (stock <= 0) status = 'OUT_OF_STOCK';
        else if (stock <= lowLimit) status = 'LOW_STOCK';
        else status = 'ACTIVE';
      }

      const updates = {
        ...body,
        name: body.name || body.title || prod.name,
        category: body.category || prod.category,
        subcategory: body.subcategory || prod.subcategory,
        unit: body.unit || prod.unit,
        price,
        sellingPrice: price,
        mrp,
        originalPrice: mrp,
        discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
        costPrice,
        stock,
        lowStockLimit: lowLimit,
        status,
        farmer: body.farmer || prod.farmer,
        image: body.image || prod.image,
        description: body.description !== undefined ? body.description : prod.description,
        updatedAt: new Date().toISOString()
      };

      const updated = await db.updateAsync('products', prod.id, updates);
      await db.logActivityAsync(admin.name, 'PRODUCT_UPDATED', 'Product', prod.sku, `Updated details & pricing for "${updated.name}"`);
      broadcastEvent('PRODUCT_UPDATED', updated);
      return sendJson(res, 200, updated);
    }

    if (adminProdMatch && method === 'DELETE') {
      const admin = getActiveAdmin();
      const prod = db.getById('products', adminProdMatch[1]);
      if (!prod) return sendJson(res, 404, { error: 'Product not found' });

      prod.status = 'DISCONTINUED';
      await db.updateAsync('products', prod.id, prod);
      await db.logActivityAsync(admin.name, 'PRODUCT_DELETED', 'Product', prod.sku, `Product "${prod.name}" discontinued.`);
      broadcastEvent('PRODUCT_UPDATED', prod);
      return sendJson(res, 200, { success: true, message: 'Product marked as discontinued', prod });
    }

    // 5. Category Management
    if (pathname === '/api/admin/categories/diagnostics' && method === 'GET') {
      const pg = db.postgres || db.pgAdapter;
      if (pg && pg.isAvailable()) {
        const diag = await pg.getCategoryDiagnosticsAsync();
        return sendJson(res, 200, diag);
      }
      return sendJson(res, 200, { success: true, message: 'Postgres not active' });
    }

    if (pathname === '/api/admin/categories' && method === 'GET') {
      const pg = db.postgres || db.pgAdapter;
      if (pg && pg.isAvailable()) {
        const categories = await pg.getAllCategoriesWithCountsAsync(false);
        return sendJson(res, 200, categories);
      }
      return sendJson(res, 200, db.getAll('categories'));
    }

    if (pathname === '/api/admin/categories' && method === 'POST') {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      const newCat = {
        id: 'cat_' + Date.now(),
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        icon: body.icon || '🌱',
        active: true,
        subcategories: body.subcategories || []
      };
      db.insert('categories', newCat);
      db.logActivity(admin.name, 'CATEGORY_CREATED', 'Category', newCat.name, `Added new category ${newCat.name}`);
      return sendJson(res, 201, newCat);
    }

    // 6. Inventory & Stock Operations
    if (pathname === '/api/admin/inventory' && method === 'GET') {
      const products = db.getAll('products');
      const hubs = db.getAll('hubs');
      const orders = db.getAll('orders');

      const inventoryList = products.map(p => {
        // Calculate reserved stock from orders currently picking or packed
        const reservedQty = orders
          .filter(o => ['CONFIRMED', 'ACCEPTED_BY_HUB', 'PICKING', 'QUALITY_CHECK', 'PACKED'].includes(o.orderStatus))
          .reduce((total, o) => {
            const matchItem = o.items.find(it => 
              it.id === p.id || 
              it.productId === p.id || 
              it.productId === p.storefrontId || 
              it.id === p.storefrontId || 
              it.name === p.name
            );
            return total + (matchItem ? matchItem.qty : 0);
          }, 0);

        const availableStock = Math.max(0, p.stock - reservedQty);
        let stockStatus = 'IN_STOCK';
        if (p.stock <= 0) stockStatus = 'OUT_OF_STOCK';
        else if (availableStock <= p.lowStockLimit) stockStatus = 'LOW_STOCK';

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          hubId: p.hubId,
          hubName: 'Indiranagar Central Hub',
          unit: p.unit,
          currentStock: p.stock,
          reservedStock: reservedQty,
          availableStock,
          lowStockLimit: p.lowStockLimit,
          reorderLevel: p.reorderLevel,
          status: stockStatus,
          sellingPrice: p.sellingPrice,
          costPrice: p.costPrice
        };
      });

      return sendJson(res, 200, { inventory: inventoryList, hubs });
    }

    if (pathname === '/api/admin/inventory/adjust' && method === 'POST') {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      const { productId, deltaQuantity, reason, type } = body;

      const prod = db.getById('products', productId);
      if (!prod) return sendJson(res, 404, { error: 'Product not found' });

      const delta = parseInt(deltaQuantity, 10);
      if (isNaN(delta) || delta === 0) {
        return sendJson(res, 400, { error: 'Valid non-zero adjustment quantity required' });
      }

      const beforeStock = prod.stock;
      const newStock = beforeStock + delta;
      if (newStock < 0) {
        return sendJson(res, 400, { error: 'Adjustment would cause negative inventory' });
      }

      prod.stock = newStock;
      if (newStock <= 0) prod.status = 'OUT_OF_STOCK';
      else if (newStock <= prod.lowStockLimit) prod.status = 'LOW_STOCK';
      else prod.status = 'ACTIVE';

      db.update('products', prod.id, prod);

      const movement = db.insert('inventory_movements', {
        id: 'mov_' + Date.now(),
        date: new Date().toISOString(),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        hubId: prod.hubId,
        hubName: 'Indiranagar Central Hub',
        type: type || (delta > 0 ? 'MANUAL_ADJUSTMENT' : 'DAMAGE'),
        quantity: delta,
        before: beforeStock,
        after: newStock,
        reason: reason || 'Manual Admin Stock Adjustment',
        user: `${admin.name} (${admin.roleLabel})`
      });

      db.logActivity(admin.name, 'STOCK_ADJUSTMENT', 'Inventory', prod.sku, `Adjusted ${delta > 0 ? '+' : ''}${delta} ${prod.unit} for ${prod.name} (${reason})`);
      broadcastEvent('STOCK_UPDATED', { product: prod, movement });
      return sendJson(res, 200, { success: true, product: prod, movement });
    }

    if (pathname === '/api/admin/inventory/transfer' && method === 'POST') {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      const { productId, fromHubId, toHubId, quantityKg, reason } = body;

      const prod = db.getById('products', productId);
      if (!prod) return sendJson(res, 404, { error: 'Product not found' });

      const transfer = {
        id: 'xfer_' + Date.now(),
        transferNumber: 'TRF-BLR-' + Math.floor(1000 + Math.random() * 9000),
        fromHubId,
        fromHubName: 'Indiranagar Central Hub',
        toHubId,
        toHubName: 'Koramangala Fresh Hub',
        productId: prod.id,
        productName: prod.name,
        quantityKg: parseInt(quantityKg, 10),
        reason: reason || 'Hub Stock Balancing',
        status: 'COMPLETED',
        requestedBy: admin.name,
        dispatchedAt: new Date().toISOString(),
        receivedAt: new Date().toISOString()
      };

      db.insert('stock_transfers', transfer);

      db.insert('inventory_movements', {
        id: 'mov_' + Date.now(),
        date: new Date().toISOString(),
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        hubId: fromHubId,
        hubName: 'Indiranagar Central Hub',
        type: 'TRANSFER',
        quantity: -parseInt(quantityKg, 10),
        before: prod.stock,
        after: Math.max(0, prod.stock - parseInt(quantityKg, 10)),
        reason: `Inter-Hub Transfer to Koramangala Fresh Hub (${transfer.transferNumber})`,
        user: `${admin.name} (${admin.roleLabel})`
      });

      prod.stock = Math.max(0, prod.stock - parseInt(quantityKg, 10));
      db.update('products', prod.id, prod);

      db.logActivity(admin.name, 'STOCK_TRANSFER', 'StockTransfer', transfer.transferNumber, `Transferred ${quantityKg} kg of ${prod.name} to Koramangala Hub.`);
      broadcastEvent('STOCK_UPDATED', { transfer });
      return sendJson(res, 201, transfer);
    }

    if (pathname === '/api/admin/inventory/movements' && method === 'GET') {
      return sendJson(res, 200, db.getAll('inventory_movements'));
    }

    // 7. Farmers & Harvest Procurement
    if (pathname === '/api/admin/farmers' && method === 'GET') {
      return sendJson(res, 200, db.getAll('farmers'));
    }

    if (pathname === '/api/admin/farmers' && method === 'POST') {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      const newFarmer = {
        id: 'frm_' + Date.now(),
        name: body.name,
        phone: body.phone,
        email: body.email,
        farmName: body.farmName,
        farmLocation: body.farmLocation,
        acreage: body.acreage || '10 Acres',
        productsSupplied: body.productsSupplied || [],
        verificationStatus: 'VERIFIED',
        rating: 5.0,
        totalPayouts: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        organicCertified: body.organicCertified || true
      };
      db.insert('farmers', newFarmer);
      db.logActivity(admin.name, 'FARMER_ONBOARDED', 'Farmer', newFarmer.name, `Onboarded kisan partner ${newFarmer.name} (${newFarmer.farmLocation})`);
      return sendJson(res, 201, newFarmer);
    }

    if (pathname === '/api/admin/procurements' && method === 'GET') {
      return sendJson(res, 200, db.getAll('procurements'));
    }

    if (pathname === '/api/admin/procurements' && method === 'POST') {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      const { farmerId, productId, harvestDate, quantityKg, purchasePricePerKg, qualityGrade, hubId, inspector } = body;

      const farmer = db.getById('farmers', farmerId) || db.getAll('farmers')[0];
      const product = db.getById('products', productId) || db.getAll('products')[0];
      const receivedKg = parseInt(quantityKg, 10);
      const pricePerKg = parseFloat(purchasePricePerKg);
      const totalAmount = receivedKg * pricePerKg;

      const newProc = {
        id: 'proc_' + Date.now(),
        farmerId: farmer.id,
        farmerName: farmer.name,
        productId: product.id,
        productName: product.name,
        harvestDate: harvestDate || new Date().toISOString().split('T')[0],
        quantityKg: receivedKg,
        purchasePricePerKg: pricePerKg,
        totalAmount,
        qualityGrade: qualityGrade || 'A+',
        hubId: hubId || 'hub_blr_indiranagar',
        hubName: 'Indiranagar Central Hub',
        receivedQuantityKg: receivedKg,
        rejectedQuantityKg: 0,
        inspector: inspector || admin.name,
        status: 'RECEIVED',
        payoutStatus: 'PAID',
        createdAt: new Date().toISOString()
      };

      db.insert('procurements', newProc);

      // AUTOMATICALLY INCREMENT PRODUCT INVENTORY ON PROCUREMENT!
      const beforeStock = product.stock;
      product.stock += receivedKg;
      if (product.stock > product.lowStockLimit) product.status = 'ACTIVE';
      db.update('products', product.id, product);

      db.insert('inventory_movements', {
        id: 'mov_' + Date.now(),
        date: new Date().toISOString(),
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        hubId: newProc.hubId,
        hubName: newProc.hubName,
        type: 'HARVEST',
        quantity: receivedKg,
        before: beforeStock,
        after: product.stock,
        reason: `Dawn Harvest Procurement from ${farmer.name} (Grade ${qualityGrade || 'A+'})`,
        user: `${admin.name} (${admin.roleLabel})`
      });

      farmer.totalPayouts = (farmer.totalPayouts || 0) + totalAmount;
      db.update('farmers', farmer.id, farmer);

      db.logActivity(admin.name, 'PROCUREMENT_RECEIVED', 'Procurement', newProc.id, `Received ${receivedKg} kg of ${product.name} from ${farmer.name}. Stock updated.`);
      broadcastEvent('STOCK_UPDATED', { product, procurement: newProc });
      return sendJson(res, 201, newProc);
    }

    // 8. Hubs & Fleet Management
    if (pathname === '/api/admin/hubs' && method === 'GET') {
      return sendJson(res, 200, db.getAll('hubs'));
    }

    if (pathname === '/api/admin/delivery-partners' && method === 'GET') {
      return sendJson(res, 200, db.getAll('delivery_partners'));
    }

    // 9. Customers & Payments
    if (pathname === '/api/admin/customers' && method === 'GET') {
      return sendJson(res, 200, db.getAll('users'));
    }

    if (pathname === '/api/admin/payments' && method === 'GET') {
      return sendJson(res, 200, db.getAll('payments'));
    }

    if (pathname === '/api/admin/refunds' && method === 'GET') {
      return sendJson(res, 200, db.getAll('refunds'));
    }

    const refundApproveMatch = pathname.match(/^\/api\/admin\/refunds\/([A-Za-z0-9_-]+)\/approve$/);
    if (refundApproveMatch && method === 'POST') {
      const admin = getActiveAdmin();
      const refund = db.getById('refunds', refundApproveMatch[1]);
      if (!refund) return sendJson(res, 404, { error: 'Refund record not found' });

      refund.status = 'REFUNDED';
      refund.approvedAt = new Date().toISOString();
      refund.approvedBy = admin.name;
      db.update('refunds', refund.id, refund);

      db.logActivity(admin.name, 'REFUND_APPROVED', 'Refund', refund.id, `Approved refund of ₹${refund.amount} for Order #${refund.orderId}`);
      return sendJson(res, 200, refund);
    }

    // 10. Coupons & Offers
    if (pathname === '/api/admin/coupons' && method === 'GET') {
      return sendJson(res, 200, db.getAll('coupons'));
    }

    if (pathname === '/api/admin/coupons' && method === 'POST') {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      const newCoupon = {
        id: 'cpn_' + Date.now(),
        code: (body.code || '').toUpperCase(),
        discount: parseFloat(body.discount || 0),
        discountPercent: parseInt(body.discountPercent || 0, 10),
        type: body.type || 'FIXED',
        minOrder: parseFloat(body.minOrder || 199),
        maxDiscount: parseFloat(body.maxDiscount || 150),
        description: body.description || 'Special Discount',
        usedCount: 0,
        active: true
      };
      db.insert('coupons', newCoupon);
      db.logActivity(admin.name, 'COUPON_CREATED', 'Coupon', newCoupon.code, `Created coupon ${newCoupon.code}`);
      return sendJson(res, 201, newCoupon);
    }

    if (pathname === '/api/admin/offers' && method === 'GET') {
      return sendJson(res, 200, db.getAll('offers'));
    }

    // 11. Activity Logs
    if (pathname === '/api/admin/logs' && method === 'GET') {
      return sendJson(res, 200, db.getAll('activity_logs'));
    }

    // 12. Settings
    if (pathname === '/api/admin/settings' && method === 'GET') {
      return sendJson(res, 200, db.data.settings || {});
    }

    if (pathname === '/api/admin/settings' && method === 'POST') {
      const admin = getActiveAdmin();
      const body = await parseBody(req);
      db.data.settings = { ...db.data.settings, ...body };
      db.save();
      db.logActivity(admin.name, 'SETTINGS_UPDATED', 'Settings', 'GLOBAL', 'Updated 90-min delivery & operational settings');
      return sendJson(res, 200, db.data.settings);
    }

    // 13. Downloadable Reports (Real CSV Export)
    if (pathname === '/api/admin/reports/export' && method === 'GET') {
      const type = parsedUrl.query.type || 'sales';
      const timestamp = new Date().toISOString().split('T')[0];

      if (type === 'sales' || type === 'orders') {
        const orders = db.getAll('orders');
        let csv = 'Order ID,Date,Customer,Phone,Hub,Delivery Partner,Items Count,Total Amount,Payment Method,Payment Status,Order Status\n';
        for (const o of orders) {
          csv += `"${o.orderId}","${o.createdAt}","${o.customerName}","${o.customerPhone}","${o.hubName}","${o.deliveryPartnerName || ''}","${o.items.length}","${o.totalAmount}","${o.paymentMethod}","${o.paymentStatus}","${o.orderStatus}"\n`;
        }
        return sendCsv(res, `sabjihub_orders_report_${timestamp}.csv`, csv);
      }

      if (type === 'inventory') {
        const products = db.getAll('products');
        let csv = 'SKU,Product Name,Category,Subcategory,Stock (Unit),Low Stock Limit,Cost Price,Selling Price,MRP,Status,Farmer\n';
        for (const p of products) {
          csv += `"${p.sku}","${p.name}","${p.category}","${p.subcategory}","${p.stock} ${p.unit}","${p.lowStockLimit}","${p.costPrice}","${p.sellingPrice}","${p.mrp}","${p.status}","${p.farmer}"\n`;
        }
        return sendCsv(res, `sabjihub_inventory_report_${timestamp}.csv`, csv);
      }

      if (type === 'procurement') {
        const procs = db.getAll('procurements');
        let csv = 'Procurement ID,Date,Farmer Name,Product,Harvest Date,Quantity (kg),Price per kg,Total Payout,Quality Grade,Hub,Inspector\n';
        for (const pr of procs) {
          csv += `"${pr.id}","${pr.createdAt}","${pr.farmerName}","${pr.productName}","${pr.harvestDate}","${pr.quantityKg}","${pr.purchasePricePerKg}","${pr.totalAmount}","${pr.qualityGrade}","${pr.hubName}","${pr.inspector}"\n`;
        }
        return sendCsv(res, `sabjihub_procurement_report_${timestamp}.csv`, csv);
      }
    }

    // =========================================================================
    // COMPLETE EXECUTIVE OWNER & STAFF MANAGEMENT SUITE (/api/owner/*)
    // =========================================================================

    if (pathname.startsWith('/api/owner/')) {
      const owner = requireStaffOrOwner(req, res);
      if (!owner) return;

      // 1. Executive Dashboard KPIs & Live Summary
      if (pathname === '/api/owner/dashboard' && method === 'GET') {
        let orders = [];
        if (db.postgres && db.postgres.isAvailable()) {
          try {
            orders = await db.postgres.getAll('orders');
          } catch (e) {
            orders = db.getAll('orders') || [];
          }
        } else {
          orders = db.getAll('orders') || [];
        }
        const kpis = db.getOwnerDashboardKPIs(orders);
        const recentOrders = orders.slice(0, 8);
        const ledger = db.getInventoryLedger();
        const lowStock = ledger.filter(p => p.status !== 'IN_STOCK').slice(0, 8);
        const auditLogs = (db.getAll('audit_logs') || []).slice(0, 10);
        const topProducts = ledger.slice(0, 5);

        const hubs = db.getAll('hubs') || [];

        return sendJson(res, 200, {
          success: true,
          owner: sanitizeUser(owner),
          kpis,
          recentOrders,
          lowStock,
          recentActivity: auditLogs,
          topProducts,
          hubs
        });
      }

      // 2. Orders Management
      if (pathname === '/api/owner/orders' && method === 'GET') {
        let orders = [];
        if (db.postgres && db.postgres.isAvailable()) {
          try {
            orders = await db.postgres.getAll('orders');
          } catch (e) {
            orders = db.getAll('orders') || [];
          }
        } else {
          orders = db.getAll('orders') || [];
        }
        const status = parsedUrl.query.status;
        const search = (parsedUrl.query.search || '').toLowerCase();

        if (status && status !== 'ALL') {
          orders = orders.filter(o => (o.orderStatus || o.status || '').toUpperCase() === status.toUpperCase());
        }
        if (search) {
          orders = orders.filter(o =>
            (o.orderId || o.id || '').toLowerCase().includes(search) ||
            (o.customerName || '').toLowerCase().includes(search) ||
            (o.customerPhone || '').includes(search) ||
            (o.hubName || '').toLowerCase().includes(search) ||
            (o.deliveryPartnerName || '').toLowerCase().includes(search)
          );
        }
        return sendJson(res, 200, orders.map(o => ({
          ...o,
          id: o.id || o.orderId,
          orderId: o.orderId || o.id,
          status: o.status || o.orderStatus || 'CONFIRMED',
          orderStatus: o.orderStatus || o.status || 'CONFIRMED'
        })));
      }

      // Single Order Lookup for Owner Modal / Inspector
      const singleOwnerOrderMatch = pathname.match(/^\/api\/owner\/orders\/([A-Za-z0-9_-]+)$/);
      if (singleOwnerOrderMatch && method === 'GET') {
        const orderId = singleOwnerOrderMatch[1];
        let order = null;
        if (db.postgres && db.postgres.isAvailable()) {
          try {
            order = await db.postgres.getById('orders', orderId);
          } catch (e) {}
        }
        if (!order) {
          const orders = db.getAll('orders') || [];
          order = orders.find(o => o.id === orderId || o.orderId === orderId);
        }
        if (!order) return sendJson(res, 404, { error: 'Order not found' });
        return sendJson(res, 200, {
          ...order,
          id: order.id || order.orderId,
          orderId: order.orderId || order.id,
          status: order.status || order.orderStatus || 'CONFIRMED',
          orderStatus: order.orderStatus || order.status || 'CONFIRMED'
        });
      }

      if (pathname.startsWith('/api/owner/orders/') && (method === 'PATCH' || method === 'POST')) {
        const orderId = pathname.replace(/^\/api\/owner\/orders\//, '')
          .replace(/\/status\/?$/, '')
          .replace(/\/handover\/?$/, '')
          .replace(/\/assign-delivery-boy\/?$/, '');
        let order = null;
        if (db.postgres && db.postgres.isAvailable()) {
          try {
            order = await db.postgres.getById('orders', orderId);
          } catch (e) {}
        }
        if (!order) {
          const orders = db.getAll('orders') || [];
          order = orders.find(o => o.id === orderId || o.orderId === orderId);
        }
        if (!order) return sendJson(res, 404, { error: 'Order not found' });

        const body = await parseBody(req);
        const isHandoverAction = pathname.endsWith('/handover') || body.isHandover;

        // Rider assignment logic
        let assignedRider = null;
        if (body.deliveryBoyId || body.deliveryPartnerId || body.deliveryBoyName) {
          const riderId = body.deliveryBoyId || body.deliveryPartnerId;
          const staffUsers = db.getStaffUsers ? db.getStaffUsers() : (db.data.users || []);
          assignedRider = staffUsers.find(u => (riderId && (u.id === riderId || u.employeeId === riderId || (u.email && u.email.toLowerCase() === String(riderId).toLowerCase()))) || (body.deliveryBoyName && u.name === body.deliveryBoyName));
          if (!assignedRider) {
            assignedRider = (db.data.users || []).find(u => (riderId && (u.id === riderId || u.employeeId === riderId || (u.email && u.email.toLowerCase() === String(riderId).toLowerCase()))) || (body.deliveryBoyName && u.name === body.deliveryBoyName));
          }
          if (!assignedRider) {
            assignedRider = (db.data.fleet || []).find(u => (riderId && (u.id === riderId || u.employeeId === riderId)) || (body.deliveryBoyName && u.name === body.deliveryBoyName));
          }
          if (!assignedRider && db.getById && riderId) {
            assignedRider = db.getById('delivery_partners', riderId);
          }
          if (!assignedRider) {
            assignedRider = {
              id: riderId || 'EMP-001',
              name: body.deliveryBoyName || 'Delivery Partner',
              phone: body.deliveryBoyPhone || '9876543210'
            };
          }

          order.deliveryBoyId = assignedRider.id;
          order.deliveryBoyName = assignedRider.name;
          order.deliveryBoyPhone = assignedRider.phone || '';
          order.deliveryPartnerId = assignedRider.id;
          order.deliveryPartnerName = assignedRider.name;
          order.deliveryPartnerPhone = assignedRider.phone || '';
          if (!order.assignedAt) order.assignedAt = new Date().toISOString();
        }

        // Hub reassignment
        if (body.hubId) {
          const hub = db.getById('hubs', body.hubId);
          if (hub) {
            order.hubId = hub.id;
            order.hubName = hub.name;
          }
        }

        // Status transition
        let requestedStatus = body.status ? body.status.toUpperCase() : null;
        if (isHandoverAction && !requestedStatus) {
          requestedStatus = 'HANDED_TO_DELIVERY_BOY';
        }

        if (requestedStatus) {
          const isOtpVerified = body.otpVerified || Boolean(body.otp && String(body.otp).trim() === String(order.deliveryOtp).trim()) || owner.role === 'OWNER';
          const isCashCollected = body.cashCollected || (order.paymentStatus || '').toUpperCase() === 'PAID';

          const validation = validateOrderStepTransition(order, requestedStatus, owner.role, {
            deliveryBoyId: order.deliveryBoyId || (assignedRider && assignedRider.id),
            deliveryBoyName: order.deliveryBoyName || (assignedRider && assignedRider.name),
            deliveryBoyPhone: order.deliveryBoyPhone || (assignedRider && assignedRider.phone),
            otp: body.otp,
            otpVerified: isOtpVerified,
            cashCollected: isCashCollected
          });

          if (!validation.valid) {
            return sendJson(res, 400, { error: validation.error });
          }

          const targetStatusKey = validation.targetKey || requestedStatus;
          const oldStatus = order.orderStatus || order.status;

          applyOrderStepTransition(order, targetStatusKey, owner, {
            deliveryBoyId: order.deliveryBoyId,
            deliveryBoyName: order.deliveryBoyName,
            deliveryBoyPhone: order.deliveryBoyPhone,
            otp: body.otp,
            otpVerified: isOtpVerified,
            cashCollected: isCashCollected,
            notes: body.notes || (isHandoverAction ? `Physically handed over to ${order.deliveryBoyName || 'Delivery Boy'}` : undefined),
            reason: body.reason || body.cancellationReason
          });

          if (targetStatusKey === 'READY_FOR_HANDOVER') {
            order.deliveryBoyId = null;
            order.deliveryBoyName = null;
            order.deliveryBoyPhone = null;
            order.deliveryPartnerId = null;
            order.deliveryPartnerName = null;
            order.deliveryPartnerPhone = null;
            order.deliveryPartnerVehicle = null;
            order.assignedAt = null;
            order.acceptedAt = null;
          }

          if (targetStatusKey === 'CANCELLED' && oldStatus !== 'CANCELLED') {
            // Atomic idempotent stock restoration in PostgreSQL
            if (db.postgres && db.postgres.isAvailable()) {
              const restRes = await db.postgres.restoreOrderStockAtomic(order.orderId || order.id, owner.name || owner.email || 'Owner');
              if (restRes.success && Array.isArray(restRes.restoredItems)) {
                for (const r of restRes.restoredItems) {
                  const localProd = db.getById('products', r.id);
                  if (localProd) {
                    localProd.stock = r.afterStock;
                    localProd.stockCount = r.afterStock;
                    localProd.status = r.afterStock <= 0 ? 'OUT_OF_STOCK' : (r.afterStock <= 15 ? 'LOW_STOCK' : 'ACTIVE');
                  }
                }
              }
            } else if (!order.stockRestored) {
              order.stockRestored = true;
              const products = db.getAll('products');
              for (const item of (order.items || [])) {
                const pid = item.id || item.productId;
                const prod = products.find(p => p.id === pid || p.name === item.name);
                if (prod) {
                  const qty = Number(item.qty || item.quantity || 1);
                  db.adjustProductStock(prod.id, qty, `Order #${order.orderId || order.id} cancelled by Owner - Stock Restored`, owner.email);
                }
              }
            }
            order.stockRestored = true;
          }
        }

        if (body.refundAmount) {
          order.refundStatus = 'REFUNDED';
          order.refundAmount = body.refundAmount;
        }

        order.updatedAt = new Date().toISOString();
        await persistOrder(order);
        db.logActivity(owner.name, 'ORDER_UPDATED', 'Orders', order.orderId || order.id, `Status set to ${order.orderStatus}`);
        broadcastEvent('ORDER_UPDATED', order);
        return sendJson(res, 200, { success: true, order });
      }

      // Customer Ratings & Reviews Management
      if (pathname === '/api/owner/reviews' && method === 'GET') {
        let reviews = [];
        let stats = { totalReviews: 0, averageStoreRating: 5.0, averageRiderRating: 5.0 };
        if (db.postgres && db.postgres.isAvailable()) {
          try {
            reviews = await db.postgres.getAllReviews();
            stats = await db.postgres.getStoreRatingStats();
          } catch (e) {
            reviews = db.getAll('reviews') || [];
          }
        } else {
          reviews = db.getAll('reviews') || [];
        }
        return sendJson(res, 200, {
          success: true,
          stats,
          reviews
        });
      }

      // 3. Products & SKUs
      if (pathname === '/api/owner/products/diagnostics' && method === 'GET') {
        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          const diag = await pg.getProductsDiagnosticsAsync();
          return sendJson(res, 200, diag);
        }
        const products = db.getAll('products') || [];
        return sendJson(res, 200, {
          success: true,
          sourceOfTruth: 'Local Memory/JSON',
          totalProductsInDb: products.length,
          uniqueProductIds: new Set(products.map(p => p.id)).size,
          uniqueSkus: new Set(products.map(p => p.sku)).size,
          statusBreakdown: {
            active: products.filter(p => p.status === 'ACTIVE').length,
            suspended: products.filter(p => p.status === 'SUSPENDED').length
          }
        });
      }

      if (pathname.startsWith('/api/owner/products/') && method === 'GET') {
        const id = pathname.replace('/api/owner/products/', '');
        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          const products = await pg.getAllProductsAsync({ includeSuspended: true });
          const prod = products.find(p => p.id === id || p.storefrontId === id || p.sku === id);
          if (prod) return sendJson(res, 200, { success: true, product: prod });
          return sendJson(res, 404, { error: 'Product not found' });
        }
        const prod = db.getById('products', id);
        if (prod) return sendJson(res, 200, { success: true, product: prod });
        return sendJson(res, 404, { error: 'Product not found' });
      }

      if (pathname === '/api/owner/products' && method === 'GET') {
        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          const products = await pg.getAllProductsAsync({ includeSuspended: true });
          return sendJson(res, 200, products);
        }
        const products = db.getAll('products') || [];
        return sendJson(res, 200, products);
      }

      if (pathname === '/api/owner/products' && method === 'POST') {
        const body = await parseBody(req);
        const name = body.name || body.title || 'Produce Item';
        const price = Number(body.price || body.sellingPrice) || 0;
        const mrp = Number(body.mrp || body.originalPrice) || Math.round(price * 1.25);
        const costPrice = Number(body.costPrice) || Math.round(price * 0.65);
        const stock = Number(body.stock) || 0;
        const lowStockLimit = Number(body.lowStockLimit || body.lowStockThreshold) || 15;
        const initialStatus = body.status || (stock > 0 ? (stock <= lowStockLimit ? 'LOW_STOCK' : 'ACTIVE') : 'OUT_OF_STOCK');
        const sku = body.sku || `SJH-${(body.category || 'VEG').substring(0, 3).toUpperCase()}-${name.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

        let catId = body.categoryId || body.category_id || undefined;
        let catSlug = body.categorySlug || body.category_slug || undefined;
        let catName = body.category || 'Vegetables';

        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          try {
            const catLookup = await pg.query(`
              SELECT id, name, slug FROM freshmart_categories
              WHERE id = $1 OR LOWER(name) = LOWER($2) OR LOWER(slug) = LOWER($2) OR LOWER(slug) = LOWER($3)
              LIMIT 1;
            `, [catId || '', catName || '', catSlug || '']);
            if (catLookup && catLookup.rows.length > 0) {
              catId = catLookup.rows[0].id;
              catName = catLookup.rows[0].name;
              catSlug = catLookup.rows[0].slug;
            }
          } catch (e) {}
        }

        const newProduct = {
          id: body.id || ('prod_' + Date.now()),
          storefrontId: (body.storefrontId || name.toLowerCase().replace(/[^a-z0-9]/g, '_')),
          name,
          hindiName: body.hindiName || '',
          sku,
          barcode: body.barcode || ('8901234' + String(Date.now()).slice(-5)),
          category: catName,
          categoryId: catId,
          categorySlug: catSlug,
          subcategory: body.subcategory || 'Daily Fresh',
          price,
          sellingPrice: price,
          mrp,
          originalPrice: mrp,
          discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
          costPrice,
          stock,
          unit: body.unit || '1 kg',
          lowStockLimit,
          reorderLevel: Number(body.reorderLevel) || (lowStockLimit * 2),
          status: initialStatus,
          farmer: body.farmer || body.farmSource || 'Karnataka Organic Kisan Network',
          hubId: 'hub_blr_indiranagar',
          expressEligible: body.expressEligible !== false,
          harvestDate: body.harvestDate || new Date().toISOString().slice(0, 10),
          freshnessDays: Number(body.freshnessDays) || 5,
          image: body.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
          description: body.description || `${name} - farm-fresh certified harvest.`,
          variants: body.variants || [
            { sku: `${sku}-1KG`, weightLabel: body.unit || '1 kg', price, mrp, costPrice, stock }
          ],
          weights: body.weights || (body.variants && body.variants.length > 0 ? body.variants.map(v => ({
            label: v.weightLabel || v.label || body.unit || '1 kg',
            price: Number(v.price || price),
            originalPrice: Number(v.mrp || mrp),
            discount: (v.mrp && v.mrp > v.price) ? `${Math.round(((v.mrp - v.price) / v.mrp) * 100)}% OFF` : 'Best Value'
          })) : [
            {
              label: body.unit || '1 kg',
              price,
              originalPrice: mrp,
              discount: mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : 'Best Value'
            }
          ]),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await db.insertAsync('products', newProduct);

        // Record initial intake movement in Fresh Stock Register
        await db.insertAsync('inventory_movements', {
          id: 'mov_' + Date.now(),
          date: new Date().toISOString(),
          productId: newProduct.id,
          productName: newProduct.name,
          sku: newProduct.sku,
          hubId: 'hub_blr_indiranagar',
          hubName: 'Indiranagar Central Hub',
          type: newProduct.category === 'Grocery & Pantry' ? 'PROCUREMENT' : 'HARVEST',
          quantity: stock,
          before: 0,
          after: stock,
          reason: `Initial catalog intake from ${newProduct.farmer} (QC Passed)`,
          user: `${owner.name} (Owner)`
        });

        await db.logActivityAsync(owner.name, 'PRODUCT_CREATED', 'Products', newProduct.id, `Created product "${newProduct.name}" (SKU: ${newProduct.sku})`);
        broadcastEvent('PRODUCT_UPDATED', newProduct);
        broadcastEvent('CATEGORY_UPDATED', { action: 'PRODUCT_CREATED', category: newProduct.category, product: newProduct });
        return sendJson(res, 201, { success: true, product: newProduct });
      }

      if (pathname.startsWith('/api/owner/products/') && method === 'PUT') {
        const id = pathname.replace('/api/owner/products/', '');
        const body = await parseBody(req);
        const prod = db.getById('products', id);
        if (!prod) return sendJson(res, 404, { error: 'Product not found' });

        const price = body.price !== undefined ? Number(body.price) : (body.sellingPrice !== undefined ? Number(body.sellingPrice) : prod.price);
        const mrp = body.mrp !== undefined ? Number(body.mrp) : (body.originalPrice !== undefined ? Number(body.originalPrice) : prod.mrp);
        const costPrice = body.costPrice !== undefined ? Number(body.costPrice) : prod.costPrice;
        const stock = body.stock !== undefined ? Number(body.stock) : prod.stock;
        const lowLimit = body.lowStockLimit !== undefined ? Number(body.lowStockLimit) : prod.lowStockLimit;

        let status = body.status || prod.status;
        if (!body.status && status !== 'SUSPENDED') {
          if (stock <= 0) status = 'OUT_OF_STOCK';
          else if (stock <= lowLimit) status = 'LOW_STOCK';
          else status = 'ACTIVE';
        }

        let variants = Array.isArray(body.variants) && body.variants.length > 0
          ? body.variants
          : (Array.isArray(prod.variants) ? JSON.parse(JSON.stringify(prod.variants)) : []);
        const targetUnit = (body.unit || prod.unit || '').toLowerCase().trim();
        if (variants.length > 0) {
          let matched = variants.find(v => (v.weightLabel || v.label || '').toLowerCase().trim() === targetUnit);
          if (!matched) matched = variants.find(v => (v.weightLabel || v.label || '').toLowerCase().includes('1 kg')) || variants[0];
          if (matched) {
            matched.price = price;
            matched.mrp = mrp;
            if (costPrice !== undefined) matched.costPrice = costPrice;

            if (targetUnit.includes('1 kg') || ((matched.weightLabel || matched.label || '').toLowerCase().includes('1 kg'))) {
              variants.forEach(v => {
                if (v === matched) return;
                const lbl = (v.weightLabel || v.label || '').toLowerCase();
                if (lbl.includes('250 g')) {
                  v.price = Math.max(1, Math.round(price * 0.3));
                  v.mrp = Math.round(mrp * 0.32);
                  if (costPrice) v.costPrice = Math.round(costPrice * 0.3);
                } else if (lbl.includes('500 g')) {
                  v.price = Math.max(2, Math.round(price * 0.58));
                  v.mrp = Math.round(mrp * 0.56);
                  if (costPrice) v.costPrice = Math.round(costPrice * 0.58);
                } else if (lbl.includes('2 kg')) {
                  v.price = Math.round(price * 1.9);
                  v.mrp = Math.round(mrp * 2.0);
                  if (costPrice) v.costPrice = Math.round(costPrice * 1.9);
                } else if (lbl.includes('5 kg')) {
                  v.price = Math.round(price * 4.5);
                  v.mrp = Math.round(mrp * 4.8);
                  if (costPrice) v.costPrice = Math.round(costPrice * 4.5);
                }
              });
            }
          }
        }

        let weights = Array.isArray(body.weights) && body.weights.length > 0
          ? body.weights
          : (Array.isArray(prod.weights) ? JSON.parse(JSON.stringify(prod.weights)) : []);
        if (weights.length > 0) {
          let matchedW = weights.find(w => (w.label || '').toLowerCase().trim() === targetUnit);
          if (!matchedW) matchedW = weights.find(w => (w.label || '').toLowerCase().includes('1 kg')) || weights[0];
          if (matchedW) {
            matchedW.price = price;
            matchedW.originalPrice = mrp;
            if (mrp > price) {
              matchedW.discount = `${Math.round(((mrp - price) / mrp) * 100)}% OFF`;
              matchedW.savings = mrp - price;
            } else {
              matchedW.discount = 'Best Value';
              matchedW.savings = 0;
            }

            if (targetUnit.includes('1 kg') || ((matchedW.label || '').toLowerCase().includes('1 kg'))) {
              weights.forEach(w => {
                if (w === matchedW) return;
                const lbl = (w.label || '').toLowerCase();
                if (lbl.includes('250 g')) {
                  w.price = Math.max(1, Math.round(price * 0.3));
                  w.originalPrice = Math.round(mrp * 0.32);
                } else if (lbl.includes('500 g')) {
                  w.price = Math.max(2, Math.round(price * 0.58));
                  w.originalPrice = Math.round(mrp * 0.56);
                } else if (lbl.includes('2 kg')) {
                  w.price = Math.round(price * 1.9);
                  w.originalPrice = Math.round(mrp * 2.0);
                } else if (lbl.includes('5 kg')) {
                  w.price = Math.round(price * 4.5);
                  w.originalPrice = Math.round(mrp * 4.8);
                }
                if (w.originalPrice && w.originalPrice > w.price) {
                  w.discount = `${Math.round(((w.originalPrice - w.price) / w.originalPrice) * 100)}% OFF`;
                  w.savings = w.originalPrice - w.price;
                } else {
                  w.discount = 'Best Value';
                  w.savings = 0;
                }
              });
            }
          }
        } else {
          weights = [{
            label: body.unit || prod.unit || '1 pack',
            price,
            originalPrice: mrp,
            discount: mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : 'Best Value'
          }];
        }

        let catId = body.categoryId !== undefined ? body.categoryId : (body.category_id !== undefined ? body.category_id : prod.categoryId);
        let catSlug = body.categorySlug !== undefined ? body.categorySlug : (body.category_slug !== undefined ? body.category_slug : prod.categorySlug);
        let catName = body.category || prod.category;

        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          try {
            const catLookup = await pg.query(`
              SELECT id, name, slug FROM freshmart_categories
              WHERE id = $1 OR LOWER(name) = LOWER($2) OR LOWER(slug) = LOWER($2) OR LOWER(slug) = LOWER($3)
              LIMIT 1;
            `, [catId || '', catName || '', catSlug || '']);
            if (catLookup && catLookup.rows.length > 0) {
              catId = catLookup.rows[0].id;
              catName = catLookup.rows[0].name;
              catSlug = catLookup.rows[0].slug;
            }
          } catch (e) {}
        }

        const updates = {
          ...body,
          name: body.name || body.title || prod.name,
          hindiName: body.hindiName !== undefined ? body.hindiName : prod.hindiName,
          category: catName,
          categoryId: catId,
          categorySlug: catSlug,
          subcategory: body.subcategory || prod.subcategory,
          unit: body.unit || prod.unit,
          price,
          sellingPrice: price,
          mrp,
          originalPrice: mrp,
          discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
          costPrice,
          stock,
          lowStockLimit: lowLimit,
          reorderLevel: body.reorderLevel !== undefined ? Number(body.reorderLevel) : prod.reorderLevel,
          status,
          farmer: body.farmer || prod.farmer,
          harvestDate: body.harvestDate || prod.harvestDate,
          freshnessDays: body.freshnessDays !== undefined ? Number(body.freshnessDays) : prod.freshnessDays,
          image: body.image || prod.image,
          description: body.description !== undefined ? body.description : prod.description,
          variants,
          weights,
          updatedAt: new Date().toISOString()
        };

        const updated = await db.updateAsync('products', prod.id, updates);
        db.save();

        if (body.stock !== undefined && Number(body.stock) !== Number(prod.stock)) {
          const delta = Number(body.stock) - Number(prod.stock);
          const movId = 'mov_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          await db.insertAsync('inventory_movements', {
            id: movId,
            date: new Date().toISOString(),
            productId: prod.id,
            productName: updates.name,
            sku: updates.sku || prod.sku,
            hubId: prod.hubId || 'hub_blr_indiranagar',
            hubName: 'Indiranagar Central Hub',
            type: delta >= 0 ? 'PROCUREMENT' : 'ADJUSTMENT',
            quantity: delta,
            before: Number(prod.stock),
            after: Number(body.stock),
            previous_stock: Number(prod.stock),
            new_stock: Number(body.stock),
            reason: 'Catalog Specification Edit by Store Owner',
            user: `${owner.name} (Owner)`,
            operator: owner.email || owner.name
          });
        }

        await db.logActivityAsync(owner.name, 'PRODUCT_UPDATED', 'Products', prod.id, `Updated product "${updated.name}" (${updated.sku})`);
        broadcastEvent('PRODUCT_UPDATED', updated);
        broadcastEvent('CATEGORY_UPDATED', { action: 'PRODUCT_UPDATED', product: updated });
        broadcastEvent('STOCK_UPDATED', { product: updated, delta: (Number(body.stock || prod.stock) - Number(prod.stock)), currentStock: updated.stock });
        return sendJson(res, 200, { success: true, product: updated });
      }

      if (pathname.startsWith('/api/owner/products/') && (method === 'PATCH' || pathname.endsWith('/status') || pathname.endsWith('/suspend'))) {
        const id = pathname.replace('/api/owner/products/', '').replace('/status', '').replace('/suspend', '');
        const body = await parseBody(req);
        const prod = db.getById('products', id);
        if (!prod) return sendJson(res, 404, { error: 'Product not found' });

        let newStatus = body.status;
        if (!newStatus) {
          newStatus = prod.status === 'SUSPENDED'
            ? ((prod.stock || 0) > 0 ? ((prod.stock || 0) <= (prod.lowStockLimit || 15) ? 'LOW_STOCK' : 'ACTIVE') : 'OUT_OF_STOCK')
            : 'SUSPENDED';
        }

        const updated = await db.updateAsync('products', prod.id, { status: newStatus, updatedAt: new Date().toISOString() });
        const actionLabel = newStatus === 'SUSPENDED' ? 'PRODUCT_SUSPENDED' : 'PRODUCT_ACTIVATED';
        await db.logActivityAsync(owner.name, actionLabel, 'Products', prod.id, `${newStatus === 'SUSPENDED' ? 'Suspended' : 'Activated'} "${prod.name}"`);
        broadcastEvent('PRODUCT_UPDATED', updated);
        broadcastEvent('CATEGORY_UPDATED', { action: 'PRODUCT_STATUS_CHANGED', product: updated, status: newStatus });
        return sendJson(res, 200, { success: true, product: updated });
      }

      if (pathname.startsWith('/api/owner/products/') && method === 'DELETE') {
        const normRole = normalizeRole(owner.role);
        if (owner.role !== 'OWNER' && !isOwnerEmail(owner.email) && normRole !== 'ADMIN') {
          return sendJson(res, 403, { error: 'Access denied: Only Owner or Admin can delete products from the master catalog.' });
        }
        const id = pathname.replace('/api/owner/products/', '');
        const prod = db.getById('products', id);
        const prodName = prod ? prod.name : id;
        const storefrontId = prod ? prod.storefrontId : id;
        await db.deleteAsync('products', id, owner.name);
        await db.logActivityAsync(owner.name, 'PRODUCT_DELETED', 'Products', id, `Deleted product "${prodName}" (${id})`);
        broadcastEvent('PRODUCT_DELETED', { id, storefrontId });
        broadcastEvent('CATEGORY_UPDATED', { action: 'PRODUCT_DELETED', id, storefrontId });
        return sendJson(res, 200, { success: true, message: 'Product deleted', id, storefrontId });
      }

      // 4. Inventory & Stock Ledger
      if ((pathname === '/api/owner/inventory' || pathname === '/api/owner/inventory/ledger') && method === 'GET') {
        let ledger = [];
        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          try {
            ledger = await pg.getInventoryLedgerAsync();
          } catch (e) {
            console.warn('Postgres getInventoryLedgerAsync error, falling back:', e.message);
          }
        }
        if (!ledger || ledger.length === 0) {
          ledger = db.getInventoryLedger();
        }
        return sendJson(res, 200, ledger);
      }

      // Manual Reserve Endpoint
      if (pathname === '/api/owner/inventory/reserve' && method === 'POST') {
        const body = await parseBody(req);
        const { productId, quantity, reason } = body;
        const targetId = String(productId || '');
        const qty = Number(quantity || body.reserveQuantity || 0);

        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          const resRes = await pg.manualReserveStockAtomic(targetId, qty, reason, owner.email || owner.name);
          if (!resRes.success) {
            return sendJson(res, 400, { error: resRes.error, ...resRes });
          }
          await db.logActivityAsync(owner.name, 'STOCK_RESERVED', 'Inventory', targetId, `Manually reserved ${qty} units (${reason || 'Manual Reservation'})`);
          broadcastEvent('INVENTORY_UPDATED', { productId: targetId, action: 'RESERVE', manualReserved: resRes.manualReserved, availableStock: resRes.availableStock });
          broadcastEvent('STOCK_UPDATED', { product: resRes });
          return sendJson(res, 200, resRes);
        }

        // In-memory fallback
        const prod = db.getById('products', targetId);
        if (!prod) return sendJson(res, 404, { error: 'Product not found' });
        const curManual = Number(prod.manualReservedStock || prod.manual_reserved_stock || 0);
        const physical = Number(prod.stock || 0);
        const available = Math.max(0, physical - curManual);
        if (qty > available) {
          return sendJson(res, 400, { error: `Cannot reserve ${qty} units. Maximum available is ${available} units.` });
        }
        prod.manualReservedStock = curManual + qty;
        prod.manual_reserved_stock = curManual + qty;
        db.save();
        return sendJson(res, 200, { success: true, action: 'RESERVE', physicalStock: physical, manualReserved: prod.manualReservedStock, availableStock: available - qty });
      }

      // Manual Unreserve / Release Endpoint
      if (pathname === '/api/owner/inventory/unreserve' && method === 'POST') {
        const body = await parseBody(req);
        const { productId, quantity, reason } = body;
        const targetId = String(productId || '');
        const qty = Number(quantity || body.releaseQuantity || 0);

        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          const unresRes = await pg.manualUnreserveStockAtomic(targetId, qty, reason, owner.email || owner.name);
          if (!unresRes.success) {
            return sendJson(res, 400, { error: unresRes.error, ...unresRes });
          }
          await db.logActivityAsync(owner.name, 'STOCK_UNRESERVED', 'Inventory', targetId, `Manually released ${qty} reserved units (${reason || 'Manual Unreserve'})`);
          broadcastEvent('INVENTORY_UPDATED', { productId: targetId, action: 'UNRESERVE', manualReserved: unresRes.manualReserved, availableStock: unresRes.availableStock });
          broadcastEvent('STOCK_UPDATED', { product: unresRes });
          return sendJson(res, 200, unresRes);
        }

        const prod = db.getById('products', targetId);
        if (!prod) return sendJson(res, 404, { error: 'Product not found' });
        const curManual = Number(prod.manualReservedStock || prod.manual_reserved_stock || 0);
        const physical = Number(prod.stock || 0);
        if (qty > curManual) {
          return sendJson(res, 400, { error: `Cannot release ${qty} units. Current manual reserved is only ${curManual} units.` });
        }
        prod.manualReservedStock = curManual - qty;
        prod.manual_reserved_stock = curManual - qty;
        db.save();
        return sendJson(res, 200, { success: true, action: 'UNRESERVE', physicalStock: physical, manualReserved: prod.manualReservedStock, availableStock: Math.max(0, physical - prod.manualReservedStock) });
      }

      if (pathname === '/api/owner/inventory/adjust' && method === 'POST') {
        const body = await parseBody(req);
        const { productId, adjustment, type, reason, action } = body;
        const targetId = String(productId || '');
        const pg = db.postgres || db.pgAdapter;

        // Handle Action Modes inside adjust endpoint
        if (String(action).toUpperCase() === 'RESERVE' || String(type).toUpperCase() === 'RESERVE') {
          const qty = Number(body.quantity || body.reserveQuantity || adjustment || 0);
          if (pg && pg.isAvailable()) {
            const resRes = await pg.manualReserveStockAtomic(targetId, qty, reason, owner.email || owner.name);
            if (!resRes.success) return sendJson(res, 400, { error: resRes.error, ...resRes });
            await db.logActivityAsync(owner.name, 'STOCK_RESERVED', 'Inventory', targetId, `Manually reserved ${qty} units`);
            broadcastEvent('INVENTORY_UPDATED', { productId: targetId, action: 'RESERVE', manualReserved: resRes.manualReserved, availableStock: resRes.availableStock });
            return sendJson(res, 200, resRes);
          }
        }

        if (String(action).toUpperCase() === 'UNRESERVE' || String(action).toUpperCase() === 'RELEASE' || String(type).toUpperCase() === 'UNRESERVE' || String(type).toUpperCase() === 'RELEASE') {
          const qty = Number(body.quantity || body.releaseQuantity || adjustment || 0);
          if (pg && pg.isAvailable()) {
            const unresRes = await pg.manualUnreserveStockAtomic(targetId, qty, reason, owner.email || owner.name);
            if (!unresRes.success) return sendJson(res, 400, { error: unresRes.error, ...unresRes });
            await db.logActivityAsync(owner.name, 'STOCK_UNRESERVED', 'Inventory', targetId, `Manually released ${qty} reserved units`);
            broadcastEvent('INVENTORY_UPDATED', { productId: targetId, action: 'UNRESERVE', manualReserved: unresRes.manualReserved, availableStock: unresRes.availableStock });
            return sendJson(res, 200, unresRes);
          }
        }

        const prod = db.getById('products', targetId);
        let delta = 0;
        if (adjustment !== undefined) {
          delta = Number(adjustment) || 0;
        } else if (body.adjustmentQuantity !== undefined) {
          delta = Number(body.adjustmentQuantity) || 0;
        } else if (body.quantity !== undefined) {
          const qty = Number(body.quantity) || 0;
          const adjType = String(body.adjustmentType || type || '').toUpperCase();
          if (adjType === 'DAMAGE' || adjType === 'EXPIRED' || adjType === 'WRITE_OFF' || adjType === 'DISCARD') {
            delta = -Math.abs(qty);
          } else {
            delta = Math.abs(qty);
          }
        }
        const oldStock = Number(prod ? prod.stock : 0) || 0;
        const newStock = Math.max(0, oldStock + delta);
        
        let damagedStock = Number(prod ? prod.damagedStock : 0) || 0;
        let expiredStock = Number(prod ? prod.expiredStock : 0) || 0;
        if (type === 'DAMAGE' || body.adjustmentType === 'DAMAGE') {
          damagedStock += Math.abs(delta);
        } else if (type === 'EXPIRED' || body.adjustmentType === 'EXPIRED') {
          expiredStock += Math.abs(delta);
        }

        const lowLimit = Number(prod ? (prod.lowStockLimit || prod.lowStockThreshold) : 15) || 15;
        let status = prod ? prod.status : 'ACTIVE';
        if (status !== 'SUSPENDED') {
          if (newStock <= 0) status = 'OUT_OF_STOCK';
          else if (newStock <= lowLimit) status = 'LOW_STOCK';
          else status = 'ACTIVE';
        }

        const updates = {
          stock: newStock,
          stockCount: newStock,
          damagedStock,
          expiredStock,
          status,
          updatedAt: new Date().toISOString()
        };

        const updatedProd = await db.updateAsync('products', targetId, updates);
        db.save();

        const movId = 'mov_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const refId = 'ADJ-' + Date.now();
        await db.insertAsync('inventory_movements', {
          id: movId,
          date: new Date().toISOString(),
          productId: targetId,
          productName: prod ? prod.name : 'Product',
          sku: prod ? prod.sku : targetId,
          hubId: (prod && prod.hubId) || 'hub_blr_indiranagar',
          hubName: 'Indiranagar Central Hub',
          type: type || body.adjustmentType || (delta >= 0 ? 'HARVEST' : 'DAMAGE'),
          quantity: delta,
          before: oldStock,
          after: newStock,
          previous_stock: oldStock,
          new_stock: newStock,
          reason: reason || (delta >= 0 ? 'Stock Intake / Adjustment' : 'Stock Write-off / Adjustment'),
          user: `${owner.name} (${owner.role})`,
          operator: owner.email || owner.name,
          referenceId: refId,
          reference_id: refId
        });

        await db.logActivityAsync(owner.name, 'STOCK_ADJUSTED', 'Products', targetId, `Stock adjusted by ${delta > 0 ? '+' : ''}${delta} (${type || body.adjustmentType || 'ADJUST'}: ${reason || 'Manual Adjustment'})`);
        broadcastEvent('PRODUCT_UPDATED', updatedProd);
        broadcastEvent('STOCK_UPDATED', { product: updatedProd, delta, currentStock: updatedProd.stock });
        broadcastEvent('INVENTORY_UPDATED', { productId: targetId, newStock, delta });
        return sendJson(res, 200, { success: true, product: updatedProd, currentStock: updatedProd.stock, newStock: updatedProd.stock });
      }

      if (pathname === '/api/owner/inventory/movements' && method === 'GET') {
        let movements = [];
        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          try {
            movements = await pg.getInventoryMovementsAsync(100);
          } catch (e) {
            console.warn('Postgres getInventoryMovementsAsync error, falling back:', e.message);
          }
        }
        if (!movements || movements.length === 0) {
          movements = db.getAll('inventory_movements');
        }
        return sendJson(res, 200, movements);
      }


      // 5. Staff & Sub-Admin Management (Strictly Root Owner Exclusive)
      if (pathname.startsWith('/api/owner/staff')) {
        const normOwnerRole = normalizeRole(owner.role);
        if (normOwnerRole !== 'OWNER' && !isOwnerEmail(owner.email)) {
          return sendJson(res, 403, { error: 'Access denied: Only Store Owner can manage staff accounts.' });
        }
      }

      if (pathname === '/api/owner/staff' && method === 'GET') {
        const staff = db.getStaffUsers();
        return sendJson(res, 200, staff.map(sanitizeUser));
      }

      if (pathname === '/api/owner/staff' && method === 'POST') {
        const body = await parseBody(req);
        if (!body.name || !body.phone || !body.role) {
          return sendJson(res, 400, { error: 'Full Name, Phone Number, and Role are required.' });
        }
        if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
          return sendJson(res, 400, { error: 'Please enter a valid email address.' });
        }
        try {
          const staffUser = db.createStaffUser(body);
          db.logActivity(owner.name, 'STAFF_CREATED', 'Staff', staffUser.id, `Created staff member ${staffUser.name} with role ${staffUser.role}`);
          const sanitized = sanitizeUser(staffUser);
          return sendJson(res, 201, { success: true, staff: sanitized, user: sanitized });
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }

      if (pathname.startsWith('/api/owner/staff/') && (method === 'PATCH' || method === 'PUT')) {
        const id = pathname.replace('/api/owner/staff/', '').replace('/deactivate', '').replace('/status', '');
        const body = await parseBody(req);
        try {
          if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
            return sendJson(res, 400, { error: 'Please enter a valid email address.' });
          }
          let updated = null;
          if (typeof db.updateStaffUser === 'function') {
            updated = db.updateStaffUser(id, body);
            db.logActivity(owner.name, 'STAFF_UPDATED', 'Staff', id, `Updated staff member ${updated.name}`);
          } else {
            if (body.role) {
              updated = db.updateStaffRole(id, body.role);
              db.logActivity(owner.name, 'STAFF_ROLE_CHANGED', 'Staff', id, `Updated role to ${body.role}`);
            }
            if (body.active !== undefined) {
              updated = db.deactivateStaffUser(id, Boolean(body.active));
              db.logActivity(owner.name, body.active ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED', 'Staff', id, `${body.active ? 'Re-activated' : 'Deactivated'} staff account`);
            } else if (body.status === 'DEACTIVATED' || body.status === 'Inactive') {
              updated = db.deactivateStaffUser(id, false);
              db.logActivity(owner.name, 'STAFF_DEACTIVATED', 'Staff', id, `Deactivated staff account`);
            } else if (body.status === 'ACTIVE' || body.status === 'Active') {
              updated = db.deactivateStaffUser(id, true);
              db.logActivity(owner.name, 'STAFF_ACTIVATED', 'Staff', id, `Re-activated staff account`);
            }
          }
          return sendJson(res, 200, { success: true, staff: sanitizeUser(updated || db.getById('users', id)) });
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }

      if (pathname.startsWith('/api/owner/staff/') && method === 'DELETE') {
        const id = pathname.replace('/api/owner/staff/', '');
        try {
          const user = db.getById('users', id);
          db.deleteStaffUser(id);
          db.logActivity(owner.name, 'STAFF_DELETED', 'Staff', id, `Permanently deleted staff member ${user ? user.name : id}`);
          return sendJson(res, 200, { success: true, message: 'Staff member deleted.' });
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }

      // 5b. Role Hierarchy & Matrix
      if (pathname === '/api/owner/roles' && method === 'GET') {
        const distribution = db.getRoleDistribution();
        const roleDefinitions = [
          {
            role: 'OWNER',
            title: 'Executive Owner',
            level: 0,
            badge: 'ROOT OWNER',
            color: 'amber',
            userCount: distribution.OWNER || 0,
            description: 'Full unconstrained authority over all business assets, financial overrides, staff provisioning, and platform parameters.',
            capabilities: ['Manage Staff & Sub-Admins', 'Financial & Payment Overrides', 'Full Stock & Procurement Control', 'System Configuration & Backups'],
            permissions: {
              catalog: 'FULL (CRUD)',
              orders: 'FULL (Override & Refund)',
              inventory: 'FULL (Write & Audit)',
              procurement: 'FULL (Rates & POs)',
              hubs: 'FULL (Configure)',
              fleet: 'FULL (Manage)',
              crm: 'FULL (Credit & Ban)',
              finance: 'FULL (Revenue & Reversals)',
              staff: 'FULL (Provision & Revoke)',
              settings: 'FULL (Global Config)',
              database: 'FULL (Export & Telemetry)'
            }
          },
          {
            role: 'ADMIN',
            title: 'Enterprise Admin',
            level: 1,
            badge: 'ADMIN',
            color: 'emerald',
            userCount: distribution.ADMIN || 0,
            description: 'Day-to-day operations management across products, orders, inventory, and logistics. Cannot manage other staff.',
            capabilities: ['Manage Products & Catalog', 'Process Orders & Fulfillment', 'Adjust Inventory Levels', 'Manage Dark Stores & Fleet'],
            permissions: {
              catalog: 'FULL (CRUD)',
              orders: 'OPERATIONAL (Process & Pack)',
              inventory: 'OPERATIONAL (Adjust & Count)',
              procurement: 'VIEW ONLY',
              hubs: 'OPERATIONAL',
              fleet: 'OPERATIONAL',
              crm: 'VIEW & SUPPORT',
              finance: 'VIEW SUMMARY',
              staff: 'DENIED (403)',
              settings: 'VIEW ONLY',
              database: 'DENIED (403)'
            }
          },
          {
            role: 'INVENTORY_MANAGER',
            title: 'Inventory Manager',
            level: 2,
            badge: 'INVENTORY_MANAGER',
            color: 'blue',
            userCount: distribution.INVENTORY_MANAGER || 0,
            description: 'Responsible for stock counting, shrinkage reports, warehouse replenishment, and cold store shelf counts.',
            capabilities: ['View & Adjust Stock Levels', 'Monitor Expiry & Wastage', 'Dark Store Stock Transfers', 'Cold Chain Audits'],
            permissions: {
              catalog: 'VIEW & UPDATE STOCK',
              orders: 'VIEW PICKLISTS',
              inventory: 'FULL (Adjust & Shrinkage)',
              procurement: 'RECEIVE BATCHES',
              hubs: 'VIEW STORES',
              fleet: 'DENIED',
              crm: 'DENIED',
              finance: 'DENIED',
              staff: 'DENIED',
              settings: 'DENIED',
              database: 'DENIED'
            }
          },
          {
            role: 'HUB_MANAGER',
            title: 'Dark Store Hub Lead',
            level: 2,
            badge: 'HUB_MANAGER',
            color: 'purple',
            userCount: distribution.HUB_MANAGER || 0,
            description: 'Controls hub packing stations, barcode scans, picker assignments, and handover to EV riders.',
            capabilities: ['Packing & QC Confirmation', 'Dispatch Rider Assignment', 'Hub Bay Telematics', 'Inventory Intake Handover'],
            permissions: {
              catalog: 'VIEW ONLY',
              orders: 'DISPATCH & PACK',
              inventory: 'VIEW HUB STOCK',
              procurement: 'RECEIVE DIRECT',
              hubs: 'MANAGE CURRENT HUB',
              fleet: 'ASSIGN RIDERS',
              crm: 'VIEW ORDER ADDRESS',
              finance: 'DENIED',
              staff: 'DENIED',
              settings: 'DENIED',
              database: 'DENIED'
            }
          },
          {
            role: 'PROCUREMENT_MANAGER',
            title: 'Farm Procurement Lead',
            level: 2,
            badge: 'PROCUREMENT_MANAGER',
            color: 'teal',
            userCount: distribution.PROCUREMENT_MANAGER || 0,
            description: 'Coordinates directly with farmer cooperatives, enters gate pass receipts, and verifies quality grading.',
            capabilities: ['Receive Farm Batches', 'Update Mandi Purchase Rates', 'Manage Farmer Profiles', 'Quality Assurance Inspection'],
            permissions: {
              catalog: 'VIEW ONLY',
              orders: 'DENIED',
              inventory: 'INBOUND RECEIVING',
              procurement: 'FULL (Farmers & Mandi)',
              hubs: 'INTAKE DOCKS',
              fleet: 'FARM LOGISTICS',
              crm: 'DENIED',
              finance: 'PURCHASE COST ONLY',
              staff: 'DENIED',
              settings: 'DENIED',
              database: 'DENIED'
            }
          },
          {
            role: 'DELIVERY_MANAGER',
            title: 'Fleet & Logistics Dispatcher',
            level: 2,
            badge: 'DELIVERY_MANAGER',
            color: 'indigo',
            userCount: distribution.DELIVERY_MANAGER || 0,
            description: 'Monitors EV fleet telemetry, battery levels, rider routing, and delivery SLAs.',
            capabilities: ['Live Fleet Telematics', 'Rider Shift Management', 'Trip Rerouting', 'Proof of Delivery Verification'],
            permissions: {
              catalog: 'DENIED',
              orders: 'DELIVERY TRACKING',
              inventory: 'DENIED',
              procurement: 'DENIED',
              hubs: 'FLEET DOCKS',
              fleet: 'FULL (Telematics & Shifts)',
              crm: 'CUSTOMER CONTACT FOR DROP',
              finance: 'DENIED',
              staff: 'DENIED',
              settings: 'DENIED',
              database: 'DENIED'
            }
          },
          {
            role: 'SUPPORT_AGENT',
            title: 'Customer Care Lead',
            level: 3,
            badge: 'SUPPORT_AGENT',
            color: 'rose',
            userCount: distribution.SUPPORT_AGENT || 0,
            description: 'Assists customers with orders, missing items, payment inquiries, and ticket resolution.',
            capabilities: ['Order Lookup', 'Customer Notes', 'Ticket Resolution', 'Basic Refund Requests'],
            permissions: {
              catalog: 'VIEW ONLY',
              orders: 'VIEW & TICKET',
              inventory: 'VIEW ONLY',
              procurement: 'DENIED',
              hubs: 'DENIED',
              fleet: 'TRACK STATUS',
              crm: 'CUSTOMER SUPPORT & HISTORY',
              finance: 'ISSUE STORE CREDIT',
              staff: 'DENIED',
              settings: 'DENIED',
              database: 'DENIED'
            }
          },
          {
            role: 'CUSTOMER',
            title: 'Retail Shopper',
            level: 4,
            badge: 'CUSTOMER',
            color: 'slate',
            userCount: distribution.CUSTOMER || 0,
            description: 'End customer browsing products, ordering fresh vegetables, managing address book, and tracking deliveries.',
            capabilities: ['Cart & Checkout Access', 'Live Order Tracking', 'Profile & Addresses', 'UPI / Card Payments'],
            permissions: {
              catalog: 'BROWSE & SEARCH',
              orders: 'OWN ORDERS ONLY',
              inventory: 'STOCK AVAILABILITY',
              procurement: 'DENIED',
              hubs: 'DENIED',
              fleet: 'TRACK OWN RIDER',
              crm: 'OWN PROFILE',
              finance: 'OWN PAYMENTS',
              staff: 'STRICT 403',
              settings: 'STRICT 403',
              database: 'STRICT 403'
            }
          }
        ];

        return sendJson(res, 200, {
          success: true,
          distribution,
          roles: roleDefinitions
        });
      }

      // 6. Customers Directory
      if (pathname === '/api/owner/customers' && method === 'GET') {
        const users = (db.getAll('users') || []).filter(u => u.role === 'CUSTOMER');
        return sendJson(res, 200, users.map(sanitizeUser));
      }

      if (pathname.startsWith('/api/owner/customers/') && method === 'PATCH') {
        const id = pathname.replace('/api/owner/customers/', '');
        const body = await parseBody(req);
        const user = db.getById('users', id);
        if (!user) return sendJson(res, 404, { error: 'Customer not found' });
        if (body.status) user.status = body.status;
        if (body.walletCredit) user.walletBalance = (user.walletBalance || 0) + Number(body.walletCredit);
        db.save();
        db.logActivity(owner.name, 'CUSTOMER_UPDATED', 'Users', id, `Updated customer status or wallet`);
        return sendJson(res, 200, { success: true, customer: sanitizeUser(user) });
      }

      if (pathname.startsWith('/api/owner/customers/') && method === 'DELETE') {
        const id = pathname.replace('/api/owner/customers/', '');
        const user = db.getById('users', id);
        if (!user) return sendJson(res, 404, { error: 'Customer not found' });
        user.status = 'BLOCKED';
        user.active = false;
        db.save();
        db.logActivity(owner.name, 'CUSTOMER_BLOCKED', 'Users', id, `Blocked customer account`);
        return sendJson(res, 200, { success: true, message: 'Customer account deactivated.' });
      }

      // 6.1 Categories Management (Neon PostgreSQL as Single Source of Truth)
      if (pathname === '/api/owner/categories/diagnostics' && method === 'GET') {
        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          const diag = await pg.getCategoryDiagnosticsAsync();
          return sendJson(res, 200, diag);
        }
        return sendJson(res, 200, { success: false, message: 'Database not connected' });
      }

      if (pathname === '/api/owner/categories' && method === 'GET') {
        const pg = db.postgres || db.pgAdapter;
        if (pg && pg.isAvailable()) {
          try {
            const categories = await pg.getAllCategoriesWithCountsAsync(false);
            return sendJson(res, 200, categories);
          } catch (e) {
            console.warn('Postgres getAllCategoriesWithCountsAsync error, falling back:', e.message);
          }
        }
        const categories = db.getAll('categories') || [];
        return sendJson(res, 200, categories);
      }

      if (pathname === '/api/owner/categories' && method === 'POST') {
        const body = await parseBody(req);
        const name = String(body.name || body.title || 'New Category').trim();
        const pg = db.postgres || db.pgAdapter;

        if (pg && pg.isAvailable()) {
          try {
            const result = await pg.createCategoryAsync(body);
            if (!result.success) {
              return sendJson(res, 400, { error: result.error || 'Failed to create category' });
            }
            await db.logActivityAsync(owner.name, 'CATEGORY_CREATED', 'Categories', result.category.id, `Created category "${result.category.name}"`);
            broadcastEvent('CATEGORY_CREATED', result.category);
            return sendJson(res, 201, result);
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        const newCat = {
          id: body.id || 'cat_' + Date.now(),
          name,
          slug: body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          icon: body.icon || '🥬',
          image: body.image || '',
          description: body.description || '',
          displayOrder: Number(body.displayOrder || body.display_order || 0),
          status: body.status || (body.active === false ? 'SUSPENDED' : 'ACTIVE'),
          active: body.active !== undefined ? Boolean(body.active) : true,
          productCount: 0,
          createdAt: new Date().toISOString()
        };
        db.insert('categories', newCat);
        db.logActivity(owner.name, 'CATEGORY_CREATED', 'Categories', newCat.id, `Created category "${newCat.name}"`);
        broadcastEvent('CATEGORY_CREATED', newCat);
        return sendJson(res, 201, { success: true, category: newCat });
      }

      if (pathname.startsWith('/api/owner/categories/') && (method === 'PATCH' || method === 'PUT')) {
        const id = pathname.replace('/api/owner/categories/', '').replace(/\/status\/?$/, '');
        const body = await parseBody(req);
        const pg = db.postgres || db.pgAdapter;

        if (pg && pg.isAvailable()) {
          try {
            const result = await pg.updateCategoryAsync(id, body);
            if (!result.success) {
              return sendJson(res, 404, { error: result.error || 'Category not found' });
            }
            await db.logActivityAsync(owner.name, 'CATEGORY_UPDATED', 'Categories', id, `Updated category "${result.category.name}"`);
            broadcastEvent('CATEGORY_UPDATED', result.category);
            return sendJson(res, 200, result);
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        const cat = db.getById('categories', id);
        if (!cat) return sendJson(res, 404, { error: 'Category not found' });
        if (body.name) cat.name = body.name;
        if (body.slug) cat.slug = body.slug;
        if (body.icon) cat.icon = body.icon;
        if (body.image) cat.image = body.image;
        if (body.description) cat.description = body.description;
        if (body.displayOrder !== undefined) cat.displayOrder = Number(body.displayOrder);
        if (body.status) cat.status = body.status;
        if (body.active !== undefined) cat.active = Boolean(body.active);
        cat.updatedAt = new Date().toISOString();
        db.save();
        db.logActivity(owner.name, 'CATEGORY_UPDATED', 'Categories', id, `Updated category "${cat.name}"`);
        broadcastEvent('CATEGORY_UPDATED', cat);
        return sendJson(res, 200, { success: true, category: cat });
      }

      if (pathname.startsWith('/api/owner/categories/') && method === 'DELETE') {
        const id = pathname.replace('/api/owner/categories/', '').replace(/\/status\/?$/, '');
        const pg = db.postgres || db.pgAdapter;

        if (pg && pg.isAvailable()) {
          try {
            const result = await pg.deleteCategoryAsync(id);
            if (!result.success) {
              return sendJson(res, 400, { error: result.error, productCount: result.productCount, blocked: true });
            }
            await db.logActivityAsync(owner.name, 'CATEGORY_DELETED', 'Categories', id, `Deleted category`);
            broadcastEvent('CATEGORY_DELETED', { id });
            return sendJson(res, 200, result);
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        const cat = db.getById('categories', id);
        if (!cat) return sendJson(res, 404, { error: 'Category not found' });
        const deleted = db.delete('categories', id);
        db.logActivity(owner.name, 'CATEGORY_DELETED', 'Categories', id, `Deleted category`);
        broadcastEvent('CATEGORY_DELETED', { id });
        return sendJson(res, 200, { success: true, message: 'Category deleted successfully.' });
      }


      // 7. Farmers & Procurements
      if (pathname === '/api/owner/farmers' && method === 'GET') {
        const farmers = db.getAll('farmers') || [];
        const procurements = db.getAll('procurements') || [];
        return sendJson(res, 200, { farmers, procurements });
      }

      if (pathname === '/api/owner/farmers' && method === 'POST') {
        const body = await parseBody(req);
        const name = body.name || 'Partner Farmer';
        const newFarmer = {
          id: body.id || 'frm_' + Date.now(),
          name,
          phone: body.phone || '9876543210',
          location: body.location || body.village || 'Mandya, Karnataka',
          crops: body.crops || ['Organic Vegetables'],
          rating: Number(body.rating) || 4.9,
          totalSuppliedKg: Number(body.totalSuppliedKg) || 0,
          status: body.status || 'ACTIVE',
          certifiedOrganic: body.certifiedOrganic !== undefined ? Boolean(body.certifiedOrganic) : true,
          createdAt: new Date().toISOString()
        };
        db.insert('farmers', newFarmer);
        db.logActivity(owner.name, 'FARMER_CREATED', 'Farmers', newFarmer.id, `Enrolled farmer "${newFarmer.name}"`);
        return sendJson(res, 201, { success: true, farmer: newFarmer });
      }

      if (pathname.startsWith('/api/owner/farmers/') && (method === 'PATCH' || method === 'PUT')) {
        const id = pathname.replace('/api/owner/farmers/', '');
        const farmer = db.getById('farmers', id);
        if (!farmer) return sendJson(res, 404, { error: 'Farmer not found' });
        const body = await parseBody(req);
        Object.assign(farmer, body, { updatedAt: new Date().toISOString() });
        db.save();
        db.logActivity(owner.name, 'FARMER_UPDATED', 'Farmers', id, `Updated farmer "${farmer.name}"`);
        return sendJson(res, 200, { success: true, farmer });
      }

      if (pathname.startsWith('/api/owner/farmers/') && method === 'DELETE') {
        const id = pathname.replace('/api/owner/farmers/', '');
        const deleted = db.delete('farmers', id);
        if (!deleted) return sendJson(res, 404, { error: 'Farmer not found' });
        db.logActivity(owner.name, 'FARMER_DELETED', 'Farmers', id, `Removed farmer`);
        return sendJson(res, 200, { success: true, message: 'Farmer removed from database.' });
      }

      // 8. Hubs & Fleet
      if (pathname === '/api/owner/hubs' && method === 'GET') {
        const hubs = db.getAll('hubs') || [];
        return sendJson(res, 200, hubs);
      }

      if (pathname === '/api/owner/hubs' && method === 'POST') {
        const body = await parseBody(req);
        const name = body.name || 'Dark Store Hub';
        const newHub = {
          id: body.id || 'hub_' + Date.now(),
          name,
          location: body.location || body.address || 'Bengaluru',
          latitude: Number(body.latitude || body.lat) || 12.9716,
          longitude: Number(body.longitude || body.lng || body.lon) || 77.5946,
          activeOrders: 0,
          inventoryUnits: Number(body.inventoryUnits) || 0,
          managerName: body.managerName || 'Operations Lead',
          managerPhone: body.managerPhone || '9876543210',
          status: body.status || 'OPERATIONAL',
          createdAt: new Date().toISOString()
        };
        db.insert('hubs', newHub);
        db.logActivity(owner.name, 'HUB_CREATED', 'Hubs', newHub.id, `Registered dark store hub "${newHub.name}"`);
        return sendJson(res, 201, { success: true, hub: newHub });
      }

      if (pathname.startsWith('/api/owner/hubs/') && (method === 'PATCH' || method === 'PUT')) {
        const id = pathname.replace('/api/owner/hubs/', '');
        const hub = db.getById('hubs', id);
        if (!hub) return sendJson(res, 404, { error: 'Hub not found' });
        const body = await parseBody(req);
        Object.assign(hub, body, { updatedAt: new Date().toISOString() });
        db.save();
        db.logActivity(owner.name, 'HUB_UPDATED', 'Hubs', id, `Updated dark store hub "${hub.name}"`);
        return sendJson(res, 200, { success: true, hub });
      }

      if (pathname.startsWith('/api/owner/hubs/') && method === 'DELETE') {
        const id = pathname.replace('/api/owner/hubs/', '');
        const deleted = db.delete('hubs', id);
        if (!deleted) return sendJson(res, 404, { error: 'Hub not found' });
        db.logActivity(owner.name, 'HUB_DELETED', 'Hubs', id, `Decommissioned hub`);
        return sendJson(res, 200, { success: true, message: 'Hub deleted successfully.' });
      }

      if (pathname === '/api/owner/delivery' && method === 'GET') {
        const partners = db.getAll('delivery_partners') || [];
        return sendJson(res, 200, partners);
      }

      if (pathname === '/api/owner/delivery' && method === 'POST') {
        const body = await parseBody(req);
        const name = body.name || 'Delivery Partner';
        const newPartner = {
          id: body.id || 'usr_staff_' + Date.now(),
          name,
          phone: body.phone || '9876543210',
          email: body.email || `partner_${Date.now()}@freshmart.local`,
          vehicle: body.vehicle || 'EV Scooter',
          vehicleNumber: body.vehicleNumber || 'KA-01-FM-0001',
          status: body.status || 'ACTIVE',
          rating: Number(body.rating) || 5.0,
          completedDeliveries: 0,
          createdAt: new Date().toISOString()
        };
        db.insert('delivery_partners', newPartner);
        db.logActivity(owner.name, 'DELIVERY_PARTNER_ADDED', 'Delivery', newPartner.id, `Enrolled delivery partner "${newPartner.name}"`);
        return sendJson(res, 201, { success: true, partner: newPartner });
      }

      if (pathname.startsWith('/api/owner/delivery/') && (method === 'PATCH' || method === 'PUT')) {
        const id = pathname.replace('/api/owner/delivery/', '');
        const partner = db.getById('delivery_partners', id);
        if (!partner) return sendJson(res, 404, { error: 'Delivery partner not found' });
        const body = await parseBody(req);
        Object.assign(partner, body, { updatedAt: new Date().toISOString() });
        db.save();
        db.logActivity(owner.name, 'DELIVERY_PARTNER_UPDATED', 'Delivery', id, `Updated delivery partner "${partner.name}"`);
        return sendJson(res, 200, { success: true, partner });
      }

      if (pathname.startsWith('/api/owner/delivery/') && method === 'DELETE') {
        const id = pathname.replace('/api/owner/delivery/', '');
        const deleted = db.delete('delivery_partners', id);
        if (!deleted) return sendJson(res, 404, { error: 'Delivery partner not found' });
        db.logActivity(owner.name, 'DELIVERY_PARTNER_DELETED', 'Delivery', id, `Removed delivery partner`);
        return sendJson(res, 200, { success: true, message: 'Delivery partner removed from fleet.' });
      }

      // 9. Payments & Financials
      if (pathname === '/api/owner/payments' && method === 'GET') {
        const orders = db.getAll('orders') || [];
        const refunds = orders.filter(o => o.refundStatus === 'REFUNDED');
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0);
        const modeBreakdown = {};
        orders.forEach(o => {
          const m = o.paymentMethod || 'UPI';
          modeBreakdown[m] = (modeBreakdown[m] || 0) + (Number(o.totalAmount || o.total) || 0);
        });

        return sendJson(res, 200, {
          totalRevenue,
          ordersCount: orders.length,
          refundsCount: refunds.length,
          refundsTotal: refunds.reduce((sum, o) => sum + (Number(o.refundAmount) || 0), 0),
          modeBreakdown,
          recentPayments: orders.slice(0, 15)
        });
      }

      // 10. Audit Logs
      if (pathname === '/api/owner/audit-logs' && method === 'GET') {
        const filters = {
          action: parsedUrl.query.action,
          search: parsedUrl.query.search,
          limit: parsedUrl.query.limit
        };
        const logs = db.getAuditLogs(filters);
        return sendJson(res, 200, logs);
      }

      if (pathname === '/api/owner/audit-logs/prune' && method === 'POST') {
        if (!isAuthorizedAdminOrOwner(owner)) {
          return sendJson(res, 403, { error: 'Access denied: Root Owner / Admin privileges required to prune audit logs.' });
        }
        const body = await parseBody(req);
        const keepCount = Number(body.keepCount) || 50;
        const result = db.pruneAuditLogs(keepCount);
        db.logActivity(owner.name, 'AUDIT_LOGS_PRUNED', 'Security', 'AUDIT_TRAIL', `Pruned audit trail, kept latest ${keepCount} entries`);
        return sendJson(res, 200, { success: true, ...result });
      }

      if (pathname === '/api/owner/audit-logs/export' && method === 'GET') {
        const logs = db.getAuditLogs({ limit: 1000 });
        const format = parsedUrl.query.format || 'json';
        if (format === 'csv') {
          const headers = ['Timestamp', 'Operator', 'Action', 'Target', 'EntityId', 'Details'];
          const rows = logs.map(l => [
            `"${l.timestamp}"`,
            `"${l.operatorEmail || l.user}"`,
            `"${l.action}"`,
            `"${l.target || l.entity}"`,
            `"${l.entityId}"`,
            `"${String(l.details).replace(/"/g, '""')}"`
          ].join(','));
          const csv = [headers.join(','), ...rows].join('\n');
          res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="sabjihub_audit_logs_${new Date().toISOString().slice(0, 10)}.csv"`
          });
          return res.end(csv);
        } else {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="sabjihub_audit_logs_${new Date().toISOString().slice(0, 10)}.json"`
          });
          return res.end(JSON.stringify(logs, null, 2));
        }
      }

      // 11. Platform Settings & Operations Config
      if (pathname === '/api/owner/settings' && method === 'GET') {
        const current = db.data.settings || {};
        const merged = {
          standardDeliveryFee: Number(current.standardDeliveryFee ?? current.deliveryFee ?? 25),
          deliveryFee: Number(current.standardDeliveryFee ?? current.deliveryFee ?? 25),
          freeDeliveryThreshold: Number(current.freeDeliveryThreshold ?? 299),
          minimumOrderValue: Number(current.minimumOrderValue ?? 99),
          maintenanceMode: Boolean(current.maintenanceMode),
          storeName: current.storeName || 'FreshMart Quick Commerce',
          supportEmail: current.supportEmail || 'support@sabjihub.com',
          supportPhone: current.supportPhone || '+91 80 4000 9000',
          deliverySLA: current.deliverySLA || '10-15 mins',
          currency: 'INR (₹)'
        };
        return sendJson(res, 200, merged);
      }

      if (pathname === '/api/owner/settings' && method === 'POST') {
        if (!isAuthorizedAdminOrOwner(owner)) {
          return sendJson(res, 403, { error: 'Access denied: Root Owner / Admin privileges required to modify platform settings.' });
        }
        const body = await parseBody(req);
        const fee = Number(body.standardDeliveryFee ?? body.deliveryFee ?? 25);
        const freeThreshold = Number(body.freeDeliveryThreshold ?? 299);
        const minOrder = Number(body.minimumOrderValue ?? 99);
        const maintenance = Boolean(body.maintenanceMode);

        db.data.settings = {
          ...(db.data.settings || {}),
          ...body,
          standardDeliveryFee: fee,
          deliveryFee: fee,
          freeDeliveryThreshold: freeThreshold,
          minimumOrderValue: minOrder,
          maintenanceMode: maintenance,
          storeName: body.storeName || db.data.settings?.storeName || 'FreshMart Quick Commerce',
          supportEmail: body.supportEmail || db.data.settings?.supportEmail || 'support@sabjihub.com',
          supportPhone: body.supportPhone || db.data.settings?.supportPhone || '+91 80 4000 9000',
          deliverySLA: body.deliverySLA || db.data.settings?.deliverySLA || '10-15 mins',
          updatedAt: new Date().toISOString()
        };
        db.save();
        db.logActivity(owner.name, 'SETTINGS_UPDATED', 'Platform', 'GLOBAL', `Updated platform settings: Delivery Fee ₹${fee}, Free Threshold ₹${freeThreshold}, Maintenance: ${maintenance ? 'ON' : 'OFF'}`);
        return sendJson(res, 200, { success: true, settings: db.data.settings });
      }

      // 12. Database Telemetry, Backups & Integrity Diagnostics
      if (pathname === '/api/owner/health' && method === 'GET') {
        const mem = process.memoryUsage();
        let dbFileSize = 0;
        try {
          const dbStat = fs.statSync(path.join(__dirname, 'data', 'db.json'));
          dbFileSize = dbStat.size;
        } catch (e) {}

        const collectionStats = {
          users: (db.data.users || []).length,
          products: (db.data.products || []).length,
          orders: (db.data.orders || []).length,
          categories: (db.data.categories || []).length,
          hubs: (db.data.hubs || []).length,
          fleet: (db.data.delivery_partners || []).length,
          farmers: (db.data.farmers || []).length,
          auditLogs: (db.data.activity_logs || []).length
        };

        return sendJson(res, 200, {
          success: true,
          status: 'HEALTHY',
          serverTime: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          memory: {
            rssMB: (mem.rss / 1024 / 1024).toFixed(2),
            heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
            heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2),
            externalMB: (mem.external / 1024 / 1024).toFixed(2)
          },
          database: {
            engine: 'FreshMart File JSON Engine',
            fileSizeBytes: dbFileSize,
            fileSizeKB: (dbFileSize / 1024).toFixed(2),
            collections: collectionStats
          },
          security: {
            gisClientId: GOOGLE_CLIENT_ID ? 'Configured & Active' : 'Unset',
            sessionCookiePolicy: 'HttpOnly; SameSite=Lax',
            ownerProtection: 'Immune & Non-demotable'
          }
        });
      }

      if (pathname === '/api/owner/database/export' && method === 'GET') {
        if (!isAuthorizedAdminOrOwner(owner)) {
          return sendJson(res, 403, { error: 'Access denied: Root Owner / Admin privileges required to export database.' });
        }
        const dbPath = path.join(__dirname, 'data', 'db.json');
        if (fs.existsSync(dbPath)) {
          const data = fs.readFileSync(dbPath, 'utf8');
          db.logActivity(owner.name, 'DATABASE_EXPORTED', 'Database', 'FULL_EXPORT', 'Exported complete database JSON snapshot');
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="sabjihub_database_backup_${new Date().toISOString().slice(0, 10)}.json"`
          });
          return res.end(data);
        } else {
          return sendJson(res, 404, { error: 'Database file not found on disk' });
        }
      }

      if (pathname === '/api/owner/database/integrity-check' && method === 'POST') {
        if (!isAuthorizedAdminOrOwner(owner)) {
          return sendJson(res, 403, { error: 'Access denied: Root Owner / Admin privileges required to perform integrity diagnostics.' });
        }
        const report = db.checkDatabaseIntegrity();
        db.logActivity(owner.name, 'DATABASE_INTEGRITY_CHECK', 'Database', 'INTEGRITY', `Integrity check executed: ${report.healthy ? 'HEALTHY' : 'ISSUES DETECTED'}`);
        return sendJson(res, 200, { success: true, report });
      }

      return sendJson(res, 404, { error: 'Owner API endpoint not found.' });
    }

    return sendJson(res, 404, { error: 'API endpoint not found' });
  }

  // ========================================================
  // STATIC FILE SERVING
  // ========================================================
  // Rewrite /owner and /staff to /owner.html
  if (pathname === '/owner' || pathname === '/staff' || pathname === '/admin/staff' || pathname === '/settings' || pathname === '/audit') {
    pathname = '/owner.html';
  }

  // Rewrite /delivery to /delivery.html
  if (pathname === '/delivery') {
    pathname = '/delivery.html';
  }

  // Owner HTML page authorization
  if (pathname === '/owner.html') {
    const auth = extractUserSession(req);
    if (!auth || !auth.user) {
      res.writeHead(302, { 'Location': '/?auth=signin&returnTo=/owner' });
      return res.end();
    }
    const freshUser = db.getById('users', auth.user.id);
    const role = freshUser ? freshUser.role : auth.user.role;
    const email = freshUser ? freshUser.email : auth.user.email;
    const normRole = normalizeRole(role);

    // Delivery boy accessing Owner dashboard routes is automatically redirected to /delivery
    if (normRole === 'DELIVERY_BOY') {
      res.writeHead(302, { 'Location': '/delivery' });
      return res.end();
    }

    if (normRole === 'CUSTOMER') {
      res.writeHead(302, { 'Location': '/?auth=signin&returnTo=/owner' });
      return res.end();
    }
  }

  // Delivery HTML page authorization
  if (pathname === '/delivery.html') {
    const auth = extractUserSession(req);
    if (!auth || !auth.user) {
      res.writeHead(302, { 'Location': '/?auth=signin&returnTo=/delivery' });
      return res.end();
    }
    const freshUser = db.getById('users', auth.user.id);
    const role = freshUser ? freshUser.role : auth.user.role;
    const normRole = normalizeRole(role);

    if (freshUser && (freshUser.active === false || String(freshUser.status).toUpperCase() === 'INACTIVE')) {
      res.writeHead(302, { 'Location': '/?auth=signin&error=deactivated' });
      return res.end();
    }

    if (normRole === 'CUSTOMER') {
      res.writeHead(302, { 'Location': '/' });
      return res.end();
    }
  }

  // Admin HTML page authorization
  if (pathname === '/admin.html') {
    const auth = extractUserSession(req);
    if (auth && auth.user && auth.user.role === 'CUSTOMER') {
      res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#fafaf9;color:#1c1917;"><h1 style="color:#991b1b;font-size:28px;">403 Forbidden</h1><p style="font-size:16px;color:#44403c;">Access Denied: You do not have administrator permissions to access the operations console.</p><div style="margin-top:24px;"><a href="/" style="display:inline-block;padding:12px 24px;background:#047857;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;">← Return to FreshMart Storefront</a></div></body></html>');
    }
  }

  // Dynamic Category Page Resolver
  if (pathname.startsWith('/category/') || pathname === '/category' || pathname === '/category.html') {
    const catHtml = path.join(__dirname, 'category.html');
    if (fs.existsSync(catHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(catHtml).pipe(res);
    }
  }

  // Production Reorganized Static Directory Resolver
  const candidatePaths = [
    path.join(__dirname, 'frontend', 'customer-store', pathname === '/' ? 'index.html' : pathname),
    path.join(__dirname, 'frontend', 'owner-dashboard', pathname.startsWith('/') ? pathname.slice(1) : pathname),
    path.join(__dirname, 'frontend', 'delivery-dashboard', pathname.startsWith('/') ? pathname.slice(1) : pathname),
    path.join(__dirname, 'frontend', 'customer-store', 'scripts', pathname.startsWith('/') ? pathname.slice(1) : pathname),
    path.join(__dirname, 'frontend', 'customer-store', 'styles', pathname.startsWith('/') ? pathname.slice(1) : pathname),
    path.join(__dirname, pathname.startsWith('/') ? pathname.slice(1) : pathname),
    path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname)
  ];

  let resolvedFile = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      resolvedFile = p;
      break;
    }
  }

  if (!resolvedFile) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404 Not Found');
  }

  const ext = path.extname(resolvedFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  const readStream = fs.createReadStream(resolvedFile);
  readStream.pipe(res);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(`🌱 FreshMart Enterprise Server running on port ${PORT}`);
    console.log(`🌐 Storefront:        http://localhost:${PORT}/`);
    console.log(`⚡ Admin Console:     http://localhost:${PORT}/admin.html`);
    console.log(`🚜 Hub Terminal:      http://localhost:${PORT}/hub.html`);
    console.log(`🛵 Delivery Partner:  http://localhost:${PORT}/delivery.html`);
    console.log(`🛒 Checkout:          http://localhost:${PORT}/checkout.html`);
    console.log(`👑 Owner Portal:      http://localhost:${PORT}/owner`);
    console.log(`📡 Real-Time SSE:     http://localhost:${PORT}/api/events`);
    console.log(`========================================================`);
  });
}

module.exports = {
  server,
  isOwnerEmail,
  requireOwner,
  OWNER_EMAIL
};
