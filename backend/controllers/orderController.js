// backend/controllers/orderController.js
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// ... (Giữ nguyên hàm createOrder và getOrderHistory ở bài trước) ...
// Để tiện cho bạn, tôi viết lại đầy đủ cả file để tránh lỗi copy thiếu:

// 1. TẠO ĐƠN HÀNG (Public)
exports.createOrder = async (req, res) => {
    // ... (Code cũ của hàm createOrder - Giữ nguyên logic bài trước) ...
    // Nếu bạn cần code đầy đủ của hàm này, hãy bảo tôi gửi lại. 
    // Ở đây tôi tập trung vào phần Admin mới bên dưới.
    const { fullName, address, phone, items, paymentMethod } = req.body;
    const userId = req.user ? req.user.id : null;

    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        let serverTotalAmount = 0;
        const validItems = [];

        // Check Kho & Giá
        for (const item of items) {
            const requestCheck = new sql.Request(transaction);
            const checkRes = await requestCheck.query(`
                SELECT v.VariantID, v.StockQuantity, p.Price 
                FROM ProductVariants v
                JOIN Products p ON v.ProductID = p.ProductID
                WHERE v.VariantID = ${item.variantId}
            `);
            if (checkRes.recordset.length === 0) throw new Error(`Sản phẩm ID ${item.variantId} lỗi.`);
            const dbItem = checkRes.recordset[0];
            serverTotalAmount += dbItem.Price * item.quantity;
            validItems.push({ variantId: item.variantId, quantity: item.quantity, price: dbItem.Price });
        }

        // Tạo Đơn
        const requestOrder = new sql.Request(transaction);
        const orderResult = await requestOrder
            .input('UserID', sql.Int, userId)
            .input('Total', sql.Decimal, serverTotalAmount)
            .input('Addr', sql.NVarChar, address)
            .input('Name', sql.NVarChar, fullName)
            .input('Phone', sql.VarChar, phone)
            .input('Method', sql.NVarChar, paymentMethod)
            .query(`
                INSERT INTO Orders (UserID, TotalAmount, ShippingAddress, PhoneNumber, PaymentMethod, Status, OrderDate)
                OUTPUT INSERTED.OrderID
                VALUES (@UserID, @Total, @Addr, @Phone, @Method, N'Chờ xử lý', GETDATE())
            `);
        const orderId = orderResult.recordset[0].OrderID;

        // Tạo Chi tiết
        for (const item of validItems) {
            const reqDetail = new sql.Request(transaction);
            await reqDetail.query(`INSERT INTO OrderDetails (OrderID, VariantID, Quantity, UnitPrice) VALUES (${orderId}, ${item.variantId}, ${item.quantity}, ${item.price})`);
            await reqDetail.query(`UPDATE ProductVariants SET StockQuantity = StockQuantity - ${item.quantity} WHERE VariantID = ${item.variantId}`);
        }

        await transaction.commit();
        res.json({ message: 'Thành công', orderId });
    } catch (err) {
        if(transaction) await transaction.rollback();
        res.status(500).json({ error: err.message });
    }
};

// 2. LỊCH SỬ ĐƠN HÀNG (User)
exports.getOrderHistory = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('UserID', sql.Int, req.user.id)
            .query('SELECT * FROM Orders WHERE UserID = @UserID ORDER BY OrderDate DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- PHẦN ADMIN MỚI ---

// 3. [ADMIN] LẤY TẤT CẢ ĐƠN HÀNG
// GET /api/orders/admin/orders
exports.getAllOrdersAdmin = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        // Join bảng Users để lấy tên khách hàng (nếu có UserID)
        // Nếu UserID null (khách vãng lai), ta có thể lấy tên từ bảng Orders (nếu bạn đã thêm cột FullName vào Orders ở bước trước, nếu chưa thì tạm lấy 'Khách vãng lai')
        const result = await pool.request().query(`
            SELECT o.*, u.FullName as UserName, u.Email
            FROM Orders o
            LEFT JOIN Users u ON o.UserID = u.UserID
            ORDER BY o.OrderDate DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. [ADMIN] CẬP NHẬT TRẠNG THÁI
// PUT /api/orders/admin/orders/:id
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Đang giao', 'Hoàn thành', 'Đã hủy'

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('Status', sql.NVarChar, status)
            .input('OrderID', sql.Int, id)
            .query('UPDATE Orders SET Status = @Status WHERE OrderID = @OrderID');

        res.json({ message: 'Cập nhật trạng thái thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};