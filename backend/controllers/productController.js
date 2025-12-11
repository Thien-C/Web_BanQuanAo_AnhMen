// controllers/productController.js
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

// 2. Lấy danh sách Sản phẩm (Có Lọc & Tìm kiếm & Sắp xếp)
// GET /api/products?keyword=...&category=...&minPrice=...&sort=...
exports.getProducts = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const { keyword, categorySlug, minPrice, maxPrice, sort } = req.query;

        // Bắt đầu chuỗi truy vấn cơ bản
        let queryStr = `
            SELECT p.*, c.Name as CategoryName, c.Slug as CategorySlug 
            FROM Products p
            JOIN Categories c ON p.CategoryID = c.CategoryID
            WHERE 1=1
        `;

        const request = pool.request();

        // --- Xử lý bộ lọc (Dynamic SQL) ---
        
        // 1. Tìm theo tên (Keyword)
        if (keyword) {
            request.input('Keyword', sql.NVarChar, `%${keyword}%`);
            queryStr += " AND p.Name LIKE @Keyword";
        }

        // 2. Lọc theo Category Slug
        if (categorySlug) {
            request.input('CategorySlug', sql.VarChar, categorySlug);
            queryStr += " AND c.Slug = @CategorySlug";
        }

        // 3. Lọc theo khoảng giá
        if (minPrice) {
            request.input('MinPrice', sql.Decimal, minPrice);
            queryStr += " AND p.Price >= @MinPrice";
        }
        if (maxPrice) {
            request.input('MaxPrice', sql.Decimal, maxPrice);
            queryStr += " AND p.Price <= @MaxPrice";
        }

        // --- Xử lý sắp xếp (Sorting) ---
        if (sort === 'price_asc') {
            queryStr += " ORDER BY p.Price ASC";
        } else if (sort === 'price_desc') {
            queryStr += " ORDER BY p.Price DESC";
        } else {
            queryStr += " ORDER BY p.CreatedAt DESC"; // Mặc định: Mới nhất lên đầu
        }

        // Thực thi truy vấn
        const result = await request.query(queryStr);
        res.json(result.recordset);

    } catch (err) {
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