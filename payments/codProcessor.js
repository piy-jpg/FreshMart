const { db } = require('../database/connection');

class CODProcessor {
  recordCollection(orderId, collectorName, amount) {
    return db.update('orders', orderId, {
      paymentStatus: 'PAID',
      codCollectedAt: new Date().toISOString(),
      codCollectedBy: collectorName || 'Delivery Partner',
      collectedAmount: amount
    });
  }
}

module.exports = new CODProcessor();
