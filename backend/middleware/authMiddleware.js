// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Lấy token từ header (Authorization: Bearer <token>)
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy Token. Truy cập bị từ chối!' });
    }

    try {
        // 2. Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Gán thông tin user vào request để các hàm sau dùng
        req.user = decoded;
        next(); // Cho phép đi tiếp
    } catch (err) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

module.exports = verifyToken;