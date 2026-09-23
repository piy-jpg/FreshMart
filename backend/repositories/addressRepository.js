const { db } = require('../../database/connection');

class AddressRepository {
  getByUserId(userId) {
    if (!userId) return [];
    return (db.getAll('addresses') || []).filter(a => a.userId === userId);
  }

  getById(id) {
    return db.getById('addresses', id);
  }

  create(address) {
    return db.insert('addresses', address);
  }

  update(id, updates) {
    return db.update('addresses', id, updates);
  }

  delete(id) {
    return db.delete('addresses', id);
  }
}

module.exports = new AddressRepository();
