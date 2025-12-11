const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken); // Bảo vệ toàn bộ route đơn hàng

router.post('/', orderController.createOrder);
router.get('/history', orderController.getOrderHistory);

// --- ADMIN ROUTES ---
router.get('/admin/all', orderController.getAllOrdersAdmin);
router.put('/admin/:id/status', orderController.updateOrderStatus);

module.exports = router;