const express = require('express');
const router = express ? express.Router() : {};
const authController = require('../controllers/authController');
if (router.post) { router.post('/login', authController.login); }
module.exports = router;
