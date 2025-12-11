// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Lấy danh sách danh mục
router.get('/', productController.getAllCategories);

module.exports = router;