// frontend/admin/js/admin.js

// 1. KIỂM TRA QUYỀN ADMIN (Security Check)
function checkAdminRole() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        alert('Bạn chưa đăng nhập!');
        window.location.href = '../login.html';
        return false;
    }

    const user = JSON.parse(userStr);
    
    // Nếu Role không phải Admin -> Đuổi về trang chủ
    // Lưu ý: Đây chỉ là check frontend, backend cũng cần check middleware nếu làm kỹ
    if (user.role !== 'Admin') {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = '../index.html';
        return false;
    }
    
    return true;
}

// 2. TẢI DANH SÁCH ĐƠN HÀNG
async function loadOrders() {
    const tbody = document.getElementById('order-list');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Đang tải...</td></tr>';

    try {
        // Gọi API Admin (Phải có Token Admin trong localStorage thì fetchAPI tự lấy)
        const orders = await fetchAPI('/orders/admin/all');

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Không có đơn hàng nào.</td></tr>';
            return;
        }

        // Render Table
        const html = orders.map(order => {
            const date = new Date(order.OrderDate).toLocaleDateString('vi-VN');
            const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.TotalAmount);
            
            // Xử lý class màu sắc cho Select status
            let statusClass = '';
            if (order.Status === 'Chờ xử lý') statusClass = 'status-pending';
            else if (order.Status === 'Đang giao') statusClass = 'status-shipping';
            else if (order.Status === 'Hoàn thành') statusClass = 'status-done';
            else statusClass = 'status-cancel';

            return `
                <tr>
                    <td>#${order.OrderID}</td>
                    <td>
                        <strong>${order.FullName}</strong><br>
                        <small>${order.PhoneNumber}</small>
                    </td>
                    <td>${date}</td>
                    <td style="font-weight:bold; color:#d0021b;">${price}</td>
                    <td>${order.PaymentMethod}</td>
                    <td>
                        <select 
                            class="status-select ${statusClass}" 
                            onchange="updateStatus(${order.OrderID}, this)"
                        >
                            <option value="Chờ xử lý" ${order.Status === 'Chờ xử lý' ? 'selected' : ''}>Chờ xử lý</option>
                            <option value="Đang giao" ${order.Status === 'Đang giao' ? 'selected' : ''}>Đang giao</option>
                            <option value="Hoàn thành" ${order.Status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
                            <option value="Đã hủy" ${order.Status === 'Đã hủy' ? 'selected' : ''}>Đã hủy</option>
                        </select>
                    </td>
                    <td>
                        <button onclick="viewDetail(${order.OrderID})" style="cursor:pointer; border:none; background:none;">
                            <i class="fa-solid fa-eye text-primary"></i> Xem
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center">Lỗi: ${error.message}</td></tr>`;
    }
}

// 3. CẬP NHẬT TRẠNG THÁI
async function updateStatus(orderId, selectElement) {
    const newStatus = selectElement.value;
    const confirmMsg = `Bạn có chắc muốn đổi trạng thái đơn #${orderId} thành "${newStatus}"?`;

    if (!confirm(confirmMsg)) {
        // Nếu chọn Cancel, reload lại bảng để quay về trạng thái cũ
        loadOrders(); 
        return;
    }

    try {
        await fetchAPI(`/orders/admin/${orderId}/status`, 'PUT', { status: newStatus });
        alert('Cập nhật thành công!');
        
        // Load lại để cập nhật màu sắc badge
        loadOrders();
    } catch (error) {
        alert('Cập nhật thất bại: ' + error.message);
    }
}

function logoutAdmin() {
    auth.logout(); // Hàm có sẵn trong api.js
}

function viewDetail(id) {
    alert(`Chức năng xem chi tiết đơn hàng #${id} (Bạn có thể tự làm thêm!)`);
}

// KHỞI CHẠY
document.addEventListener('DOMContentLoaded', () => {
    if (checkAdminRole()) {
        loadOrders();
    }
});