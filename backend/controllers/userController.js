// controllers/userController.js
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// 1. Lấy thông tin cá nhân
// GET /api/users/profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy từ Token (do middleware giải mã)
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query('SELECT UserID, FullName, Email, PhoneNumber, Address, Role FROM Users WHERE UserID = @UserID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Cập nhật thông tin
// PUT /api/users/profile
exports.updateProfile = async (req, res) => {
    const { fullName, phone, address } = req.body;
    const userId = req.user.id;

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('FullName', sql.NVarChar, fullName)
            .input('PhoneNumber', sql.VarChar, phone)
            .input('Address', sql.NVarChar, address)
            .input('UserID', sql.Int, userId)
            .query(`
                UPDATE Users 
                SET FullName = @FullName, PhoneNumber = @PhoneNumber, Address = @Address 
                WHERE UserID = @UserID
            `);

        res.json({ message: 'Cập nhật thông tin thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Lấy lịch sử đơn hàng
// GET /api/users/orders
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT * FROM Orders 
                WHERE UserID = @UserID 
                ORDER BY OrderDate DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};