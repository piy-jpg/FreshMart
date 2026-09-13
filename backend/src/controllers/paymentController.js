const PaymentService = require('../services/paymentService');
module.exports = {
  charge: (req, res) => res.json(PaymentService.processPayment(req.body.orderId, req.body.amount, req.body.method))
};
