const { db } = require('../config/database');
class ProductService {
  static getAllProducts() { return db.getAll('products'); }
  static getProductById(id) { return db.getById('products', id); }
}
module.exports = ProductService;
