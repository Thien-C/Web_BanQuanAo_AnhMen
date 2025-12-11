// js/profile.js

// Hàm chuyển Tab
function switchTab(tabName) {
    // 1. Ẩn tất cả tab content
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    // 2. Bỏ active menu
    document.querySelectorAll('.sidebar-menu a').forEach(el => el.classList.remove('active'));
    
    // 3. Hiển thị tab được chọn
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // 4. Active menu tương ứng
    const index = tabName === 'info' ? 0 : 1;
    document.querySelectorAll('.sidebar-menu a')[index].classList.add('active');
}

// Hàm format ngày (DD/MM/YYYY)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Hàm format tiền
const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// 1. Load Thông tin cá nhân
async function loadProfile() {
    try {
        const user = await fetchAPI('/users/profile');
        if (user) {
            // Điền vào form
            document.getElementById('fullname').value = user.FullName;
            document.getElementById('email').value = user.Email;
            document.getElementById('phone').value = user.PhoneNumber || '';
            document.getElementById('address').value = user.Address || '';
            
            // Cập nhật tên ở sidebar
            document.getElementById('sidebar-name').textContent = user.FullName;
        }
    } catch (err) {
        console.error(err);
    }
}

// 2. Load Lịch sử đơn hàng
async function loadOrders() {
    try {
        const orders = await fetchAPI('/users/orders');
        const tbody = document.getElementById('order-list');
        
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Bạn chưa có đơn hàng nào.</td></tr>';
            return;
        }

        const html = orders.map(order => {
            let statusClass = 'st-pending';
            if (order.Status === 'Đang giao') statusClass = 'st-shipping';
            if (order.Status === 'Hoàn thành') statusClass = 'st-done';
            if (order.Status === 'Đã hủy') statusClass = 'st-cancel';

            return `
                <tr>
                    <td>#${order.OrderID}</td>
                    <td>${formatDate(order.OrderDate)}</td>
                    <td style="font-weight:bold; color:red;">${formatMoney(order.TotalAmount)}</td>
                    <td><span class="status-badge ${statusClass}">${order.Status}</span></td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

// 3. Xử lý Cập nhật thông tin
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        fullName: document.getElementById('fullname').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };

    try {
        // 1. Gọi API cập nhật xuống Database
        await fetchAPI('/users/profile', 'PUT', data);
        
        alert('Cập nhật thông tin thành công!');

        // 2. Cập nhật giao diện Sidebar (Cột trái)
        document.getElementById('sidebar-name').textContent = data.fullName;

        // --- BỔ SUNG ĐOẠN NÀY ĐỂ FIX LỖI HEADER ---
        
        // 3. Cập nhật lại LocalStorage (Bộ nhớ trình duyệt)
        // Lấy user cũ ra
        const currentUser = JSON.parse(localStorage.getItem('user'));
        
        // Sửa tên mới vào
        currentUser.fullName = data.fullName;
        
        // Lưu ngược lại vào localStorage
        localStorage.setItem('user', JSON.stringify(currentUser));

        // 4. Gọi hàm cập nhật Header ngay lập tức (Hàm này nằm bên api.js)
        if (typeof auth !== 'undefined' && auth.checkLoginStatus) {
            auth.checkLoginStatus();
        }
        
        // ------------------------------------------

    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
});

// KHỞI CHẠY
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra đăng nhập
    if (!localStorage.getItem('token')) {
        alert('Vui lòng đăng nhập để xem thông tin!');
        window.location.href = 'login.html';
        return;
    }

    loadProfile();
    loadOrders();
});