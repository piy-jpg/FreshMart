const { db } = require('../config/database');
const { generateOtp } = require('../utils/generateToken');

class OrderService {
  static createOrder(payload, user = null) {
    const orderId = 'SJH' + Math.floor(10000 + Math.random() * 90000);
    const otp = generateOtp();
    const order = {
      id: orderId,
      orderId,
      customerId: payload.customerId || user?.id || 'usr_guest',
      customerName: payload.customerName || user?.name || 'Customer',
      customerPhone: payload.customerPhone || user?.phone || '',
      items: payload.items || [],
      deliveryOtp: otp,
      status: 'CONFIRMED',
      orderStatus: 'CONFIRMED',
      totalAmount: payload.totalAmount || 0,
      createdAt: new Date().toISOString()
    };
    db.insert('orders', order);
    return order;
  }
}
module.exports = OrderService;
