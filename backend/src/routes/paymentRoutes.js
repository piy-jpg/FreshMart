const express = require('express');
const router = express ? express.Router() : {};
const paymentController = require('../controllers/paymentController');
if (router.post) { router.post('/charge', paymentController.charge); }
module.exports = router;
