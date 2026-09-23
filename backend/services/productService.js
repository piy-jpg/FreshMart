const { productRepository } = require('../repositories');

class ProductService {
  getAllProducts() {
    return productRepository.getAll();
  }

  getProductById(id) {
    return productRepository.getById(id);
  }

  getCategories() {
    return productRepository.getCategories();
  }
}

module.exports = new ProductService();
