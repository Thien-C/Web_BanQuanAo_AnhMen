// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sql = require('mssql');
const path = require('path'); 
const dbConfig = require('./dbConfig');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const verifyAdmin = require('./middleware/adminMiddleware');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Kết nối DB và chạy Server
const startServer = async () => {
    try {
        await sql.connect(dbConfig);
        console.log('✅ Đã kết nối thành công tới SQL Server!');
        app.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
            console.log(`👉 Trang chủ: http://localhost:${PORT}`);
            console.log(`👉 Trang Admin: http://localhost:${PORT}/admin`);
        });
    } catch (err) {
        console.error('❌ Lỗi kết nối Database:', err.message);
    }
};

startServer();