const express = require('express');
const router = express ? express.Router() : {};
const userController = require('../controllers/userController');
if (router.get) { router.get('/me', userController.getProfile); }
module.exports = router;
