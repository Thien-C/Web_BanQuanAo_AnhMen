👕 ANH MEN Shop - E-commerce Website

Dự án Website thương mại điện tử hoàn chỉnh, được xây dựng dựa trên cảm hứng từ Coolmate, tập trung vào trải nghiệm mua sắm thời trang nam hiện đại, tối giản và tốc độ.

(Bạn có thể thay link ảnh trên bằng ảnh chụp màn hình thực tế dự án của bạn)

🌟 Tính năng nổi bật (Features)

🛒 Dành cho Khách hàng (Client)

Trang chủ (Home): Banner slider, danh mục sản phẩm, sản phẩm nổi bật.

Tìm kiếm & Lọc (Filter): Tìm kiếm theo tên, lọc theo danh mục, sắp xếp giá/mới nhất.

Chi tiết sản phẩm: Xem ảnh chi tiết, chọn Size/Màu sắc, xem đánh giá.

Giỏ hàng (Cart): Thêm/Sửa/Xóa sản phẩm, tự động tính tổng tiền. (Lưu LocalStorage).

Đặt hàng (Checkout): Form thông tin giao hàng, chọn phương thức thanh toán.

Tài khoản (Profile): Đăng ký/Đăng nhập, xem lịch sử đơn hàng, cập nhật thông tin cá nhân.

🛠️ Dành cho Quản trị viên (Admin Dashboard)

Quản lý Sản phẩm: Thêm mới, Sửa, Xóa sản phẩm.

Quản lý Đơn hàng: Xem danh sách đơn hàng, cập nhật trạng thái (Đang giao, Hoàn thành, Hủy...).

Bảo mật: Phân quyền Admin/User bằng Middleware & JWT.

🚀 Công nghệ sử dụng (Tech Stack)

Hạng mục

Công nghệ

Frontend

HTML5, CSS3 (Custom), JavaScript (Vanilla ES6+)

Backend

Node.js, Express.js

Database

SQL Server (MSSQL)

Authentication

JWT (JSON Web Token), Bcryptjs (Hash password)

Deployment

(Đang chạy local)

📦 Cài đặt & Chạy dự án (Installation)

1. Chuẩn bị (Prerequisites)

Node.js (v14 trở lên)

SQL Server (Đã cài đặt và đang chạy)

Git

2. Clone dự án

git clone [https://github.com/username-cua-ban/anh-men-shop.git](https://github.com/username-cua-ban/anh-men-shop.git)
cd anh-men-shop


3. Cài đặt thư viện (Install Dependencies)

npm install


4. Cấu hình Database

Mở SQL Server Management Studio (SSMS).

Mở file DB.sql trong thư mục gốc.

Chạy toàn bộ script để tạo Database ANH MENCloneDB và dữ liệu mẫu.

Đổi tên file .env.example thành .env và điền thông tin kết nối của bạn:

DB_USER=sa
DB_PASS=mat_khau_sql_cua_ban
DB_SERVER=localhost
DB_NAME=ANH MENCloneDB
PORT=5000
JWT_SECRET=BiMatNayChiMinhTaBiet


5. Chạy dự án (Run)

# Chạy server (Prod)
npm start

# Hoặc chạy chế độ Dev (tự động reload khi sửa code)
npm run dev


Server sẽ chạy tại: http://localhost:5000

📂 Cấu trúc thư mục (Folder Structure)

anh-men-shop/
├── backend/                # Source code Backend (API)
│   ├── controllers/        # Xử lý logic (Product, Order, Auth...)
│   ├── middleware/         # Middleware (Check Token, Check Admin)
│   ├── routes/             # Định nghĩa đường dẫn API
│   ├── server.js           # File khởi chạy Server
│   └── DB.sql              # Script tạo Database SQL Server
|       ...
│
├── frontend/               # Source code Giao diện
│   ├── admin/              # Trang quản trị (HTML/CSS/JS riêng)
│   ├── css/                # CSS chung
│   ├── js/                 # JS xử lý logic Client (api.js, main.js...)
│   └── index.html          # Trang chủ
│       ...
|
├── .env                    # Biến môi trường (Không push file này lên Git)

LƯU Ý: SQL Server có thể phải tùy chỉnh mới làm được

🤝 Đóng góp (Contributing)

Mọi đóng góp đều được hoan nghênh! Hãy tạo Pull Request hoặc mở Issue nếu bạn tìm thấy lỗi