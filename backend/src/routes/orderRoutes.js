const express = require('express');
const router = express ? express.Router() : {};
const orderController = require('../controllers/orderController');
if (router.post) { router.post('/', orderController.create); }
module.exports = router;
