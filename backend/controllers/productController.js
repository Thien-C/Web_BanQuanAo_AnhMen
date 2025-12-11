// backend/controllers/productController.js
const sql = require('mssql');
const dbConfig = require('../dbConfig');

// 1. Lấy danh sách Categories (Danh mục)
// GET /api/categories
exports.getAllCategories = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM Categories');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Lấy danh sách Sản phẩm (NÂNG CẤP: Tìm kiếm, Lọc, Sắp xếp)
// GET /api/products?keyword=...&category=...&sort=...
exports.getProducts = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // 1. Lấy tham số từ URL
        const { keyword, category, sort } = req.query;

        // 2. Khởi tạo câu truy vấn cơ bản
        let queryStr = `
            SELECT p.*, c.Name as CategoryName 
            FROM Products p
            JOIN Categories c ON p.CategoryID = c.CategoryID
            WHERE 1=1
        `;

        // 3. Khởi tạo Request và thêm tham số (Chống SQL Injection)
        const request = pool.request();

        // --- Xử lý Tìm kiếm (Keyword) ---
        if (keyword) {
            // Tìm theo tên sản phẩm (có chứa từ khóa)
            request.input('Keyword', sql.NVarChar, `%${keyword}%`);
            queryStr += " AND p.Name LIKE @Keyword";
        }

        // --- Xử lý Lọc Danh mục (Category ID) ---
        if (category && category !== 'all') {
            request.input('CategoryID', sql.Int, category);
            queryStr += " AND p.CategoryID = @CategoryID";
        }

        // --- Xử lý Sắp xếp (Sort) ---
        // Lưu ý: ORDER BY không dùng parameter @Bien được, phải nối chuỗi an toàn
        switch (sort) {
            case 'price_asc':
                queryStr += " ORDER BY p.Price ASC";
                break;
            case 'price_desc':
                queryStr += " ORDER BY p.Price DESC";
                break;
            case 'newest':
            default:
                queryStr += " ORDER BY p.CreatedAt DESC"; // Mặc định mới nhất
                break;
        }

        // 4. Thực thi
        const result = await request.query(queryStr);
        
        res.json(result.recordset);

    } catch (err) {
        console.error("Lỗi getProducts:", err);
        res.status(500).json({ error: err.message });
    }
};

// 3. Lấy Chi tiết sản phẩm (Kèm Biến thể & Đánh giá)
// GET /api/products/:id
exports.getProductDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);

        // Query 1: Lấy thông tin chung sản phẩm
        const productRequest = pool.request()
            .input('ProductID', sql.Int, id)
            .query(`
                SELECT p.*, c.Name as CategoryName, c.Slug as CategorySlug
                FROM Products p
                JOIN Categories c ON p.CategoryID = c.CategoryID
                WHERE p.ProductID = @ProductID
            `);

        // Query 2: Lấy danh sách biến thể (Màu/Size)
        const variantsRequest = pool.request()
            .input('ProductID', sql.Int, id)
            .query(`SELECT * FROM ProductVariants WHERE ProductID = @ProductID`);

        // Query 3: Lấy đánh giá (Reviews)
        const reviewsRequest = pool.request()
            .input('ProductID', sql.Int, id)
            .query(`
                SELECT r.*, u.FullName 
                FROM Reviews r
                JOIN Users u ON r.UserID = u.UserID
                WHERE r.ProductID = @ProductID
                ORDER BY r.CreatedAt DESC
            `);

        // Chạy song song 3 truy vấn để tối ưu tốc độ (Promise.all)
        const [productResult, variantsResult, reviewsResult] = await Promise.all([
            productRequest, 
            variantsRequest, 
            reviewsRequest
        ]);

        const product = productResult.recordset[0];

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm!' });
        }

        // Gộp dữ liệu trả về client
        res.json({
            ...product, // Thông tin cơ bản (Tên, giá, mô tả...)
            variants: variantsResult.recordset, // Mảng màu/size
            reviews: reviewsResult.recordset // Mảng đánh giá
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ... (Code cũ)

// [ADMIN] Tạo sản phẩm mới
// POST /api/products
exports.createProduct = async (req, res) => {
    const { name, categoryId, price, description, thumbnail } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('Name', sql.NVarChar, name)
            .input('CategoryID', sql.Int, categoryId)
            .input('Price', sql.Decimal, price)
            .input('Description', sql.NVarChar, description)
            .input('Thumbnail', sql.NVarChar, thumbnail)
            .query(`
                INSERT INTO Products (Name, CategoryID, Price, Description, Thumbnail)
                VALUES (@Name, @CategoryID, @Price, @Description, @Thumbnail)
            `);
        res.status(201).json({ message: 'Thêm sản phẩm thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// [ADMIN] Cập nhật sản phẩm
// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, categoryId, price, description, thumbnail } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('ProductID', sql.Int, id)
            .input('Name', sql.NVarChar, name)
            .input('CategoryID', sql.Int, categoryId)
            .input('Price', sql.Decimal, price)
            .input('Description', sql.NVarChar, description)
            .input('Thumbnail', sql.NVarChar, thumbnail)
            .query(`
                UPDATE Products 
                SET Name = @Name, CategoryID = @CategoryID, Price = @Price, 
                    Description = @Description, Thumbnail = @Thumbnail
                WHERE ProductID = @ProductID
            `);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// [ADMIN] Xóa sản phẩm
// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('ProductID', sql.Int, id)
            .query('DELETE FROM Products WHERE ProductID = @ProductID');
        res.json({ message: 'Xóa sản phẩm thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};