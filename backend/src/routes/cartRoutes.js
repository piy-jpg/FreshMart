const express = require('express');
const router = express ? express.Router() : {};
const cartController = require('../controllers/cartController');
if (router.get) { router.get('/', cartController.getCart); }
module.exports = router;
