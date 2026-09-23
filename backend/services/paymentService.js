const { db } = require('../../database/connection');

class PaymentService {
  collectCODCash(orderId, amount, collectedBy) {
    const order = db.getById('orders', orderId);
    if (!order) throw new Error('Order not found');

    const updated = db.update('orders', orderId, {
      paymentStatus: 'PAID',
      codCollectedAt: new Date().toISOString(),
      codCollectedBy: collectedBy ? collectedBy.name : 'Delivery Boy'
    });

    return updated;
  }

  debitWallet(userId, amount) {
    const user = db.getById('users', userId);
    if (!user) throw new Error('User not found');
    const balance = user.walletBalance || 0;
    if (balance < amount) throw new Error('Insufficient wallet balance');

    db.update('users', userId, {
      walletBalance: balance - amount
    });
    return balance - amount;
  }
}

module.exports = new PaymentService();
