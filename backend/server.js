// server.js (Cập nhật)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sql = require('mssql');
const dbConfig = require('./dbConfig');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// --- SỬ DỤNG ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);      // URL: /api/products
app.use('/api/categories', categoryRoutes);   // URL: /api/categories
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Kết nối DB và chạy Server
const startServer = async () => {
    try {
        await sql.connect(dbConfig);
        console.log('✅ Đã kết nối thành công tới SQL Server!');
        app.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Lỗi kết nối Database:', err.message);
    }
};

startServer();