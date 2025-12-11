// frontend/admin/js/checkAdmin.js

(function() {
    // Hàm này tự chạy ngay lập tức (IIFE)
    
    // 1. Lấy thông tin từ LocalStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // 2. Nếu không có token hoặc user -> Đá về login
    if (!token || !userStr) {
        alert('Vui lòng đăng nhập tài khoản Admin!');
        window.location.href = '../../login.html'; // Thoát ra 2 cấp thư mục (js -> admin -> frontend)
        return;
    }

    try {
        const user = JSON.parse(userStr);

        // 3. Nếu Role không phải Admin -> Đá về trang chủ khách hàng
        if (user.role !== 'Admin') {
            alert('Bạn không có quyền truy cập trang quản trị!');
            window.location.href = '../../index.html';
            return;
        }

        // Nếu hợp lệ: Code sẽ chạy tiếp, hiển thị trang Admin bình thường
        console.log('Admin verified:', user.fullName);

    } catch (e) {
        // Phòng trường hợp JSON lỗi
        localStorage.clear();
        window.location.href = '../../login.html';
    }
})();