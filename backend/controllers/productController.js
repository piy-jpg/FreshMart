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

  async create(req, res, body) {
    const created = productService.createProduct(body);
    return sendJson(res, 201, { success: true, product: created, ...created });
  }

  async update(req, res, id, updates) {
    const updated = productService.updateProduct(id, updates);
    if (!updated) return sendJson(res, 404, { error: 'Product not found' });
    return sendJson(res, 200, { success: true, product: updated, ...updated });
  }

  async delete(req, res, id) {
    const deleted = productService.deleteProduct(id);
    if (!deleted) return sendJson(res, 404, { error: 'Product not found' });
    return sendJson(res, 200, { success: true, message: 'Product deleted' });
  }
}

module.exports = new ProductController();
