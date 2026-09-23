const express = require('express');
const router = express ? express.Router() : {};
const categoryController = require('../controllers/categoryController');
if (router.get) { router.get('/', categoryController.list); }
module.exports = router;
