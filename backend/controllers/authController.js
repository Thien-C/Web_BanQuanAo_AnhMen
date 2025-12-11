// controllers/authController.js
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbConfig = require('../dbConfig'); // File cấu hình DB cũ

// 1. ĐĂNG KÝ (Register)
exports.register = async (req, res) => {
    const { fullName, email, password, phone } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Kiểm tra email đã tồn tại chưa
        const checkUser = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        // Mã hóa mật khẩu (Hashing)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Lưu vào DB
        await pool.request()
            .input('FullName', sql.NVarChar, fullName)
            .input('Email', sql.VarChar, email)
            .input('PasswordHash', sql.VarChar, passwordHash)
            .input('PhoneNumber', sql.VarChar, phone)
            .query(`
                INSERT INTO Users (FullName, Email, PasswordHash, PhoneNumber, Role, IsActive)
                VALUES (@FullName, @Email, @PasswordHash, @PhoneNumber, 'Customer', 1)
            `);

        res.status(201).json({ message: 'Đăng ký tài khoản thành công!' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. ĐĂNG NHẬP (Login)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Tìm user theo email
        const result = await pool.request()
            .input('Email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        const user = result.recordset[0];

        // Nếu không tìm thấy user
        if (!user) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // Kiểm tra mật khẩu (So sánh pass nhập vào vs pass đã hash trong DB)
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // Tạo JWT Token
        const token = jwt.sign(
            { id: user.UserID, role: user.Role, email: user.Email }, // Payload (Dữ liệu gói trong token)
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token hết hạn sau 1 ngày
        );

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user.UserID,
                fullName: user.FullName,
                email: user.Email,
                role: user.Role
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Lấy thông tin User hiện tại (Me) - Test Middleware
exports.getMe = async (req, res) => {
    // req.user đã có dữ liệu từ middleware verifyToken
    res.json({ message: 'Bạn đang đăng nhập với thông tin:', user: req.user });
};