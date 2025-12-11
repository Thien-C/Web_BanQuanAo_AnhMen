// dbConfig.js
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Bắt buộc nếu dùng Azure, local có thể tắt nhưng nên để true
        trustServerCertificate: true // Bỏ qua lỗi SSL certificate khi chạy local (Rất quan trọng)
    }
};

module.exports = config;