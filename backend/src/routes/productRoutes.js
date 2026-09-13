const express = require('express');
const router = express ? express.Router() : {};
const productController = require('../controllers/productController');
if (router.get) {
  router.get('/', productController.list);
  router.get('/:id', productController.getById);
}
module.exports = router;
