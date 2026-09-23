const { db } = require('../../database/connection');

class CartRepository {
  getUserCart(userId) {
    if (!userId) return {};
    return db.getUserCart(userId) || {};
  }

  saveUserCart(userId, items) {
    if (!userId) return {};
    return db.saveUserCart(userId, items || {});
  }

  mergeUserCart(userId, guestItems) {
    if (!userId) return guestItems || {};
    return db.mergeUserCart(userId, guestItems || {});
  }
}

module.exports = new CartRepository();
