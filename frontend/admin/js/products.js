// frontend/admin/js/products.js

let categories = []; // Lưu danh mục để dùng cho dropdown

// 1. KHỞI TẠO
document.addEventListener('DOMContentLoaded', async () => {
    // Check quyền admin (Hàm checkAdminRole từ bài trước, hoặc copy lại)
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'Admin') {
        alert('Truy cập bị từ chối!');
        window.location.href = '../index.html';
        return;
    }

    await loadCategories(); // Tải danh mục trước để điền vào Select box
    loadProducts();         // Tải danh sách sản phẩm
});

// 2. TẢI DANH MỤC (Để điền vào thẻ Select)
async function loadCategories() {
    categories = await fetchAPI('/categories');
    const select = document.getElementById('p-category');
    select.innerHTML = categories.map(c => 
        `<option value="${c.CategoryID}">${c.Name}</option>`
    ).join('');
}

// 3. TẢI SẢN PHẨM
async function loadProducts() {
    const tbody = document.getElementById('product-list');
    tbody.innerHTML = '<tr><td colspan="6">Đang tải...</td></tr>';

    try {
        const products = await fetchAPI('/products'); // Dùng API public cũng được
        
        const html = products.map(p => `
            <tr>
                <td>#${p.ProductID}</td>
                <td><img src="${p.Thumbnail}" width="50" style="border-radius:4px"></td>
                <td>${p.Name}</td>
                <td>${p.CategoryName || 'N/A'}</td>
                <td style="font-weight:bold">${new Intl.NumberFormat('vi-VN').format(p.Price)}đ</td>
                <td>
                    <button onclick='openModal("edit", ${JSON.stringify(p)})' class="btn-sm text-primary">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="deleteProduct(${p.ProductID})" class="btn-sm text-danger" style="margin-left:10px">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

// 4. XỬ LÝ MODAL (Mở/Đóng)
function openModal(mode, product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');

    modal.style.display = 'flex';

    if (mode === 'add') {
        title.textContent = 'Thêm sản phẩm mới';
        form.reset(); // Xóa trắng form
        document.getElementById('product-id').value = '';
        document.getElementById('img-preview').style.display = 'none';
    } else {
        title.textContent = 'Cập nhật sản phẩm';
        // Điền dữ liệu cũ vào form
        document.getElementById('product-id').value = product.ProductID;
        document.getElementById('p-name').value = product.Name;
        document.getElementById('p-category').value = product.CategoryID;
        document.getElementById('p-price').value = product.Price;
        document.getElementById('p-thumbnail').value = product.Thumbnail;
        document.getElementById('p-desc').value = product.Description;
        
        // Hiện ảnh preview
        previewImage(product.Thumbnail);
    }
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

function previewImage(url) {
    const img = document.getElementById('img-preview');
    if (url) {
        img.src = url;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }
}

// 5. LƯU SẢN PHẨM (Create / Update)
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const data = {
        name: document.getElementById('p-name').value,
        categoryId: document.getElementById('p-category').value,
        price: document.getElementById('p-price').value,
        thumbnail: document.getElementById('p-thumbnail').value,
        description: document.getElementById('p-desc').value
    };

    try {
        if (id) {
            // Có ID -> Sửa (PUT)
            await fetchAPI(`/products/${id}`, 'PUT', data);
            alert('Cập nhật thành công!');
        } else {
            // Không ID -> Thêm mới (POST)
            await fetchAPI('/products', 'POST', data);
            alert('Thêm mới thành công!');
        }
        closeModal();
        loadProducts(); // Load lại bảng
    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
});

// 6. XÓA SẢN PHẨM
async function deleteProduct(id) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        try {
            await fetchAPI(`/products/${id}`, 'DELETE');
            loadProducts();
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    }
}

// Close modal khi click ra ngoài
window.onclick = function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target == modal) {
        closeModal();
    }
}