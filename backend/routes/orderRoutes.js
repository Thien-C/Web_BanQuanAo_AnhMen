// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middleware/authMiddleware');
const verifyAdmin = require('../middleware/adminMiddleware'); // Import middleware Admin

// --- USER ROUTES ---
router.post('/', orderController.createOrder); // Public (Khách mua hàng)
router.get('/history', verifyToken, orderController.getOrderHistory); // User xem lịch sử

// --- ADMIN ROUTES (Có bảo vệ) ---
// GET: Lấy danh sách
router.get('/admin/orders', verifyAdmin, orderController.getAllOrdersAdmin);

// PUT: Cập nhật trạng thái
router.put('/admin/orders/:id', verifyAdmin, orderController.updateOrderStatus);

module.exports = router;