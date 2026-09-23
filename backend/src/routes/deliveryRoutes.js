const express = require('express');
const router = express ? express.Router() : {};
const deliveryController = require('../controllers/deliveryController');
if (router.get) { router.get('/check', deliveryController.checkAvailability); }
module.exports = router;
