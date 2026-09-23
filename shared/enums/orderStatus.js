/**
 * 12-Step Serial Order Workflow Status Definitions
 */
const SERIAL_ORDER_STEPS = [
  { step: 1,  key: 'ORDER_RECEIVED',        label: 'Order Received',         aliases: ['ORDER_PLACED'] },
  { step: 2,  key: 'ORDER_CONFIRMED',       label: 'Order Confirmed',        aliases: ['CONFIRMED'] },
  { step: 3,  key: 'PICKING',               label: 'Picking Fresh Produce',  aliases: [] },
  { step: 4,  key: 'PACKING',               label: 'Packing & Sanitizing',   aliases: ['QUALITY_CHECK'] },
  { step: 5,  key: 'READY_FOR_HANDOVER',    label: 'Ready for Handover',     aliases: ['READY_FOR_PICKUP', 'PACKED'] },
  { step: 6,  key: 'HANDED_TO_DELIVERY_BOY',label: 'Handed to Delivery Boy', aliases: ['ASSIGNED', 'ACCEPTED_BY_HUB'] },
  { step: 7,  key: 'DELIVERY_BOY_ACCEPTED', label: 'Delivery Boy Accepted',  aliases: ['ACCEPTED'] },
  { step: 8,  key: 'PICKED_UP',             label: 'Picked Up from Hub',     aliases: [] },
  { step: 9,  key: 'OUT_FOR_DELIVERY',      label: 'Out for Delivery',       aliases: ['OUT FOR DELIVERY'] },
  { step: 10, key: 'ARRIVED',               label: 'Arrived at Destination', aliases: [] },
  { step: 11, key: 'CUSTOMER_VERIFIED',     label: 'Customer Verified (OTP)',aliases: ['OTP_VERIFIED'] },
  { step: 12, key: 'DELIVERY_COMPLETED',    label: 'Delivered',              aliases: ['DELIVERED'] }
];

const ORDER_STATUS = {
  ORDER_RECEIVED: 'ORDER_RECEIVED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  PICKING: 'PICKING',
  PACKING: 'PACKING',
  READY_FOR_HANDOVER: 'READY_FOR_HANDOVER',
  HANDED_TO_DELIVERY_BOY: 'HANDED_TO_DELIVERY_BOY',
  DELIVERY_BOY_ACCEPTED: 'DELIVERY_BOY_ACCEPTED',
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  ARRIVED: 'ARRIVED',
  CUSTOMER_VERIFIED: 'CUSTOMER_VERIFIED',
  DELIVERED: 'DELIVERED',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  CANCELLED: 'CANCELLED'
};

function getCanonicalStep(statusStr) {
  if (!statusStr) return null;
  const clean = String(statusStr).trim().toUpperCase().replace(/[\s-]/g, '_');
  for (const s of SERIAL_ORDER_STEPS) {
    if (s.key === clean || s.aliases.includes(clean)) {
      return s;
    }
  }
  if (clean === 'DELIVERED' || clean === 'DELIVERY_COMPLETED') return SERIAL_ORDER_STEPS[11];
  return null;
}

function getStepNumber(statusStr) {
  const step = getCanonicalStep(statusStr);
  return step ? step.step : 0;
}

module.exports = {
  SERIAL_ORDER_STEPS,
  ORDER_STATUS,
  getCanonicalStep,
  getStepNumber
};
