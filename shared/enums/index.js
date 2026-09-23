const { SERIAL_ORDER_STEPS, ORDER_STATUS, getCanonicalStep, getStepNumber } = require('./orderStatus');
const { USER_ROLES, normalizeRole } = require('./userRoles');
const { PAYMENT_METHODS, PAYMENT_STATUS } = require('./paymentMethods');
const { DELIVERY_STATUS } = require('./deliveryStatus');

module.exports = {
  SERIAL_ORDER_STEPS,
  ORDER_STATUS,
  getCanonicalStep,
  getStepNumber,
  USER_ROLES,
  normalizeRole,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  DELIVERY_STATUS
};
