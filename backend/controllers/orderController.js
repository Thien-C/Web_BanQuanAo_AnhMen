// controllers/orderController.js
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// 1. Tạo Đơn hàng (Checkout)
// POST /api/orders
// Body: { "shippingAddress": "HN", "phone": "09xx", "paymentMethod": "COD" }
exports.createOrder = async (req, res) => {
    const { shippingAddress, phone, paymentMethod } = req.body;
    const userId = req.user.id;

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        // Bắt đầu giao dịch (Transaction)
        await transaction.begin();

        // 1. Lấy dữ liệu từ Giỏ hàng
        const requestCart = new sql.Request(transaction); // Chú ý: dùng request của transaction
        const cartResult = await requestCart
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT ci.*, p.Price, v.StockQuantity 
                FROM Carts c
                JOIN CartItems ci ON c.CartID = ci.CartID
                JOIN ProductVariants v ON ci.VariantID = v.VariantID
                JOIN Products p ON v.ProductID = p.ProductID
                WHERE c.UserID = @UserID
            `);

        const cartItems = cartResult.recordset;

        if (cartItems.length === 0) {
            throw new Error('Giỏ hàng trống, không thể đặt hàng!');
        }

        // 2. Tính tổng tiền & Kiểm tra tồn kho
        let totalAmount = 0;
        for (const item of cartItems) {
            if (item.StockQuantity < item.Quantity) {
                throw new Error(`Sản phẩm (Variant ID: ${item.VariantID}) không đủ hàng!`);
            }
            totalAmount += item.Price * item.Quantity;
        }

        // 3. Tạo record trong bảng Orders
        const requestOrder = new sql.Request(transaction);
        const orderResult = await requestOrder
            .input('UserID', sql.Int, userId)
            .input('TotalAmount', sql.Decimal, totalAmount)
            .input('ShippingAddress', sql.NVarChar, shippingAddress)
            .input('PhoneNumber', sql.VarChar, phone)
            .input('PaymentMethod', sql.NVarChar, paymentMethod)
            .query(`
                INSERT INTO Orders (UserID, TotalAmount, ShippingAddress, PhoneNumber, PaymentMethod)
                OUTPUT INSERTED.OrderID
                VALUES (@UserID, @TotalAmount, @ShippingAddress, @PhoneNumber, @PaymentMethod)
            `);
        
        const orderId = orderResult.recordset[0].OrderID;

        // 4. Lưu chi tiết đơn hàng (OrderDetails) & Trừ tồn kho
        for (const item of cartItems) {
            const requestDetail = new sql.Request(transaction);
            
            // Thêm chi tiết đơn
            await requestDetail.query(`
                INSERT INTO OrderDetails (OrderID, VariantID, Quantity, UnitPrice)
                VALUES (${orderId}, ${item.VariantID}, ${item.Quantity}, ${item.Price})
            `);

            // Trừ tồn kho
            await requestDetail.query(`
                UPDATE ProductVariants 
                SET StockQuantity = StockQuantity - ${item.Quantity}
                WHERE VariantID = ${item.VariantID}
            `);
        }

        // 5. Xóa sạch giỏ hàng sau khi mua
        const requestClear = new sql.Request(transaction);
        await requestClear.input('UserID', sql.Int, userId).query(`
            DELETE FROM CartItems 
            WHERE CartID IN (SELECT CartID FROM Carts WHERE UserID = @UserID)
        `);

        // Nếu tất cả ngon lành -> Commit (Lưu chính thức)
        await transaction.commit();
        res.status(201).json({ message: 'Đặt hàng thành công!', orderId });

    } catch (err) {
        // Nếu có bất kỳ lỗi nào -> Rollback (Hoàn tác mọi thứ)
        await transaction.rollback();
        res.status(500).json({ error: err.message });
    }
};

// 2. Xem lịch sử đơn hàng
// GET /api/orders/history
exports.getOrderHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const pool = await sql.connect(dbConfig);
        
        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query('SELECT * FROM Orders WHERE UserID = @UserID ORDER BY OrderDate DESC');

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// [ADMIN] 3. Lấy tất cả đơn hàng của hệ thống
// GET /api/orders/admin/all
exports.getAllOrdersAdmin = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // Join bảng Users để lấy tên người đặt
        const result = await pool.request().query(`
            SELECT o.*, u.FullName 
            FROM Orders o
            JOIN Users u ON o.UserID = u.UserID
            ORDER BY o.OrderDate DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// [ADMIN] 4. Cập nhật trạng thái đơn hàng
// PUT /api/orders/admin/:id/status
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params; // OrderID
    const { status } = req.body; // Trạng thái mới (VD: "Đang giao")

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