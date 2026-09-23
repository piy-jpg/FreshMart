const { db } = require('../../database/connection');

class ProductRepository {
  getAll() {
    return db.getAll('products') || [];
  }

  getById(id) {
    return db.getById('products', id);
  }

  getByCategory(categoryId) {
    if (!categoryId) return [];
    return (db.getAll('products') || []).filter(p => p.categoryId === categoryId);
  }

  getCategories() {
    return db.getAll('categories') || [];
  }

  create(product) {
    return db.insert('products', product);
  }

  update(id, updates) {
    return db.update('products', id, updates);
  }

  delete(id) {
    return db.delete('products', id);
  }
}

module.exports = new ProductRepository();
