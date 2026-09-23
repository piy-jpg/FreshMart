const { db } = require('../database/connection');

class WalletManager {
  getBalance(userId) {
    const user = db.getById('users', userId);
    return user ? (user.walletBalance || 0) : 0;
  }

  credit(userId, amount, reason = 'Reward Credit') {
    const user = db.getById('users', userId);
    if (!user) throw new Error('User not found');
    const newBal = (user.walletBalance || 0) + Number(amount);
    db.update('users', userId, { walletBalance: newBal });
    return newBal;
  }

  debit(userId, amount, reason = 'Order Payment') {
    const user = db.getById('users', userId);
    if (!user) throw new Error('User not found');
    const current = user.walletBalance || 0;
    if (current < Number(amount)) throw new Error('Insufficient wallet balance');
    const newBal = current - Number(amount);
    db.update('users', userId, { walletBalance: newBal });
    return newBal;
  }
}

module.exports = new WalletManager();
