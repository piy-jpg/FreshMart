const authValidator = require('./authValidator');
const orderValidator = require('./orderValidator');
const cartValidator = require('./cartValidator');
const productValidator = require('./productValidator');
const deliveryValidator = require('./deliveryValidator');

module.exports = {
  ...authValidator,
  ...orderValidator,
  ...cartValidator,
  ...productValidator,
  ...deliveryValidator
};
