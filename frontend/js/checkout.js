// frontend/js/checkout.js

// 1. Load lại cart ở sidebar Checkout để user check lần cuối
function loadCheckoutSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert("Giỏ hàng trống!");
        window.location.href = 'index.html';
        return;
    }

    const container = document.querySelector('.mini-cart-list');
    const totalEl = document.querySelector('.total-price');
    let total = 0;

    if(container) {
        container.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `
            <div class="mini-item">
                <div class="mini-img">
                    <span class="qty-badge">${item.quantity}</span>
                    <img src="${item.thumbnail}" onerror="this.src='https://via.placeholder.com/60'">
                </div>
                <div class="mini-info">
                    <p class="mini-name">${item.name}</p>
                    <small>${item.color} / ${item.size}</small>
                </div>
                <div class="mini-price">${new Intl.NumberFormat('vi-VN').format(item.price)}đ</div>
            </div>`;
        }).join('');
    }
    
    if(totalEl) totalEl.innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);
}

// 2. Submit Đơn Hàng
async function handleOrderSubmit(e) {
    e.preventDefault();

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) return;

    // Lấy thông tin từ Form
    const fullName = document.querySelector('input[placeholder="Họ và tên người nhận"]').value;
    const phone = document.querySelector('input[placeholder="Số điện thoại"]').value;
    const address = document.querySelector('input[placeholder="Địa chỉ (Số nhà, đường...)"]').value;
    
    // Lấy Payment Method
    const paymentRadio = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = paymentRadio ? paymentRadio.value : 'COD';

    // Payload gửi lên API (Không gửi price, để server tự tính)
    const payload = {
        fullName,
        phone,
        address, // Nên ghép thêm Quận/Huyện nếu có
        paymentMethod,
        items: cart.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity
            // price: item.price -> KHÔNG GỬI GIÁ LÊN SERVER ĐỂ TRÁNH HACK
        }))
    };

    try {
        const btn = document.querySelector('.btn-buy-now');
        btn.innerText = 'Đang xử lý...';
        btn.disabled = true;

        // Gọi API (Hàm fetchAPI từ api.js)
        // Lưu ý: Nếu user đã login, fetchAPI sẽ tự động gắn Token để backend biết UserID
        const res = await fetchAPI('/orders', 'POST', payload);

        if (res && res.orderId) {
            // THÀNH CÔNG
            localStorage.removeItem('cart'); // Xóa giỏ hàng
            alert(`🎉 Đặt hàng thành công! Mã đơn: #${res.orderId}\nTổng tiền: ${new Intl.NumberFormat('vi-VN').format(res.totalAmount)}đ`);
            window.location.href = 'index.html';
        }
    } catch (err) {
        alert('Lỗi đặt hàng: ' + err.message);
        const btn = document.querySelector('.btn-buy-now');
        btn.innerText = 'HOÀN TẤT ĐƠN HÀNG';
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('checkout-form')) {
        loadCheckoutSummary();
        document.getElementById('checkout-form').addEventListener('submit', handleOrderSubmit);
    }
});