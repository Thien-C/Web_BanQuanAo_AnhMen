// backend/middleware/adminMiddleware.js
const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
    // 1. Lấy token từ header (Chuẩn Authorization: Bearer <token>)
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Truy cập bị từ chối. Vui lòng đăng nhập!' });
    }

    try {
        // 2. Giải mã token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Kiểm tra Role
        if (verified.role !== 'Admin') {
            return res.status(403).json({ message: 'Bạn không có quyền Admin!' });
        }

        // 4. Nếu hợp lệ, gán user vào request và cho đi tiếp
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Token không hợp lệ.' });
    }
};

module.exports = verifyAdmin;