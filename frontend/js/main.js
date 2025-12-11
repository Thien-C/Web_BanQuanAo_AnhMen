// frontend/js/main.js

// 1. BIẾN TOÀN CỤC LƯU TRẠNG THÁI LỌC
let currentFilters = {
    keyword: '',
    category: 'all',
    sort: 'newest'
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// 2. LOGIC TẢI DANH MỤC (Render vào cả Sidebar và Menu)
async function loadCategories() {
    try {
        const categories = await fetchAPI('/categories');
        
        // A. Render vào Sidebar Filter (MỚI)
        const filterContainer = document.getElementById('category-filter');
        if (filterContainer) {
            // Mục "Tất cả" mặc định
            let html = `<li><label><input type="radio" name="cat-filter" value="all" checked onchange="handleFilter()"> Tất cả</label></li>`;
            
            // Các danh mục từ API
            html += categories.map(cat => `
                <li>
                    <label>
                        <input type="radio" name="cat-filter" value="${cat.CategoryID}" onchange="handleFilter()"> 
                        ${cat.Name}
                    </label>
                </li>
            `).join('');
            filterContainer.innerHTML = html;
        }

    } catch (error) {
        console.error('Lỗi tải danh mục:', error);
    }
}

// 3. HÀM GỌI API LẤY SẢN PHẨM (Có tham số lọc)
async function loadProducts() {
    const container = document.getElementById('product-list');
    if (!container) return;

    container.innerHTML = '<p>Đang tải dữ liệu...</p>';

    try {
        // Tạo Query String: ?keyword=...&category=...&sort=...
        const params = new URLSearchParams();
        if (currentFilters.keyword) params.append('keyword', currentFilters.keyword);
        if (currentFilters.category !== 'all') params.append('category', currentFilters.category);
        params.append('sort', currentFilters.sort);

        const url = `/products?${params.toString()}`;
        const products = await fetchAPI(url);

        // Hiển thị thông báo kết quả tìm kiếm
        const searchLabel = document.getElementById('search-result-label');
        if (searchLabel) {
            if (currentFilters.keyword) {
                searchLabel.style.display = 'block';
                searchLabel.innerText = `Kết quả tìm kiếm: "${currentFilters.keyword}" (${products.length} sản phẩm)`;
            } else {
                searchLabel.style.display = 'none';
            }
        }

        // Nếu không có sản phẩm
        if (products.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fa-solid fa-box-open" style="font-size: 40px; color: #ccc;"></i>
                    <p style="margin-top: 10px;">Không tìm thấy sản phẩm nào phù hợp.</p>
                    <button class="btn btn-primary" onclick="resetFilters()">Xem tất cả</button>
                </div>`;
            return;
        }

        // Render HTML Card Sản phẩm
        const html = products.map(product => {
            let imgSrc = product.Thumbnail;
            // Xử lý ảnh lỗi/ảnh demo
            if (!imgSrc || !imgSrc.startsWith('http')) {
                imgSrc = 'https://media.coolmate.me/cdn-cgi/image/width=672,quality=80,format=auto/uploads/img/2023/11/02/ao-thun-dai-tay-nam-cotton-compact-v2-den-1.jpg';
            }

            return `
            <div class="product-card">
                <div class="product-image">
                    <a href="product-detail.html?id=${product.ProductID}">
                        <img src="${imgSrc}" alt="${product.Name}">
                    </a>
                    <button class="btn-quick-add" onclick="window.location.href='product-detail.html?id=${product.ProductID}'">
                        Xem chi tiết
                    </button>
                </div>
                <div class="product-info">
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

        container.innerHTML = html;

    } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        container.innerHTML = '<p style="color:red">Lỗi kết nối Server!</p>';
    }
}

// 4. XỬ LÝ SỰ KIỆN LỌC (Khi chọn Danh mục hoặc Sắp xếp)
function handleFilter() {
    // Lấy category từ radio button đang check
    const catRadio = document.querySelector('input[name="cat-filter"]:checked');
    currentFilters.category = catRadio ? catRadio.value : 'all';

    // Lấy sort từ select box
    const sortSelect = document.getElementById('sort-filter');
    currentFilters.sort = sortSelect ? sortSelect.value : 'newest';

    loadProducts(); // Gọi lại API
}

// 5. XỬ LÝ TÌM KIẾM (Khi nhấn Enter ở ô tìm kiếm)
function handleSearch(e) {
    if (e.key === 'Enter') {
        currentFilters.keyword = e.target.value.trim();
        
        // Reset danh mục về tất cả để tìm rộng hơn
        currentFilters.category = 'all';
        const allRadio = document.querySelector('input[name="cat-filter"][value="all"]');
        if (allRadio) allRadio.checked = true;

        loadProducts();
        
        // Cuộn màn hình xuống phần sản phẩm
        document.getElementById('shop-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// 6. RESET BỘ LỌC
function resetFilters() {
    currentFilters = { keyword: '', category: 'all', sort: 'newest' };
    
    // Reset UI
    const allRadio = document.querySelector('input[name="cat-filter"][value="all"]');
    if(allRadio) allRadio.checked = true;
    
    const sortSelect = document.getElementById('sort-filter');
    if(sortSelect) sortSelect.value = 'newest';
    
    const searchInput = document.querySelector('.header-actions input');
    if(searchInput) searchInput.value = '';

    loadProducts();
}

// 7. KHỞI CHẠY
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();

    // Biến icon kính lúp thành ô nhập liệu (nếu chưa có)
    const searchIcon = document.querySelector('.fa-magnifying-glass');
    if (searchIcon && searchIcon.parentElement) {
        searchIcon.parentElement.innerHTML = `
            <input type="text" placeholder="Tìm kiếm..." 
            style="border: none; border-bottom: 1px solid #ccc; outline: none; padding: 5px; font-size: 14px;" 
            onkeypress="handleSearch(event)">
        `;
    }
});