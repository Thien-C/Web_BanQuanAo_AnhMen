// controllers/cartController.js
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// 1. Xem giỏ hàng
// GET /api/cart
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy từ token
        const pool = await sql.connect(dbConfig);

        // Query phức tạp: Join bảng CartItems -> ProductVariants -> Products
        const query = `
            SELECT 
                ci.CartItemID, 
                ci.Quantity, 
                ci.VariantID,
                v.Size, 
                v.Color, 
                v.StockQuantity,
                p.ProductID,
                p.Name, 
                p.Price, 
                p.Thumbnail
            FROM Carts c
            JOIN CartItems ci ON c.CartID = ci.CartID
            JOIN ProductVariants v ON ci.VariantID = v.VariantID
            JOIN Products p ON v.ProductID = p.ProductID
            WHERE c.UserID = @UserID
        `;

        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(query);

        // Tính tổng tiền tạm tính
        let totalAmount = 0;
        const cartItems = result.recordset.map(item => {
            totalAmount += item.Price * item.Quantity;
            return item;
        });

        res.json({
            cartItems,
            totalAmount
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Thêm vào giỏ hàng
// POST /api/cart
// Body: { "variantId": 1, "quantity": 2 }
exports.addToCart = async (req, res) => {
    const { variantId, quantity } = req.body;
    const userId = req.user.id;

    if (!variantId || !quantity) {
        return res.status(400).json({ message: 'Thiếu thông tin biến thể hoặc số lượng!' });
    }

    try {
        const pool = await sql.connect(dbConfig);

        // B1: Tìm hoặc Tạo Giỏ hàng cho User này
        let cartResult = await pool.request()
            .input('UserID', sql.Int, userId)
            .query('SELECT CartID FROM Carts WHERE UserID = @UserID');

        let cartId;
        if (cartResult.recordset.length === 0) {
            // Chưa có giỏ -> Tạo mới
            const newCart = await pool.request()
                .input('UserID', sql.Int, userId)
                .query('INSERT INTO Carts (UserID) OUTPUT INSERTED.CartID VALUES (@UserID)');
            cartId = newCart.recordset[0].CartID;
        } else {
            cartId = cartResult.recordset[0].CartID;
        }

        // B2: Kiểm tra xem sản phẩm này đã có trong giỏ chưa
        const itemCheck = await pool.request()
            .input('CartID', sql.Int, cartId)
            .input('VariantID', sql.Int, variantId)
            .query('SELECT * FROM CartItems WHERE CartID = @CartID AND VariantID = @VariantID');

        if (itemCheck.recordset.length > 0) {
            // Đã có -> Cộng dồn số lượng
            await pool.request()
                .input('CartID', sql.Int, cartId)
                .input('VariantID', sql.Int, variantId)
                .input('Quantity', sql.Int, quantity)
                .query('UPDATE CartItems SET Quantity = Quantity + @Quantity WHERE CartID = @CartID AND VariantID = @VariantID');
        } else {
            // Chưa có -> Thêm mới
            await pool.request()
                .input('CartID', sql.Int, cartId)
                .input('VariantID', sql.Int, variantId)
                .input('Quantity', sql.Int, quantity)
                .query('INSERT INTO CartItems (CartID, VariantID, Quantity) VALUES (@CartID, @VariantID, @Quantity)');
        }

        res.json({ message: 'Đã thêm sản phẩm vào giỏ hàng!' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};