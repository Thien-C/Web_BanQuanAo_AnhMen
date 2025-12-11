// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

// Public Routes (Ai cũng truy cập được)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Routes (Phải có Token mới vào được)
router.get('/me', verifyToken, authController.getMe);

module.exports = router;