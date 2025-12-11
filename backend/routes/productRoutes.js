// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyAdmin = require('../middleware/adminMiddleware'); // Import middleware mới

// Public Routes (Ai cũng xem được)
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductDetail);

// Admin Routes (Cần quyền Admin)
router.post('/', verifyAdmin, productController.createProduct);
router.put('/:id', verifyAdmin, productController.updateProduct);
router.delete('/:id', verifyAdmin, productController.deleteProduct);

module.exports = router;