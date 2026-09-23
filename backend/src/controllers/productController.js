const ProductService = require('../services/productService');
module.exports = {
  list: (req, res) => res.json(ProductService.getAllProducts()),
  getById: (req, res) => {
    const p = ProductService.getProductById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  }
};
