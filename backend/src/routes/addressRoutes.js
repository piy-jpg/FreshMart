const express = require('express');
const router = express ? express.Router() : {};
const addressController = require('../controllers/addressController');
if (router.get) { router.get('/', addressController.list); }
module.exports = router;
