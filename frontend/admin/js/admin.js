// frontend/admin/js/admin.js

// 1. Hàm load danh sách đơn hàng
async function loadOrders() {
    const tbody = document.getElementById('order-list');
    if (!tbody) return;

    // Giữ nguyên trạng thái loading nếu đang load lần đầu
    // tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Đang tải...</td></tr>';

    try {
        // Gọi API lấy danh sách đơn hàng
        const orders = await fetchAPI('/orders/admin/orders');

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Chưa có đơn hàng nào.</td></tr>';
            return;
        }

        const html = orders.map(order => {
            const date = new Date(order.OrderDate).toLocaleDateString('vi-VN');
            const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.TotalAmount);
            
            // Xử lý màu sắc trạng thái cho đẹp
            let color = '#333';
            let bg = '#fff';
            let border = '#ccc';
            
            if(order.Status === 'Hoàn thành') { color = '#155724'; bg = '#d4edda'; border = '#c3e6cb'; }
            else if(order.Status === 'Đã hủy') { color = '#721c24'; bg = '#f8d7da'; border = '#f5c6cb'; }
            else if(order.Status === 'Đang giao') { color = '#004085'; bg = '#cce5ff'; border = '#b8daff'; }
            else { color = '#856404'; bg = '#fff3cd'; border = '#ffeeba'; } // Chờ xử lý

            const customerName = order.UserName || 'Khách vãng lai';

            return `
                <tr>
                    <td>#${order.OrderID}</td>
                    <td>${date}</td>
                    <td>
                        <strong>${customerName}</strong><br>
                        <small style="color:#666">${order.PhoneNumber}</small>
                    </td>
                    <td style="font-weight:bold">${price}</td>
                    <td>${order.PaymentMethod}</td>
                    <td>
                        <select 
                            onchange="updateStatus(${order.OrderID}, this.value)"
                            style="padding: 5px 10px; border-radius: 4px; border: 1px solid ${border}; color: ${color}; background: ${bg}; font-weight: 600; cursor: pointer;"
                        >
                            <option value="Chờ xử lý" ${order.Status === 'Chờ xử lý' ? 'selected' : ''}>Chờ xử lý</option>
                            <option value="Đang giao" ${order.Status === 'Đang giao' ? 'selected' : ''}>Đang giao</option>
                            <option value="Hoàn thành" ${order.Status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
                            <option value="Đã hủy" ${order.Status === 'Đã hủy' ? 'selected' : ''}>Đã hủy</option>
                        </select>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
}

// 2. Hàm cập nhật trạng thái
async function updateStatus(orderId, newStatus) {
    // Hỏi xác nhận trước khi đổi
    const confirmMsg = `Bạn có chắc muốn đổi trạng thái đơn #${orderId} thành "${newStatus}"?`;
    if (!confirm(confirmMsg)) {
        loadOrders(); // Nếu hủy thì load lại để reset cái select box về cũ
        return;
    }

    try {
        await fetchAPI(`/orders/admin/orders/${orderId}`, 'PUT', { status: newStatus });
        alert('Cập nhật thành công!');
        loadOrders(); // Load lại để cập nhật màu sắc mới
    } catch (err) {
        alert('Lỗi: ' + err.message);
        loadOrders(); // Load lại để hoàn tác
    }
}

// 3. KHỞI CHẠY
document.addEventListener('DOMContentLoaded', () => {
    // QUAN TRỌNG: Đã xóa dòng checkAdminAuth() gây lỗi
    // File checkAdmin.js đã tự động chạy kiểm tra quyền rồi
    
    loadOrders();
});