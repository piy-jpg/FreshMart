const { productService } = require('../services');
const { sendJson } = require('../../shared/utilities');

class ProductController {
  async getAll(req, res) {
    const products = productService.getAllProducts();
    return sendJson(res, 200, products);
  }

  async getById(req, res, id) {
    const product = productService.getProductById(id);
    if (!product) return sendJson(res, 404, { error: 'Product not found' });
    return sendJson(res, 200, product);
  }

  async getCategories(req, res) {
    const categories = productService.getCategories();
    return sendJson(res, 200, categories);
  }
}

module.exports = new ProductController();
