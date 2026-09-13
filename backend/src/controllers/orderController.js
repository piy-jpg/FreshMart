const OrderService = require('../services/orderService');
module.exports = {
  create: (req, res) => res.status(201).json(OrderService.createOrder(req.body, req.user))
};
