// frontend/admin/js/products.js

// 1. Kiểm tra quyền
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'Admin') {
        alert("Bạn không có quyền truy cập!");
        window.location.href = '../login.html';
    }
}

// 2. Load Sản phẩm
async function loadProducts() {
    const tbody = document.getElementById('product-list');
    tbody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
    try {
        const products = await fetchAPI('/products');
        
        if(!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Chưa có sản phẩm.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>#${p.ProductID}</td>
                <td><img src="${p.Thumbnail}" width="40" style="border-radius:4px"></td>
                <td>${p.Name}</td>
                <td>${new Intl.NumberFormat('vi-VN').format(p.Price)}đ</td>
                <td>
                    <button onclick='openModal("edit", ${JSON.stringify(p)})' style="color: blue; cursor: pointer; border: none; background: none;">Sửa</button>
                    <button onclick="deleteProduct(${p.ProductID})" style="color: red; cursor: pointer; border: none; background: none; margin-left: 10px;">Xóa</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

// 3. Load Danh mục vào Select
async function loadCategories() {
    try {
        const categories = await fetchAPI('/categories');
        const select = document.getElementById('p-category');
        if (select) {
            select.innerHTML = '<option value="">-- Chọn danh mục --</option>' + 
                categories.map(c => `<option value="${c.CategoryID}">${c.Name}</option>`).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

// 4. Mở Modal
function openModal(mode, product = null) {
    document.getElementById('product-modal').style.display = 'flex';
    document.getElementById('product-form').reset();
    
    if (mode === 'edit' && product) {
        document.getElementById('p-id').value = product.ProductID;
        document.getElementById('p-name').value = product.Name;
        document.getElementById('p-category').value = product.CategoryID; // Tự động chọn đúng danh mục
        document.getElementById('p-price').value = product.Price;
        document.getElementById('p-thumb').value = product.Thumbnail;
        document.getElementById('p-desc').value = product.Description;
    } else {
        document.getElementById('p-id').value = '';
    }
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// 5. Submit Form (Thêm/Sửa)
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('p-id').value;
    
    // Lấy dữ liệu chuẩn
    const data = {
        name: document.getElementById('p-name').value,
        categoryId: parseInt(document.getElementById('p-category').value), // Phải là số
        price: parseFloat(document.getElementById('p-price').value),       // Phải là số
        thumbnail: document.getElementById('p-thumb').value,
        description: document.getElementById('p-desc').value
    };

    if(!data.categoryId) {
        alert("Vui lòng chọn danh mục!");
        return;
    }

    try {
        if (id) {
            await fetchAPI(`/products/${id}`, 'PUT', data);
            alert('Cập nhật thành công!');
        } else {
            await fetchAPI('/products', 'POST', data);
            alert('Thêm mới thành công!');
        }
        closeModal();
        loadProducts();
    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
});

// 6. Xóa
async function deleteProduct(id) {
    if(confirm('Xóa sản phẩm này?')) {
        try {
            await fetchAPI(`/products/${id}`, 'DELETE');
            loadProducts();
        } catch (err) {
            alert(err.message);
        }
    }
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCategories();
    loadProducts();
});