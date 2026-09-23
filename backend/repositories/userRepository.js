const { db } = require('../../database/connection');

class UserRepository {
  getAll() {
    return db.getAll('users');
  }

  getById(id) {
    return db.getById('users', id);
  }

  findByEmail(email) {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    return db.getAll('users').find(u => (u.email || '').toLowerCase() === clean);
  }

  findByIdentifier(identifier) {
    if (!identifier) return null;
    if (typeof db.findUserByLoginIdentifier === 'function') {
      return db.findUserByLoginIdentifier(identifier);
    }
    const clean = identifier.toLowerCase().trim();
    return db.getAll('users').find(u =>
      (u.email || '').toLowerCase() === clean ||
      (u.employeeId || '').toLowerCase() === clean ||
      (u.phone || '').includes(clean)
    );
  }

  findByVerificationToken(token) {
    if (!token) return null;
    return db.getAll('users').find(u => u.verificationToken === token);
  }

  findByResetToken(token) {
    if (!token) return null;
    return db.getAll('users').find(u => u.resetToken === token);
  }

  create(user) {
    return db.insert('users', user);
  }

  update(id, updates) {
    return db.update('users', id, updates);
  }

  delete(id) {
    return db.delete('users', id);
  }
}

module.exports = new UserRepository();
