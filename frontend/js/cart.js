// js/cart.js

// Biến toàn cục lưu danh sách biến thể của sản phẩm đang xem
let currentProductVariants = []; 

// ============================================================
// 1. LOGIC TRANG CHI TIẾT SẢN PHẨM (product-detail.html)
// ============================================================
async function initProductDetail() {
    // Lấy ID sản phẩm từ URL (VD: ?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) return;

    try {
        // Gọi API lấy chi tiết
        const product = await fetchAPI(`/products/${productId}`);
        
        // 1. Lưu danh sách biến thể để dùng khi bấm nút Mua
        currentProductVariants = product.variants;

        // 2. Render thông tin cơ bản
        document.querySelector('.pd-title').textContent = product.Name;
        document.querySelector('.current-price').textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.Price);
        document.getElementById('breadcrumb-name').textContent = product.Name;
        document.getElementById('main-image').src = product.Thumbnail;

        // 3. Render danh sách Màu sắc có sẵn
        // (Lọc trùng màu: dùng Set)
        const colors = [...new Set(product.variants.map(v => v.Color))];
        const colorContainer = document.getElementById('color-options');
        colorContainer.innerHTML = colors.map(color => `
            <button class="opt-btn color-btn" data-color="${color}" onclick="selectColor(this, '${color}')" style="background-color: ${getColorHex(color)}"></button>
        `).join('');

        // 4. Render danh sách Size có sẵn
        const sizes = [...new Set(product.variants.map(v => v.Size))];
        const sizeContainer = document.getElementById('size-options');
        sizeContainer.innerHTML = sizes.map(size => `
            <button class="opt-btn size-btn" data-size="${size}" onclick="selectSize(this, '${size}')">${size}</button>
        `).join('');

    } catch (error) {
        console.error(error);
    }
}

// Hàm hỗ trợ: Chọn màu
function selectColor(btn, color) {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('selected-color-name').textContent = color;
}

// Hàm hỗ trợ: Chọn size
function selectSize(btn, size) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('selected-size-name').textContent = size;
}

// Hàm hỗ trợ: Map tên màu ra mã Hex (để hiển thị nút màu cho đẹp)
function getColorHex(colorName) {
    const map = {
        'Đen': '#000000',
        'Trắng': '#ffffff',
        'Xanh Navy': '#000080',
        'Xám': '#808080',
        'Đỏ': '#ff0000'
    };
    return map[colorName] || '#cccccc'; // Mặc định màu xám nếu không tìm thấy
}

// --- XỬ LÝ SỰ KIỆN: THÊM VÀO GIỎ ---
async function addToCart() {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để mua hàng!');
        window.location.href = 'login.html';
        return;
    }

    // 2. Lấy Màu và Size đang chọn
    const selectedColorBtn = document.querySelector('.color-btn.selected');
    const selectedSizeBtn = document.querySelector('.size-btn.selected');
    const quantityInput = document.querySelector('.quantity-control input');

    if (!selectedColorBtn || !selectedSizeBtn) {
        alert('Vui lòng chọn đầy đủ Màu sắc và Kích thước!');
        return;
    }

    const color = selectedColorBtn.getAttribute('data-color');
    const size = selectedSizeBtn.getAttribute('data-size');
    const quantity = parseInt(quantityInput.value);

    // 3. Tìm VariantID tương ứng
    const variant = currentProductVariants.find(v => v.Color === color && v.Size === size);

    if (!variant) {
        alert('Rất tiếc, phiên bản này đang tạm hết hàng!');
        return;
    }

    // 4. Gọi API
    try {
        const res = await fetchAPI('/cart', 'POST', {
            variantId: variant.VariantID,
            quantity: quantity
        });

        if (res) {
            alert('Đã thêm vào giỏ hàng thành công!');
            // Cập nhật số lượng trên header (Optional)
        }
    } catch (err) {
        console.error(err);
    }
}

// ============================================================
// 2. LOGIC TRANG GIỎ HÀNG (cart.html)
// ============================================================
async function initCartPage() {
    try {
        const data = await fetchAPI('/cart');
        const container = document.querySelector('.cart-table tbody');
        const totalPriceEl = document.querySelector('.total-price');

        if (!data || data.cartItems.length === 0) {
            container.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Giỏ hàng trống</td></tr>';
            totalPriceEl.textContent = '0đ';
            return;
        }

        // Render danh sách
        const html = data.cartItems.map(item => `
            <tr>
                <td>
                    <div class="cart-product-info">
                        <img src="${item.Thumbnail}" alt="Product">
                        <div>
                            <p class="name">${item.Name}</p>
                            <p class="variant">Màu: ${item.Color} / Size: ${item.Size}</p>
                            <p class="price">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.Price)}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="quantity-control small">
                        <button>-</button>
                        <input type="number" value="${item.Quantity}" readonly>
                        <button>+</button>
                    </div>
                </td>
                <td class="subtotal">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.Price * item.Quantity)}</td>
                <td><i class="fa-regular fa-trash-can remove-btn"></i></td>
            </tr>
        `).join('');

        container.innerHTML = html;
        totalPriceEl.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalAmount);

    } catch (error) {
        console.error(error);
    }
}

// ============================================================
// 3. LOGIC TRANG CHECKOUT (checkout.html)
// ============================================================
async function handleCheckout(e) {
    e.preventDefault();

    // 1. Thu thập dữ liệu form
    const fullName = document.querySelector('input[placeholder="Họ và tên người nhận"]').value;
    const phone = document.querySelector('input[placeholder="Số điện thoại"]').value;
    const address = document.querySelector('input[placeholder="Địa chỉ (Số nhà, đường...)"]').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

    const shippingAddress = `${fullName} - ${address}`;

    // 2. Gọi API tạo đơn hàng
    try {
        const res = await fetchAPI('/orders', 'POST', {
            shippingAddress: shippingAddress,
            phone: phone,
            paymentMethod: paymentMethod
        });

        if (res) {
            alert('Đặt hàng thành công! Mã đơn hàng: #' + res.orderId);
            window.location.href = 'index.html'; // Chuyển về trang chủ
        }
    } catch (err) {
        alert('Đặt hàng thất bại: ' + err.message);
    }
}


// ============================================================
// 4. BỘ ĐIỀU HƯỚNG (ROUTER) - CHẠY HÀM THEO TRANG
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // Nếu đang ở trang Chi tiết sản phẩm
    if (path.includes('product-detail.html')) {
        initProductDetail();
        
        // Gắn sự kiện cho nút Thêm vào giỏ
        const addBtn = document.querySelector('.btn-add-cart');
        if (addBtn) addBtn.addEventListener('click', addToCart);
    }

    // Nếu đang ở trang Giỏ hàng
    if (path.includes('cart.html')) {
        initCartPage();
    }

    // Nếu đang ở trang Thanh toán
    if (path.includes('checkout.html')) {
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);
    }
});