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

  createProduct(productData) {
    return productRepository.create(productData);
  }

  updateProduct(id, updates) {
    return productRepository.update(id, updates);
  }

  deleteProduct(id) {
    return productRepository.delete(id);
  }
}

module.exports = new ProductService();
