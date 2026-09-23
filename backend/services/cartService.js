const { cartRepository } = require('../repositories');

class CartService {
  getCart(userId) {
    return cartRepository.getUserCart(userId);
  }

  saveCart(userId, items) {
    return cartRepository.saveUserCart(userId, items);
  }

  mergeCart(userId, guestItems) {
    return cartRepository.mergeUserCart(userId, guestItems);
  }
}

module.exports = new CartService();
