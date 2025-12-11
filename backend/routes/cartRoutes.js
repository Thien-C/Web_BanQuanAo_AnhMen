const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const verifyToken = require('../middleware/authMiddleware');

// Các API này đều cần đăng nhập (verifyToken)
router.use(verifyToken);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);

module.exports = router;