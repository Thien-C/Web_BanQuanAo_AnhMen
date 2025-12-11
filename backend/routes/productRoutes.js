// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyToken = require('../middleware/authMiddleware');

// 1. Lấy danh sách sản phẩm (có filter)
router.get('/', productController.getProducts);

// 2. Lấy chi tiết sản phẩm theo ID
// Lưu ý: :id là tham số động
router.get('/:id', productController.getProductDetail);

// --- ADMIN ROUTES (Cần đăng nhập) ---
router.post('/', verifyToken, productController.createProduct);
router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;