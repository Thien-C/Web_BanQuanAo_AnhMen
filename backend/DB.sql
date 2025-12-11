-- 1. Xóa DB cũ nếu lỗi và tạo mới lại từ đầu (Clean Slate)
USE master;
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'ANH MENCloneDB')
BEGIN
    ALTER DATABASE ANH MENCloneDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE; -- Ngắt kết nối để drop
    DROP DATABASE ANH MENCloneDB;
END
GO

CREATE DATABASE ANH MENCloneDB;
GO

USE ANH MENCloneDB;
GO

-- 2. Tạo bảng Users (Khách hàng & Admin)
-- ĐÃ SỬA LỖI: Cột Avatar
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE, 
    PasswordHash VARCHAR(255) NOT NULL, 
    PhoneNumber VARCHAR(15),
    Address NVARCHAR(255),
    Role VARCHAR(20) DEFAULT 'Customer' CHECK (Role IN ('Customer', 'Admin', 'Staff')), 
    Avatar NVARCHAR(MAX), -- Đã sửa lỗi cú pháp tại đây
    CreatedAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);
GO

-- 3. Tạo bảng Categories (Danh mục sản phẩm)
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Slug VARCHAR(100) NOT NULL UNIQUE, 
    Description NVARCHAR(500)
);
GO

-- 4. Tạo bảng Products (Sản phẩm chung)
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryID INT NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(18, 0) NOT NULL, 
    Thumbnail NVARCHAR(MAX), 
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE CASCADE
);
GO

-- 5. Tạo bảng ProductVariants (Biến thể: Màu/Size)
CREATE TABLE ProductVariants (
    VariantID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    Color NVARCHAR(50) NOT NULL, 
    Size NVARCHAR(10) NOT NULL, 
    StockQuantity INT DEFAULT 0 CHECK (StockQuantity >= 0),
    Image NVARCHAR(MAX), 
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
);
GO

-- 6. Tạo bảng Carts (Giỏ hàng)
CREATE TABLE Carts (
    CartID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

CREATE TABLE CartItems (
    CartItemID INT IDENTITY(1,1) PRIMARY KEY,
    CartID INT NOT NULL,
    VariantID INT NOT NULL, 
    Quantity INT DEFAULT 1 CHECK (Quantity > 0),
    FOREIGN KEY (CartID) REFERENCES Carts(CartID) ON DELETE CASCADE,
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID)
);
GO

-- 7. Tạo bảng Orders (Đơn hàng)
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(18, 0) NOT NULL,
    Status NVARCHAR(50) DEFAULT N'Chờ xử lý', 
    ShippingAddress NVARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    PaymentMethod NVARCHAR(50) DEFAULT 'COD',
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- 8. Tạo bảng OrderDetails (Chi tiết đơn hàng)
CREATE TABLE OrderDetails (
    OrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    VariantID INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(18, 0) NOT NULL, 
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (VariantID) REFERENCES ProductVariants(VariantID)
);
GO

-- 9. Tạo bảng Reviews (Đánh giá)
CREATE TABLE Reviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ProductID INT NOT NULL,
    Rating INT CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(1000),
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
GO

-- =============================================
-- SEED DATA (Dữ liệu mẫu)
-- =============================================

-- Thêm User Admin và Khách hàng mẫu
INSERT INTO Users (FullName, Email, PasswordHash, Role, PhoneNumber, Address)
VALUES 
(N'Quản Trị Viên', 'admin@ANH MEN.fake', 'hashed_password_here', 'Admin', '0909123456', N'Hà Nội'),
(N'Nguyễn Văn A', 'khachhang@gmail.com', 'hashed_password_here', 'Customer', '0912345678', N'TP. Hồ Chí Minh');

-- Thêm Danh mục
INSERT INTO Categories (Name, Slug, Description)
VALUES 
(N'Áo Nam', 'ao-nam', N'Các loại áo thun, áo khoác, áo sơ mi'),
(N'Quần Nam', 'quan-nam', N'Quần short, quần jeans, quần âu'),
(N'Phụ Kiện', 'phu-kien', N'Tất, mũ, thắt lưng');

-- Thêm Sản phẩm
INSERT INTO Products (CategoryID, Name, Description, Price, Thumbnail)
VALUES 
(1, N'Áo Thun Cotton Compact', N'Áo thun 100% Cotton, chống nhăn, mát mịn.', 299000, 'ao-thun-compact.jpg'),
(2, N'Quần Short Thể Thao', N'Quần short chạy bộ, thoáng khí.', 159000, 'quan-short-the-thao.jpg');

-- Thêm Biến thể (Màu/Size) cho Áo Thun (ProductID = 1)
INSERT INTO ProductVariants (ProductID, Color, Size, StockQuantity)
VALUES 
(1, N'Đen', 'L', 50),
(1, N'Đen', 'XL', 30),
(1, N'Trắng', 'L', 40),
(1, N'Xanh Navy', 'M', 20);

-- Thêm Biến thể cho Quần Short (ProductID = 2)
INSERT INTO ProductVariants (ProductID, Color, Size, StockQuantity)
VALUES 
(2, N'Xám', 'L', 100),
(2, N'Đen', 'L', 80);

-- Thêm Đánh giá mẫu
INSERT INTO Reviews (UserID, ProductID, Rating, Comment)
VALUES 
(2, 1, 5, N'Áo mặc rất mát, giao hàng nhanh!');

GO