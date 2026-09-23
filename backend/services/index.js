const authService = require('./authService');
const cartService = require('./cartService');
const orderService = require('./orderService');
const deliveryService = require('./deliveryService');
const productService = require('./productService');
const ownerService = require('./ownerService');
const locationService = require('./locationService');
const paymentService = require('./paymentService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

module.exports = {
  authService,
  cartService,
  orderService,
  deliveryService,
  productService,
  ownerService,
  locationService,
  paymentService,
  notificationService,
  emailService
};
