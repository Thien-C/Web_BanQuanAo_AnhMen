// js/main.js

// 1. HÀM TIỆN ÍCH (HELPER)
// Chuyển số thành tiền Việt (Ví dụ: 200000 -> 200.000₫)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// 2. LOGIC TẢI DANH MỤC (Categories)
async function loadCategories() {
    try {
        // Gọi API lấy danh sách
        const categories = await fetchAPI('/categories');
        
        // Tìm khung chứa danh mục trong HTML
        const container = document.querySelector('.category-list');
        if (!container) return;

        // Xóa dữ liệu mẫu cũ (nếu có)
        container.innerHTML = '';

        // Tạo HTML cho từng danh mục
        // Lưu ý: Vì DB chưa có ảnh danh mục, mình dùng ảnh placeholder mặc định
        const html = categories.map(cat => `
            <a href="#" class="cat-item">
                <div class="cat-img">
                    <img src="https://media.coolmate.me/cdn-cgi/image/width=320,quality=80,format=auto/uploads/img/2023/09/21/ao-nam-1.jpg" alt="${cat.Name}">
                </div>
                <span>${cat.Name}</span>
            </a>
        `).join('');

        // Gắn vào giao diện
        container.innerHTML = html;

    } catch (error) {
        console.error('Lỗi tải danh mục:', error);
    }
}

// 3. LOGIC TẢI SẢN PHẨM (Products)
async function loadProducts() {
    try {
        // Gọi API lấy danh sách sản phẩm
        const products = await fetchAPI('/products');

        // Tìm khung chứa sản phẩm (id="product-list" đã tạo ở index.html)
        const container = document.getElementById('product-list');
        if (!container) return;

        // Nếu chưa có sản phẩm nào
        if (products.length === 0) {
            container.innerHTML = '<p>Chưa có sản phẩm nào.</p>';
            return;
        }

        // Tạo HTML Product Card
        const html = products.map(product => {
            // Xử lý ảnh: Nếu DB lưu tên file, ta ghép với đường dẫn (hoặc dùng ảnh mạng nếu là URL full)
            // Ở đây mình check nếu không phải URL thì dùng ảnh placeholder để tránh lỗi ảnh
            let imgSrc = product.Thumbnail;
            if (!imgSrc.startsWith('http')) {
                // Ảnh mặc định nếu link trong DB bị lỗi hoặc là tên file local chưa có
                imgSrc = 'https://media.coolmate.me/cdn-cgi/image/width=672,quality=80,format=auto/uploads/img/2023/11/02/ao-thun-dai-tay-nam-cotton-compact-v2-den-1.jpg';
            }

            return `
            <div class="product-card">
                <div class="product-image">
                    <span class="badge-new">Mới</span>
                    <a href="product-detail.html?id=${product.ProductID}">
                        <img src="${imgSrc}" alt="${product.Name}">
                    </a>
                    <button class="btn-quick-add" onclick="quickAdd(${product.ProductID})">
                        Thêm vào giỏ
                    </button>
                </div>
                <div class="product-info">
                    <div class="color-options">
                        <span class="color-dot" style="background-color: #000;"></span>
                        <span class="color-dot" style="background-color: navy;"></span>
                    </div>
                    <h3 class="product-name">
                        <a href="product-detail.html?id=${product.ProductID}">${product.Name}</a>
                    </h3>
                    <div class="product-price">
                        <span class="price-current">${formatCurrency(product.Price)}</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Gắn vào giao diện
        container.innerHTML = html;

    } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        const container = document.getElementById('product-list');
        if (container) container.innerHTML = '<p style="color:red">Lỗi kết nối Server!</p>';
    }
}

// Hàm thêm nhanh vào giỏ (Sẽ hoàn thiện ở phần sau)
function quickAdd(productId) {
    alert('Vui lòng vào chi tiết sản phẩm để chọn Size/Màu!');
    window.location.href = `product-detail.html?id=${productId}`;
}

// 4. CHẠY KHI TRANG WEB TẢI XONG
document.addEventListener('DOMContentLoaded', () => {
    // 1. Tải dữ liệu từ API
    loadCategories();
    loadProducts();

    // 2. Logic Mobile Menu (Code cũ giữ lại)
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }
});