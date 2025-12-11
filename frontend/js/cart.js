// frontend/js/cart.js

// Hàm format tiền tệ
const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// Biến toàn cục lưu danh sách biến thể của sản phẩm đang xem (được gán từ main.js hoặc initProductDetail)
// Nếu bạn tách file thì cần đảm bảo biến này có dữ liệu
// Ở đây ta giả định initProductDetail đã chạy và gán currentProductVariants

// ============================================================
// 1. LOGIC TRANG CHI TIẾT SẢN PHẨM (product-detail.html)
// ============================================================

// Hàm này thay thế hàm addToCart cũ (Không gọi API nữa)
function addToCart() {
    // 1. Kiểm tra biến thể hiện tại (được load từ logic chi tiết sản phẩm)
    // Lưu ý: Đảm bảo biến currentProductVariants đã có dữ liệu từ hàm initProductDetail
    if (typeof currentProductVariants === 'undefined' || currentProductVariants.length === 0) {
        // Nếu biến này chưa có, có thể do chưa load xong hoặc lỗi scope. 
        // Tuy nhiên với cấu trúc file hiện tại, ta sẽ lấy thông tin từ giao diện.
    }

    // 2. Lấy Màu và Size đang chọn từ giao diện
    const selectedColorBtn = document.querySelector('.color-btn.selected');
    const selectedSizeBtn = document.querySelector('.size-btn.selected');
    const quantityInput = document.querySelector('.quantity-control input');

    if (!selectedColorBtn || !selectedSizeBtn) {
        alert('Vui lòng chọn đầy đủ Màu sắc và Kích thước!');
        return;
    }

    const color = selectedColorBtn.getAttribute('data-color');
    const size = selectedSizeBtn.getAttribute('data-size');
    const quantity = parseInt(quantityInput.value) || 1;

    // 3. Lấy thông tin sản phẩm từ giao diện (DOM)
    const productName = document.querySelector('.pd-title').innerText;
    const productPriceStr = document.querySelector('.current-price').innerText;
    const productPrice = parseInt(productPriceStr.replace(/\D/g, '')); // Xóa chữ 'đ' và dấu chấm
    const productImg = document.getElementById('main-image').src;

    // Tìm VariantID (nếu có biến global) hoặc tạo ID giả định nếu chỉ test UI
    let variantId = 0;
    if (typeof currentProductVariants !== 'undefined') {
        const variant = currentProductVariants.find(v => v.Color === color && v.Size === size);
        if (variant) variantId = variant.VariantID;
    }
    // Nếu không tìm thấy variantId (do chưa load API), có thể chặn hoặc để 0
    if (variantId === 0) {
        console.warn("Không tìm thấy VariantID, sử dụng ID tạm.");
    }

    // 4. Tạo object sản phẩm
    const newItem = {
        variantId: variantId,
        name: productName,
        thumbnail: productImg,
        price: productPrice,
        color: color,
        size: size,
        quantity: quantity
    };

    // 5. Lưu vào LocalStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Kiểm tra trùng sản phẩm (cùng ID, màu, size) thì cộng dồn
    const existingItem = cart.find(i => 
        (i.variantId === newItem.variantId && i.variantId !== 0) || 
        (i.name === newItem.name && i.color === newItem.color && i.size === newItem.size)
    );

    if (existingItem) {
        existingItem.quantity += newItem.quantity;
    } else {
        cart.push(newItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    
    alert("Đã thêm vào giỏ hàng thành công!");
    updateCartCount(); // Cập nhật icon giỏ hàng
}

// ============================================================
// 2. LOGIC TRANG GIỎ HÀNG (cart.html)
// ============================================================
function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.querySelector('.cart-table tbody');
    const totalPriceEl = document.querySelector('.total-price');
    const subTotalEl = document.querySelector('.summary-row span:last-child');

    if (!container) return; // Không phải trang cart thì thoát

    if (cart.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Giỏ hàng trống!</td></tr>';
        if(totalPriceEl) totalPriceEl.innerText = '0đ';
        if(subTotalEl) subTotalEl.innerText = '0đ';
        return;
    }

    let total = 0;
    const html = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        // Xử lý ảnh mặc định nếu link ảnh lỗi
        const imgSrc = item.thumbnail || 'https://via.placeholder.com/90x120';

        return `
        <tr>
            <td style="width: 50%;">
                <div class="cart-product-info">
                    <img src="${imgSrc}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/90x120'">
                    <div>
                        <p class="name">${item.name}</p>
                        <p class="variant">Màu: ${item.color} / Size: ${item.size}</p>
                        <p class="price">${formatMoney(item.price)}</p>
                    </div>
                </div>
            </td>
            <td>
                <div class="quantity-control small">
                    <button onclick="updateQuantity(${index}, -1)">-</button>
                    <input type="text" value="${item.quantity}" readonly>
                    <button onclick="updateQuantity(${index}, 1)">+</button>
                </div>
            </td>
            <td class="subtotal">${formatMoney(itemTotal)}</td>
            <td style="text-align: right;">
                <i class="fa-regular fa-trash-can remove-btn" onclick="removeCartItem(${index})" title="Xóa sản phẩm"></i>
            </td>
        </tr>
        `;
    }).join('');

    container.innerHTML = html;
    if(totalPriceEl) totalPriceEl.innerText = formatMoney(total);
    if(subTotalEl) subTotalEl.innerText = formatMoney(total);
}

function updateQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity += change;
    if (cart[index].quantity < 1) cart[index].quantity = 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartCount();
}

function removeCartItem(index) {
    if(!confirm("Xóa sản phẩm này?")) return;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    updateCartCount();
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const countEls = document.querySelectorAll('.cart-count');
    countEls.forEach(el => el.innerText = cart.length);
}

// ============================================================
// 3. KHỞI CHẠY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Nếu ở trang chi tiết sản phẩm -> Gắn sự kiện nút Mua
    const addBtn = document.querySelector('.btn-add-cart');
    if (addBtn) {
        // Xóa các event cũ (nếu có) bằng cách clone node hoặc gán lại
        // Đơn giản nhất là gán onclick trực tiếp để ghi đè logic cũ
        addBtn.onclick = addToCart;
    }

    // Nếu ở trang giỏ hàng -> Load giỏ
    if (document.querySelector('.cart-table')) {
        loadCart();
    }

    // Luôn cập nhật số lượng icon header
    updateCartCount();
    
    // Gọi hàm initProductDetail cũ (để lấy dữ liệu variant từ API về)
    if (typeof initProductDetail === 'function' && window.location.pathname.includes('product-detail.html')) {
        initProductDetail();
    }
});