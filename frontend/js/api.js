// js/api.js

// 1. CẤU HÌNH CHUNG
const BASE_URL = 'http://localhost:5000/api';

/**
 * Hàm wrapper giúp gọi API nhanh gọn, tự động đính kèm Token
 * @param {string} endpoint - Đường dẫn sau BASE_URL (VD: /products)
 * @param {string} method - GET, POST, PUT, DELETE (Mặc định GET)
 * @param {object} body - Dữ liệu gửi đi (Mặc định null)
 */
async function fetchAPI(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    // Tự động lấy Token từ LocalStorage nếu có
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        
        // Nếu Token hết hạn hoặc không hợp lệ (Lỗi 401/403) -> Tự động đăng xuất
        if (response.status === 401 || response.status === 403) {
            alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
            logout();
            return null;
        }

        const data = await response.json();

        // Nếu API trả về lỗi (VD: Email trùng, Sai pass) -> Ném lỗi ra để catch bắt
        if (!response.ok) {
            throw new Error(data.message || 'Có lỗi xảy ra');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        alert(error.message); // Hiển thị lỗi cho user thấy
        throw error;
    }
}

// 2. CÁC HÀM XỬ LÝ AUTHENTICATION (Đăng ký/Đăng nhập)

const auth = {
    // Đăng nhập
    async login(email, password) {
        try {
            const data = await fetchAPI('/auth/login', 'POST', { email, password });
            
            if (data && data.token) {
                // Lưu Token và thông tin User vào bộ nhớ trình duyệt
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert('Đăng nhập thành công!');
                window.location.href = 'index.html'; // Chuyển về trang chủ
            }
        } catch (err) {
            // Lỗi đã được alert ở hàm fetchAPI
        }
    },

    // Đăng ký
    async register(fullName, email, password, phone) {
        try {
            const data = await fetchAPI('/auth/register', 'POST', { 
                fullName, email, password, phone 
            });
            
            if (data) {
                alert('Đăng ký thành công! Vui lòng đăng nhập.');
                window.location.href = 'login.html'; // Chuyển sang trang đăng nhập
            }
        } catch (err) {
            // Lỗi đã được alert ở hàm fetchAPI
        }
    },

    // Đăng xuất
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    // Kiểm tra trạng thái đăng nhập để cập nhật UI Header
    checkLoginStatus() {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        // Tìm icon User và Text tên user trên Header
        const userIcon = document.querySelector('.fa-user');
        
        if (user && token && userIcon) {
            // Nếu đã đăng nhập -> Thay icon user bằng tên người dùng
            // Tìm thẻ cha của icon user (div.action-item)
            const parent = userIcon.parentElement;
            
            // Xóa icon cũ, thay bằng HTML mới
            parent.innerHTML = `
                <span style="font-size: 13px; font-weight: 600; cursor: pointer;">Hi, ${user.fullName}</span>
                <div class="dropdown-menu">
                    <a href="#" onclick="auth.logout()">Đăng xuất</a>
                </div>
            `;
        }
    }
};

// Tự động chạy kiểm tra đăng nhập khi file này được load
document.addEventListener('DOMContentLoaded', () => {
    auth.checkLoginStatus();
});