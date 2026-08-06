const API = 'http://localhost:3000';
let isAdminUser = false;
let orderFilterState = 'in-process';
let activeQuickViewProduct = null;
let quickViewQuantity = 1;

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 220);
    }, 2600);
}

let shopProducts = [];
let shopActiveCategory = 'All';
let shopSearchTerm = '';

function initHomePage() {
    const featuredGrid = document.getElementById('featuredGrid');
    const arrivalGrid = document.getElementById('arrivalGrid');
    const brandGrid = document.getElementById('brandGrid');

    if (!featuredGrid && !arrivalGrid && !brandGrid) return;

    updateCartCount();
    loadHomeProducts();
    loadHomeBrands();
}

function initShopPage() {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;

    updateCartCount();
    loadShopProducts();
}

function initProductPage() {
    const productShell = document.getElementById('productDetailsShell');
    if (!productShell) return;

    updateCartCount();
    loadProductDetails();
}

function initCartPage() {
    const cartItems = document.getElementById('cartItems');
    const summaryPanel = document.getElementById('cartSummary');
    if (!cartItems && !summaryPanel) return;

    updateCartCount();
    loadCart();
    renderRecommendedProducts();
}

function initCheckoutPage() {
    const checkoutRoot = document.getElementById('checkoutSummary') || document.getElementById('delivery_name') || document.getElementById('checkoutRoot');
    if (!checkoutRoot) return;

    updateCartCount();
    renderCheckoutSummary();
    loadCartDeliveryDetails();
}

function initAdminPage() {
    const adminRoot = document.getElementById('adminProducts') || document.getElementById('adminBrands') || document.getElementById('adminUsers') || document.getElementById('statsGrid');
    if (!adminRoot) return;

    populateBrandSelect();
    loadAdminDashboardData();
}

async function loadHomeProducts() {
    const featuredGrid = document.getElementById('featuredGrid');
    const arrivalGrid = document.getElementById('arrivalGrid');

    if (!featuredGrid && !arrivalGrid) return;

    try {
        const response = await fetch(`${API}/products`);
        const products = await response.json();

        const featuredProducts = (products || []).filter(product => product.featured || product.best_seller || product.new_arrival).slice(0, 4);
        const bestSellers = (products || []).filter(product => product.best_seller || product.featured).slice(0, 4);

        if (featuredGrid) {
            renderProductCards(featuredGrid, featuredProducts.length ? featuredProducts : (products || []).slice(0, 4));
        }

        if (arrivalGrid) {
            renderProductCards(arrivalGrid, bestSellers.length ? bestSellers : (products || []).slice(4, 8));
        }
    } catch (error) {
        console.log('Home products error', error);
    }
}

async function loadHomeBrands() {
    const brandGrid = document.getElementById('brandGrid');
    if (!brandGrid) return;

    try {
        const response = await fetch(`${API}/brands`);
        const brands = await response.json();
        brandGrid.innerHTML = '';

        (brands || []).slice(0, 6).forEach(brand => {
            const image = brand.brand_image || brand.logo_url || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80';
            brandGrid.innerHTML += `
                <article class="brand-card">
                    <div class="brand-image">
                        <img src="${image}" alt="${escapeHtml(brand.brand_name || brand.name || 'Brand')}" />
                    </div>
                    <h3>${escapeHtml(brand.brand_name || brand.name || 'Brand')}</h3>
                    <p>${escapeHtml(brand.brand_story || brand.description || 'Premium essentials crafted for modern wardrobes.')}</p>
                </article>
            `;
        });
    } catch (error) {
        console.log('Home brands error', error);
    }
}

function renderProductCards(container, products) {
    if (!container) return;
    container.innerHTML = '';

    if (!products || !products.length) {
        container.innerHTML = '<p class="section-subtle">Products will appear here soon.</p>';
        return;
    }

    products.forEach(product => {
        const image = product.images || product.image_url || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80';
        const salePrice = Number(product.final_price ?? product.sale_price ?? product.price ?? 0);
        const oldPrice = Number(product.price ?? 0);
        const showOld = oldPrice > salePrice;
        const label = product.best_seller ? 'Best Seller' : product.featured ? 'Featured' : product.new_arrival ? 'New Arrival' : 'Signature';
        const productId = product.product_id || product.id;
        container.innerHTML += `
            <article class="product-card home-product-card">
                <div class="product-media">
                    <img src="${image}" alt="${escapeHtml(product.name)}" />
                    <span class="product-badge">${escapeHtml(label)}</span>
                    <div class="product-actions">
                        <button class="action-button" onclick="window.location.href='product.html?id=${productId}'" aria-label="View details">🔎</button>
                        <button class="action-button" onclick="openQuickView(${JSON.stringify(product).replace(/'/g, "&#39;")})" aria-label="Quick view">👁</button>
                        <button class="action-button" onclick="addToCart(${productId}, '${escapeHtml(product.name)}', ${salePrice})" aria-label="Add to cart">🛒</button>
                    </div>
                </div>
                <div class="product-meta">
                    <span class="product-tag">${escapeHtml(product.brand_name || 'DIDOXX')}</span>
                    <h3 class="product-title">${escapeHtml(product.name)}</h3>
                    <p class="product-brand">${escapeHtml(product.description ? product.description.substring(0, 90) : 'Premium fashion essentials for the modern wardrobe')}</p>
                    <div class="product-price">
                        <span>$${salePrice.toFixed(2)}</span>
                        ${showOld ? `<span class="price-old">$${oldPrice.toFixed(2)}</span>` : ''}
                    </div>
                </div>
            </article>
        `;
    });
}

async function loadShopProducts() {
    const productGrid = document.getElementById('productGrid');
    const resultsMeta = document.getElementById('shopResultsMeta');
    if (!productGrid) return;

    try {
        const response = await fetch(`${API}/products`);
        const products = await response.json();
        shopProducts = Array.isArray(products) ? products : [];

        if (resultsMeta) {
            resultsMeta.textContent = `${shopProducts.length} pieces available`;
        }

        filterShopProducts();
    } catch (error) {
        console.log('Shop products error', error);
        if (productGrid) productGrid.innerHTML = '<p class="section-subtle">The collection is unavailable right now.</p>';
    }
}

function filterShopProducts() {
    const productGrid = document.getElementById('productGrid');
    const resultsMeta = document.getElementById('shopResultsMeta');
    const searchInput = document.getElementById('shopSearch');
    const sortSelect = document.getElementById('sortSelect');

    if (!productGrid) return;

    shopSearchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const sortValue = sortSelect ? sortSelect.value : 'newest';

    let filtered = [...shopProducts];

    if (shopActiveCategory && shopActiveCategory !== 'All') {
        filtered = filtered.filter(product => {
            const categoryName = (product.category || product.category_id || '').toString().toLowerCase();
            return categoryName.includes(shopActiveCategory.toLowerCase()) || (product.name || '').toLowerCase().includes(shopActiveCategory.toLowerCase());
        });
    }

    if (shopSearchTerm) {
        filtered = filtered.filter(product => {
            const text = `${product.name || ''} ${product.description || ''} ${product.brand_name || ''}`.toLowerCase();
            return text.includes(shopSearchTerm);
        });
    }

    switch (sortValue) {
        case 'price-asc':
            filtered.sort((a, b) => Number(a.final_price ?? a.sale_price ?? a.price ?? 0) - Number(b.final_price ?? b.sale_price ?? b.price ?? 0));
            break;
        case 'price-desc':
            filtered.sort((a, b) => Number(b.final_price ?? b.sale_price ?? b.price ?? 0) - Number(a.final_price ?? a.sale_price ?? a.price ?? 0));
            break;
        case 'popularity':
            filtered.sort((a, b) => Number(b.best_seller ? 1 : 0) - Number(a.best_seller ? 1 : 0));
            break;
        default:
            filtered.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
            break;
    }

    if (resultsMeta) {
        resultsMeta.textContent = `${filtered.length} pieces available`;
    }

    renderProductCards(productGrid, filtered);
}

function selectShopCategory(category, element) {
    shopActiveCategory = category;
    const buttons = document.querySelectorAll('#categoryFilters .filter-pill');
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.category === category));
    filterShopProducts();
}

function openQuickView(product) {
    const modal = document.getElementById('quickViewModal');
    const image = document.getElementById('quickViewImage');
    const label = document.getElementById('quickViewLabel');
    const title = document.getElementById('quickViewTitle');
    const brand = document.getElementById('quickViewBrand');
    const price = document.getElementById('quickViewPrice');
    const oldPrice = document.getElementById('quickViewOldPrice');
    const description = document.getElementById('quickViewDescription');
    const sizes = document.getElementById('quickViewSizes');
    const colors = document.getElementById('quickViewColors');
    const addButton = document.getElementById('quickViewAddButton');
    const wishlistButton = document.getElementById('quickViewWishlistButton');

    if (!modal || !product) return;

    activeQuickViewProduct = product;
    quickViewQuantity = 1;
    document.getElementById('quickViewQuantity').textContent = quickViewQuantity;

    image.src = product.images || product.image_url || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80';
    image.alt = product.name;
    label.textContent = product.best_seller ? 'Best Seller' : product.featured ? 'Featured' : 'Signature';
    title.textContent = product.name;
    brand.textContent = product.brand_name || 'DIDOXX';
    const salePrice = Number(product.final_price ?? product.sale_price ?? product.price ?? 0);
    const oldValue = Number(product.price ?? 0);
    price.textContent = `$${salePrice.toFixed(2)}`;
    oldPrice.textContent = oldValue > salePrice ? `$${oldValue.toFixed(2)}` : '';
    description.textContent = product.description || 'Premium essentials designed for a refined wardrobe.';

    const sizeOptions = (product.sizes || product.size || 'S,M,L,XL').toString().split(',');
    const colorOptions = (product.colors || product.color || 'Black,White,Stone').toString().split(',');
    sizes.innerHTML = sizeOptions.map(size => `<button class="selector-pill">${escapeHtml(size.trim())}</button>`).join('');
    colors.innerHTML = colorOptions.map(color => `<button class="selector-pill">${escapeHtml(color.trim())}</button>`).join('');

    addButton.onclick = () => {
        addToCart(product.product_id || product.id, product.name, salePrice);
        closeQuickView();
    };

    wishlistButton.onclick = () => {
        alert(`${product.name} added to wishlist.`);
        closeQuickView();
    };

    modal.classList.add('active');
}

function closeQuickView(event) {
    if (event && event.stopPropagation) event.stopPropagation();
    const modal = document.getElementById('quickViewModal');
    if (modal) modal.classList.remove('active');
}

function getSelectedProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadProductDetails() {
    const shell = document.getElementById('productDetailsShell');
    if (!shell) return;

    const productId = getSelectedProductId();
    if (!productId) {
        shell.innerHTML = '<div class="section-block"><p class="section-subtle">Select a product to view details.</p></div>';
        return;
    }

    try {
        const response = await fetch(`${API}/products`);
        const products = await response.json();
        const product = (products || []).find(item => String(item.product_id || item.id) === String(productId));
        if (!product) {
            shell.innerHTML = '<div class="section-block"><p class="section-subtle">This product is unavailable right now.</p></div>';
            return;
        }

        const image = product.images || product.image_url || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80';
        const salePrice = Number(product.final_price ?? product.sale_price ?? product.price ?? 0);
        const oldPrice = Number(product.price ?? 0);
        const sizes = (product.sizes || product.size || 'S,M,L,XL').toString().split(',');
        const colors = (product.colors || product.color || 'Black,White,Stone').toString().split(',');
        shell.innerHTML = `
            <section class="section-block product-detail-shell">
                <div class="product-media-card">
                    <img src="${image}" alt="${escapeHtml(product.name)}" />
                </div>
                <div class="product-detail-card">
                    <p class="product-tag">${escapeHtml(product.brand_name || 'DIDOXX')}</p>
                    <h1>${escapeHtml(product.name)}</h1>
                    <p class="section-subtle">${escapeHtml(product.description || 'Premium fashion essentials for the modern wardrobe.')}</p>
                    <div class="price-row">
                        <span class="price-current">$${salePrice.toFixed(2)}</span>
                        ${oldPrice > salePrice ? `<span class="price-old">$${oldPrice.toFixed(2)}</span>` : ''}
                    </div>
                    <div class="selector-group">
                        <label>Sizes</label>
                        <div class="selector-list">${sizes.map(size => `<button class="selector-pill">${escapeHtml(size.trim())}</button>`).join('')}</div>
                    </div>
                    <div class="selector-group">
                        <label>Colors</label>
                        <div class="selector-list">${colors.map(color => `<button class="selector-pill">${escapeHtml(color.trim())}</button>`).join('')}</div>
                    </div>
                    <div class="hero-actions">
                        <button class="button btn-primary" onclick="addToCart(${product.product_id || product.id}, '${escapeHtml(product.name)}', ${salePrice}); showToast('Added to cart');">Add to Cart</button>
                        <button class="button secondary" onclick="showToast('Saved to wishlist')">Save</button>
                    </div>
                    <div class="spec-grid">
                        <div><strong>Brand</strong><span>${escapeHtml(product.brand_name || 'DIDOXX')}</span></div>
                        <div><strong>Stock</strong><span>${product.stock ?? 'Available'}</span></div>
                        <div><strong>Delivery</strong><span>Express shipping</span></div>
                    </div>
                </div>
            </section>
        `;

        const related = (products || []).filter(item => String(item.product_id || item.id) !== String(productId)).slice(0, 4);
        const relatedTarget = document.getElementById('relatedProducts');
        if (relatedTarget) {
            renderProductCards(relatedTarget, related);
        }
    } catch (error) {
        console.log('Product details error', error);
    }
}

function renderRecommendedProducts() {
    const container = document.getElementById('recommendedProducts');
    if (!container) return;

    fetch(`${API}/products`).then(res => res.json()).then(products => {
        const list = (products || []).slice(0, 4);
        renderProductCards(container, list);
    }).catch(() => {});
}

function renderCheckoutSummary() {
    const container = document.getElementById('checkoutSummary');
    if (!container) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    const shipping = subtotal > 0 ? 24 : 0;
    const discount = 0;
    const total = subtotal + shipping - discount;
    container.innerHTML = `
        <div class="cart-summary">
            <h3>Order Summary</h3>
            ${cart.length ? cart.map(item => `<div class="summary-line"><span>${escapeHtml(item.name)} × ${item.quantity}</span><strong>$${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</strong></div>`).join('') : '<p class="section-subtle">Your bag is empty.</p>'}
            <div class="summary-line"><span>Shipping</span><strong>$${shipping.toFixed(2)}</strong></div>
            <div class="summary-line"><span>Discount</span><strong>-$${discount.toFixed(2)}</strong></div>
            <div class="summary-total"><span>Total</span><strong>$${total.toFixed(2)}</strong></div>
        </div>
    `;
}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve('');
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

let editingProductId = null;

function resetProductForm() {
    editingProductId = null;
    ['product_name', 'admin_product_name', 'category', 'admin_category', 'price', 'admin_price', 'discount', 'admin_discount', 'stock', 'admin_stock', 'sizes', 'admin_sizes', 'colors', 'admin_colors', 'collection', 'admin_collection', 'brand_id', 'admin_brand_id', 'product_image', 'admin_product_image'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.type === 'file') {
                el.value = '';
            } else if (el.tagName === 'SELECT') {
                el.value = '';
            } else {
                el.value = '';
            }
        }
    });
}

async function addProduct() {
    const nameEl = document.getElementById('product_name') || document.getElementById('admin_product_name');
    const categoryEl = document.getElementById('category') || document.getElementById('admin_category');
    const priceEl = document.getElementById('price') || document.getElementById('admin_price');
    const discountEl = document.getElementById('discount') || document.getElementById('admin_discount');
    const stockEl = document.getElementById('stock') || document.getElementById('admin_stock');
    const sizesEl = document.getElementById('sizes') || document.getElementById('admin_sizes');
    const colorsEl = document.getElementById('colors') || document.getElementById('admin_colors');
    const collectionEl = document.getElementById('collection') || document.getElementById('admin_collection');
    const brandEl = document.getElementById('brand_id') || document.getElementById('admin_brand_id');
    const imageEl = document.getElementById('product_image') || document.getElementById('admin_product_image');

    const name = nameEl?.value?.trim() || '';
    const category = categoryEl?.value?.trim() || '';
    const price = Number(priceEl?.value || 0);
    const discount = Number(discountEl?.value || 0);
    const stock = Number(stockEl?.value || 0);
    const sizes = sizesEl?.value?.trim() || '';
    const colors = colorsEl?.value?.trim() || '';
    const collection = collectionEl?.value?.trim() || '';
    const brandId = brandEl?.value || '';
    const imageData = imageEl && imageEl.files && imageEl.files[0] ? await readImageFile(imageEl.files[0]) : '';

    if (!name) return showToast('Please enter a product name');

    const payload = {
        name,
        brand_id: brandId || null,
        category,
        description: collection || 'Luxury fashion essential',
        price,
        final_price: price - (price * discount / 100),
        stock,
        sizes,
        colors,
        image_url: imageData || '',
        images: imageData ? [imageData] : [],
        featured: collection.toLowerCase().includes('featured') ? 1 : 0,
        new_arrival: collection.toLowerCase().includes('new') ? 1 : 0,
        best_seller: collection.toLowerCase().includes('best') ? 1 : 0
    };

    try {
        const endpoint = editingProductId ? `${API}/updateproduct/${editingProductId}` : `${API}/addproduct`;
        const method = editingProductId ? 'PUT' : 'POST';
        const response = await fetch(endpoint, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const text = await response.text();
        showToast(text || (editingProductId ? 'Product updated' : 'Product added'));
        resetProductForm();
        if (typeof loadAdminProducts === 'function') loadAdminProducts();
        if (typeof loadAdminDashboardData === 'function') loadAdminDashboardData();
    } catch (error) {
        console.log('Add product error', error);
    }
}

function updateProduct() {
    addProduct();
}

function cancelProductEdit() {
    resetProductForm();
}

async function loadAdminProducts() {
    const container = document.getElementById('adminProducts');
    if (!container) return;

    try {
        const res = await fetch(`${API}/products`);
        const products = await res.json();
        container.innerHTML = '';
        (products || []).forEach(product => {
            const productId = product.product_id || product.id;
            container.innerHTML += `
                <article class="admin-card">
                    <h3>${escapeHtml(product.name)}</h3>
                    <p>${escapeHtml(product.description || '')}</p>
                    <p>Price: $${Number(product.final_price ?? product.sale_price ?? product.price ?? 0).toFixed(2)}</p>
                    <div class="hero-actions">
                        <button class="button secondary" onclick="editingProductId=${productId}; document.getElementById('product_name').value='${escapeHtml(product.name)}';">Edit</button>
                        <button class="button" onclick="deleteProduct(${productId})">Delete</button>
                    </div>
                </article>
            `;
        });
    } catch (error) {
        console.log('loadAdminProducts error', error);
    }
}

async function deleteProduct(id) {
    if (!confirm('Delete product?')) return;
    try {
        await fetch(`${API}/deleteproduct/${id}`, { method: 'DELETE', credentials: 'include' });
        showToast('Product deleted');
        loadAdminProducts();
    } catch (error) {
        console.log('deleteProduct error', error);
    }
}

async function addBrand() {
    const nameEl = document.getElementById('admin_brand_name') || document.getElementById('brand_name');
    const name = nameEl?.value?.trim() || '';
    if (!name) return showToast('Please enter a brand name');

    try {
        const response = await fetch(`${API}/addbrand`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand_name: name, brand_story: 'Premium brand', logo_url: '' })
        });
        const text = await response.text();
        showToast(text || 'Brand added');
        if (typeof loadAdminBrands === 'function') loadAdminBrands();
    } catch (error) {
        console.log('Add brand error', error);
    }
}

function updateBrand() {
    addBrand();
}

function cancelBrandEdit() {
    const brandName = document.getElementById('admin_brand_name') || document.getElementById('brand_name');
    if (brandName) brandName.value = '';
}

async function loadAdminBrands() {
    const container = document.getElementById('adminBrands');
    if (!container) return;

    try {
        const res = await fetch(`${API}/brands`);
        const brands = await res.json();
        container.innerHTML = '';
        (brands || []).forEach(brand => {
            container.innerHTML += `
                <article class="admin-card">
                    <h3>${escapeHtml(brand.brand_name || brand.name)}</h3>
                    <p>${escapeHtml(brand.brand_story || brand.description || '')}</p>
                </article>
            `;
        });
    } catch (error) {
        console.log('loadAdminBrands error', error);
    }
}

async function populateBrandSelect() {
    const select = document.getElementById('brand_id') || document.getElementById('admin_brand_id');
    if (!select) return;

    try {
        const response = await fetch(`${API}/brands`);
        const brands = await response.json();
        const options = ['<option value="">Select Brand</option>'];
        (brands || []).forEach(brand => {
            options.push(`<option value="${brand.brand_id || brand.id}">${escapeHtml(brand.brand_name || brand.name || 'Brand')}</option>`);
        });
        select.innerHTML = options.join('');
    } catch (error) {
        console.log('Brand select error', error);
    }
}

async function loadAdminDashboardData() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    try {
        const [productsRes, brandsRes, usersRes] = await Promise.all([
            fetch(`${API}/products`),
            fetch(`${API}/brands`),
            fetch(`${API}/customers`, { credentials: 'include' })
        ]);

        const products = await productsRes.json();
        const brands = await brandsRes.json();
        const users = await usersRes.json();
        const revenue = (products || []).reduce((sum, p) => sum + Number(p.final_price ?? p.sale_price ?? p.price ?? 0), 0);
        statsGrid.innerHTML = `
            <article class="stat-card"><h3>Revenue</h3><p>$${revenue.toFixed(2)}</p></article>
            <article class="stat-card"><h3>Products</h3><p>${(products || []).length}</p></article>
            <article class="stat-card"><h3>Brands</h3><p>${(brands || []).length}</p></article>
            <article class="stat-card"><h3>Customers</h3><p>${(users || []).length}</p></article>
        `;
    } catch (error) {
        console.log('Admin dashboard error', error);
    }
}

function adjustQuickViewQuantity(delta) {
    const quantityNode = document.getElementById('quickViewQuantity');
    if (!quantityNode) return;
    quickViewQuantity = Math.max(1, quickViewQuantity + delta);
    quantityNode.textContent = quickViewQuantity;
}

function setOrderFilter(filter) {
    orderFilterState = filter;
    updateOrderFilterButtons();
    loadOrders();
}

function updateOrderFilterButtons() {
    const inProcessBtn = document.getElementById('filterInProcess');
    const deliveredBtn = document.getElementById('filterDelivered');
    if (inProcessBtn) inProcessBtn.classList.toggle('active', orderFilterState === 'in-process');
    if (deliveredBtn) deliveredBtn.classList.toggle('active', orderFilterState === 'delivered');
}


// ======================================
// LOAD ALL FOODS
// ======================================

async function loadFoods() {

    const foodList =
        document.getElementById(
            'foodList'
        );

    if (!foodList) return;


    try {

        const response =
            await fetch(`${API}/foods`);

        const foods =
            await response.json();

        foodList.innerHTML = '';


        foods.forEach(food => {

            const deleteBtn = isAdminUser ? `<button class="order-btn btn-delete" onclick="deleteFood(${food.food_id})">Delete</button>` : '';

            foodList.innerHTML += `

            <div class="food-card">
                <span class="tag ${(food.category || '').toLowerCase().includes('non') ? 'tag-nonveg' : ((food.category || '').toLowerCase().includes('veg') ? 'tag-veg' : 'tag-dessert')}">${food.category || ''}</span>
                <div class="food-image-wrapper">
                    <img src="${food.food_image}" class="food-image">
                    <div class="time-badge">⏱ ${food.delivery_time || '20 mins'}</div>
                </div>
                <div class="food-card-content">
                    <div class="restaurant-name">${food.restaurant_name || 'THE GOLDEN DRAGON'}</div>
                    <div class="food-name">${food.food_name}</div>
                    <div class="food-footer">
                        <div class="food-price">₹${food.price}</div>
                        <button class="order-btn" onclick="addToCart(${food.food_id}, '${food.food_name}', ${food.price})">🛒 Add to Cart</button>
                        ${deleteBtn}
                    </div>
                </div>
            </div>
            `;

        });

    }
    catch (error) {

        console.log(error);

    }

}


// ======================================
// DYNAMIC CART COUNT BADGE
// ======================================

function updateCartCount() {
    const cartNavLink = document.querySelector('nav a[href="bag.html"]');
    if (!cartNavLink) return;

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (count > 0) {
        cartNavLink.innerHTML = `🛒 Cart <span class="cart-badge">${count}</span>`;
    } else {
        cartNavLink.innerHTML = `🛒 Cart`;
    }
}




// ======================================
// SEARCH FOODS
// ======================================

function searchFoods() {

    const search =
        document.getElementById(
            'searchInput'
        ).value.toLowerCase();


    const cards =
        document.querySelectorAll(
            '.food-card'
        );


    cards.forEach(card => {

        const text =
            card.innerText.toLowerCase();


        if (text.includes(search)) {

            card.style.display =
                'block';

        }
        else {

            card.style.display =
                'none';

        }

    });

}




// ======================================
// FILTER FOODS
// ======================================

function filterFoods(category, element) {
    if (element) {
        const siblings = element.parentNode.querySelectorAll('.filter-button');
        siblings.forEach(sibling => sibling.classList.remove('active'));
        element.classList.add('active');
    }

    const cards =
        document.querySelectorAll(
            '.food-card'
        );


    cards.forEach(card => {

        const text =
            card.innerText;


        if (category === 'All') {

            card.style.display =
                'block';

        }
        else if (
            text.includes(category)
        ) {

            card.style.display =
                'block';

        }
        else {

            card.style.display =
                'none';

        }

    });

}




// ======================================
// LOAD RESTAURANTS
// ======================================

async function loadRestaurants() {

    const restaurantList =
        document.getElementById(
            'restaurantList'
        );

    if (!restaurantList) return;


    try {

        const response =
            await fetch(
                `${API}/restaurants`
            );

        const restaurants =
            await response.json();

        restaurantList.innerHTML = '';


        restaurants.forEach(restaurant => {

            restaurantList.innerHTML += `

            <div
            class="food-card restaurant-card"

            onclick="loadRestaurantFoods(
                ${restaurant.restaurant_id}
            )"

            style="cursor:pointer;">

                <img src="${restaurant.restaurant_image || 'https://via.placeholder.com/320x180?text=No+Image'}" alt="${restaurant.restaurant_name}" class="restaurant-thumb">

                <h2>
                    ${restaurant.restaurant_name}
                </h2>

                <p>
                    ${restaurant.location}
                </p>

            </div>

            `;

        });

    }
    catch (error) {

        console.log(error);

    }

}




// ======================================
// LOAD RESTAURANT FOODS
// ======================================

async function loadRestaurantFoods(id) {

    const restaurantFoods =
        document.getElementById(
            'restaurantFoods'
        );

    if (!restaurantFoods) return;


    try {

        const response =
            await fetch(
                `${API}/restaurantfoods/${id}`
            );

        const foods =
            await response.json();

        restaurantFoods.innerHTML = '';


        foods.forEach(food => {

            restaurantFoods.innerHTML += `

            <div class="food-card">
                <span class="tag ${(food.category || '').toLowerCase().includes('non') ? 'tag-nonveg' : ((food.category || '').toLowerCase().includes('veg') ? 'tag-veg' : 'tag-dessert')}">${food.category || ''}</span>
                <div class="food-image-wrapper">
                    <img src="${food.food_image}" class="food-image">
                    <div class="time-badge">⏱ ${food.delivery_time || '20 mins'}</div>
                </div>
                <div class="food-card-content">
                    <div class="restaurant-name">RESTAURANT ITEM</div>
                    <div class="food-name">${food.food_name}</div>
                    <div class="food-footer">
                        <div class="food-price">₹${food.price}</div>
                        <button class="order-btn" onclick="addToCart(${food.food_id}, '${food.food_name}', ${food.price})">🛒 Add to Cart</button>
                    </div>
                </div>
            </div>
            `;

        });

    }
    catch (error) {

        console.log(error);

    }

}




// ======================================
// ADD FOOD
// ======================================

function addFood() {

    const imageInput =
        document.getElementById(
            'food_image'
        );

    const file =
        imageInput.files[0];


    if (file) {

        const reader =
            new FileReader();


        reader.onload = function (e) {

            saveFood(
                e.target.result
            );

        };


        reader.readAsDataURL(file);

    }
    else {

        saveFood('');

    }

}




// ======================================
// SAVE FOOD
// ======================================

async function saveFood(imageData) {

    const food = {

        food_name:
            document.getElementById(
                'food_name'
            ).value,

        category:
            document.getElementById(
                'category'
            ).value,

        price:
            document.getElementById(
                'price'
            ).value,

        restaurant_id:
            document.getElementById(
                'restaurant_id'
            ).value,

        delivery_time:
            document.getElementById(
                'delivery_time'
            ).value,

        food_image:
            imageData

    };


    try {

        const response =
            await fetch(`${API}/addfood`, {

                method: 'POST',
                credentials: 'include',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(food)

            });


        const result =
            await response.text();

        alert(result);

        window.location.href =
            'index.html';

    }
    catch (error) {

        console.log(error);

    }

}




// ======================================
// DELETE FOOD
// ======================================

async function deleteFood(id) {

    try {

        const response =
            await fetch(

                `${API}/deletefood/${id}`,

                {
                    method: 'DELETE'
                }

            );


        const result =
            await response.text();

        alert(result);

        loadFoods();

    }
    catch (error) {

        console.log(error);

    }

}




// ======================================
// ADD TO CART
// ======================================

function addToCart(
    id,
    name,
    price
) {

    let cart =
        JSON.parse(
            localStorage.getItem('cart')
        ) || [];


    const existing =
        cart.find(
            item => item.id === id
        );


    if (existing) {

        existing.quantity += 1;

    }
    else {

        cart.push({

            id,
            name,
            price,
            quantity: 1

        });

    }


    localStorage.setItem(

        'cart',

        JSON.stringify(cart)

    );

    updateCartCount();

    alert(
        name +
        ' Added To Cart'
    );

}




// ======================================
// LOAD CART
// ======================================

function loadCart() {

    updateCartCount();

    const cartItems =
        document.getElementById(
            'cartItems'
        );

    const cartTotal =
        document.getElementById(
            'cartTotal'
        );


    if (!cartItems) return;


    let cart =
        JSON.parse(
            localStorage.getItem('cart')
        ) || [];


    cartItems.innerHTML = '';

    let total = 0;


    if (cart.length === 0) {

        cartItems.innerHTML = `

        <div class="food-card">

            <h2>
                Cart Is Empty
            </h2>

        </div>

        `;

        cartTotal.innerHTML = '';

        return;

    }


    cart.forEach((item, index) => {

        const itemTotal =
            item.price * item.quantity;

        total += itemTotal;


        cartItems.innerHTML += `

        <div class="food-card">

            <h2>
                ${item.name}
            </h2>

            <p>
                Price:
                ₹${item.price}
            </p>

            <p>

                Quantity:

                <button
                onclick="decreaseQuantity(${index})">
                    -
                </button>

                ${item.quantity}

                <button
                onclick="increaseQuantity(${index})">
                    +
                </button>

            </p>

            <p>
                Total:
                ₹${itemTotal}
            </p>

            <button
            onclick="removeCartItem(${index})">

                Remove

            </button>

        </div>

        `;

    });


    cartTotal.innerHTML =
        `<h2>Total: ₹${total}</h2>`;

}


async function loadCartDeliveryDetails() {
    const deliveryName = document.getElementById('delivery_name');
    const deliveryPhone = document.getElementById('delivery_phone');
    const deliveryAddress = document.getElementById('delivery_address');

    if (!deliveryName && !deliveryPhone && !deliveryAddress) return;

    try {
        const response = await fetch(`${API}/api/profile`, {
            credentials: 'include'
        });
        if (!response.ok) return;

        const profile = await response.json();

        if (deliveryName) deliveryName.value = profile.customer_name || '';
        if (deliveryPhone) deliveryPhone.value = profile.phone || '';
        if (deliveryAddress) deliveryAddress.value = profile.address || '';
    }
    catch (error) {
        console.log('Failed to load cart delivery details', error);
    }
}




// ======================================
// REMOVE CART ITEM
// ======================================

function removeCartItem(index) {

    let cart =
        JSON.parse(
            localStorage.getItem('cart')
        ) || [];


    cart.splice(index, 1);


    localStorage.setItem(

        'cart',

        JSON.stringify(cart)

    );


    loadCart();

}




// ======================================
// INCREASE QUANTITY
// ======================================

function increaseQuantity(index) {

    let cart =
        JSON.parse(
            localStorage.getItem('cart')
        ) || [];


    cart[index].quantity += 1;


    localStorage.setItem(

        'cart',

        JSON.stringify(cart)

    );


    loadCart();

}




// ======================================
// DECREASE QUANTITY
// ======================================

function decreaseQuantity(index) {

    let cart =
        JSON.parse(
            localStorage.getItem('cart')
        ) || [];


    if (cart[index].quantity > 1) {

        cart[index].quantity -= 1;

    }
    else {

        cart.splice(index, 1);

    }


    localStorage.setItem(

        'cart',

        JSON.stringify(cart)

    );


    loadCart();

}




// ======================================
// CHECKOUT CART
// ======================================

async function checkoutCart() {

    const responseUser =
        await fetch(
            `${API}/checklogin`,
            {
                credentials: 'include'
            }
        );

    const userData =
        await responseUser.json();


    if (!userData.loggedIn) {

        alert(
            'Please Login First'
        );

        window.location.href =
            'signin.html';

        return;

    }


    let cart =
        JSON.parse(
            localStorage.getItem('cart')
        ) || [];


    if (cart.length === 0) {

        alert('Cart Is Empty');

        return;

    }

    const deliveryName = document.getElementById('delivery_name')?.value.trim() || '';
    const deliveryPhone = document.getElementById('delivery_phone')?.value.trim() || '';
    const deliveryAddress = document.getElementById('delivery_address')?.value.trim() || '';

    if (!deliveryAddress) {
        alert('Please enter your delivery address before checkout');
        return;
    }

    try {
        await fetch(`${API}/api/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer_name: deliveryName,
                phone: deliveryPhone,
                address: deliveryAddress
            })
        });
    } catch (error) {
        console.log('Failed to save delivery details', error);
    }

    const placedOrders = [];

    for (let item of cart) {

        const order = {

            customer_id:
                userData.user.id,

            food_id:
                item.id,

            quantity:
                item.quantity,

            total_price:
                item.price *
                item.quantity

        };

        const resp = await fetch(

            `${API}/placeorder`,

            {

                method: 'POST',
                credentials: 'include',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(order)

            }

        );

        const data = await resp.json().catch(() => ({}));
        placedOrders.push({
            response: data,
            food_id: item.id
        });
    }

    localStorage.removeItem('cart');

    updateCartCount();

    // If payment integration exists later, we can use data.payment here.
    alert('Order Placed Successfully');

    window.location.href =
        'purchases.html';

}




// ======================================
// LOAD ORDERS (Premium Track UI)
// ======================================

async function loadOrders() {

    const orderList =
        document.getElementById(
            'orderList'
        );

    if (!orderList) return;


    try {

        const response =
            await fetch(`${API}/orders`, {
                credentials: 'include'
            });

        const orders =
            await response.json();

        orderList.innerHTML = '';
        updateOrderFilterButtons();

        // --- KPI Stats ---
        const statsEl = document.getElementById('orderStats');
        if (statsEl) {
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((s, o) => s + Number(o.total_price || 0), 0);
            const active = orders.filter(o => o.order_status !== 'Delivered' && o.order_status !== 'Cancelled').length;

            statsEl.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon blue">📦</div>
                    <div class="stat-info">
                        <h4>Total Orders</h4>
                        <span>${totalOrders}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">💰</div>
                    <div class="stat-info">
                        <h4>Total Spent</h4>
                        <span>₹${totalSpent.toFixed(0)}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">🚚</div>
                    <div class="stat-info">
                        <h4>Active Deliveries</h4>
                        <span>${active}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon cyan">⏱</div>
                    <div class="stat-info">
                        <h4>Avg Delivery</h4>
                        <span>25 min</span>
                    </div>
                </div>
            `;
        }

        // --- No Orders ---
        if (orders.length === 0) {
            orderList.innerHTML = `
                <div class="order-track-card" style="text-align:center; padding:40px;">
                    <h2 style="margin-bottom:8px;">No Orders Yet</h2>
                    <p style="color:#aaa;">Place your first order from the menu!</p>
                </div>
            `;
            return;
        }

        // --- Render Each Order ---
        const stepLabels = ['Order Placed', 'Preparing', 'Out for Delivery', 'Delivered'];

        const filteredOrders = orders.filter(order => {
            const orderStatus = String(order.order_status || 'Order Placed').toLowerCase();
            const isDelivered = orderStatus.includes('delivered');
            const isCancelled = orderStatus.includes('cancelled');
            if (orderFilterState === 'delivered') {
                return isDelivered;
            }
            return !isDelivered && !isCancelled;
        });

        if (filteredOrders.length === 0) {
            orderList.innerHTML = `
                <div class="order-track-card" style="text-align:center; padding:40px;">
                    <h2 style="margin-bottom:8px;">No orders found</h2>
                    <p style="color:#aaa;">Try another filter or check back later.</p>
                </div>
            `;
            return;
        }

        filteredOrders.forEach(order => {

            // Map status text to step index
            const orderStatus = order.order_status || 'Order Placed';
            let currentStep = 0;
            const statusLower = orderStatus.toLowerCase();
            if (statusLower.includes('preparing')) currentStep = 1;
            if (statusLower.includes('out')) currentStep = 2;
            if (statusLower.includes('delivered')) currentStep = 3;
            if (statusLower.includes('cancelled')) currentStep = -1;

            // Status badge class
            let badgeClass = 'status-placed';
            if (currentStep === 1) badgeClass = 'status-preparing';
            if (currentStep === 2) badgeClass = 'status-out-for-delivery';
            if (currentStep === 3) badgeClass = 'status-delivered';
            if (currentStep === -1) badgeClass = 'status-cancelled';

            // Progress width (percentage of the connecting line)
            let progressPct = 0;
            if (currentStep === 1) progressPct = 33;
            if (currentStep === 2) progressPct = 66;
            if (currentStep === 3) progressPct = 100;

            // Build timeline steps HTML
            let timelineHTML = '';
            stepLabels.forEach((label, idx) => {
                let dotClass = 'pending';
                let labelClass = '';
                let dotContent = idx + 1;

                if (currentStep === -1) {
                    dotClass = 'pending';
                } else if (idx < currentStep) {
                    dotClass = 'completed';
                    labelClass = 'completed';
                    dotContent = '✓';
                } else if (idx === currentStep) {
                    dotClass = 'active';
                    labelClass = 'active';
                }

                timelineHTML += `
                    <div class="timeline-step">
                        <div class="step-dot ${dotClass}">${dotContent}</div>
                        <span class="step-label ${labelClass}">${label}</span>
                    </div>
                `;
            });

            let actionsHTML = '';
            if (isAdminUser && currentStep >= 0 && currentStep < 3) {
                const nextStatus = stepLabels[currentStep + 1] || 'Delivered';
                actionsHTML = `
                    <div class="order-actions">
                        <button class="btn-dispatch" onclick="updateOrderStatus(${order.order_id}, '${nextStatus}')">
                            ${currentStep === 2 ? '✓ Mark Delivered' : '🚀 Dispatch'}
                        </button>
                        <button class="btn-cancel" onclick="updateOrderStatus(${order.order_id}, 'Cancelled')">
                            ✕ Cancel
                        </button>
                        <button class="btn-edit" onclick="editOrderDetails(${order.order_id}, '${orderStatus}', '${order.tracking_number}')">
                            ✎ Edit Track
                        </button>
                    </div>
                `;
            }

            const cardClasses = ['order-track-card'];
            if (currentStep === 3) cardClasses.push('delivered');
            if (currentStep === -1) cardClasses.push('cancelled');

            orderList.innerHTML += `
                <div class="${cardClasses.join(' ')}">

                    <div class="order-track-header">
                        <h2>Order #${order.order_id}</h2>
                        <span class="tracking-badge ${badgeClass}">
                            ${orderStatus}
                        </span>
                    </div>

                    <div class="order-details-grid">
                        <p><b>Customer:</b> ${order.customer_name}</p>
                        <p><b>Item Ordered:</b> ${order.quantity} x ${order.food_name}</p>
                        <p><b>Total:</b> ₹${order.total_price}</p>
                        <p><b>Delivery:</b> ${order.delivery_address || 'No address provided'}</p>
                    </div>

                    <!-- Tracking Link -->
                    <div class="tracking-link-row">
                        <span class="tracking-label">📦 Tracking Number</span>
                        <a class="tracking-link-btn" href="#" onclick="copyTracking('${order.tracking_number}', this); return false;">
                            <span class="tracking-code">${order.tracking_number}</span>
                            <span class="tracking-copy-icon">📋 Copy</span>
                        </a>
                    </div>

                    <!-- Timeline -->
                    <div class="timeline">
                        <div class="timeline-progress" style="width: ${progressPct}%;"></div>
                        ${timelineHTML}
                    </div>

                    ${actionsHTML}

                </div>
            `;

        });

    }
    catch (error) {

        console.log(error);

    }

}


// ======================================
// COPY TRACKING NUMBER
// ======================================

function copyTracking(trackingNumber, el) {
    navigator.clipboard.writeText(trackingNumber).then(() => {
        const copyIcon = el.querySelector('.tracking-copy-icon');
        if (copyIcon) {
            copyIcon.textContent = '✅ Copied!';
            setTimeout(() => { copyIcon.textContent = '📋 Copy'; }, 2000);
        }
    }).catch(() => {
        // Fallback for older browsers
        const temp = document.createElement('input');
        temp.value = trackingNumber;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        const copyIcon = el.querySelector('.tracking-copy-icon');
        if (copyIcon) {
            copyIcon.textContent = '✅ Copied!';
            setTimeout(() => { copyIcon.textContent = '📋 Copy'; }, 2000);
        }
    });
}


// ======================================
// UPDATE ORDER STATUS
// ======================================

async function updateOrderStatus(orderId, newStatus) {
    if (!confirm(`Update order #${orderId} to "${newStatus}"?`)) return;
    try {
        const res = await fetch(`${API}/updateorder/${orderId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_status: newStatus })
        });
        const text = await res.text();
        alert(text);
        loadOrders();
    } catch (e) {
        console.log('updateOrderStatus error', e);
    }
}

async function editOrderDetails(orderId, currentStatus, currentTrackingNumber) {
    const newStatus = prompt('Enter new order status:', currentStatus);
    if (newStatus === null) return;

    const newTrackingNumber = prompt('Enter new tracking number:', currentTrackingNumber || '');
    if (newTrackingNumber === null) return;

    const updates = {};
    if (newStatus.trim() && newStatus.trim() !== currentStatus) {
        updates.order_status = newStatus.trim();
    }
    if (newTrackingNumber.trim() && newTrackingNumber.trim() !== (currentTrackingNumber || '')) {
        updates.tracking_number = newTrackingNumber.trim();
    }

    if (!Object.keys(updates).length) {
        alert('No changes made.');
        return;
    }

    try {
        const res = await fetch(`${API}/updateorder/${orderId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const text = await res.text();
        alert(text);
        loadOrders();
    } catch (e) {
        console.log('editOrderDetails error', e);
    }
}





// ======================================
// LOGIN USER
// ======================================

async function loginUser() {

    const user = {

        email:
            document.getElementById(
                'login_email'
            ).value,

        password:
            document.getElementById(
                'login_password'
            ).value

    };


    try {

        const response =
            await fetch(`${API}/login`, {

                method: 'POST',

                credentials: 'include',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(user)

            });


        const result = await response.json();

        alert(result.message || 'Login response received');

        if (result.message === 'Login Successful') {
            if (result.role === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }

    }
    catch (error) {

        console.log(error);

    }

}




// ======================================
// REGISTER USER
// ======================================

async function registerUser() {

    const user = {

        name:
            document.getElementById(
                'register_name'
            ).value,

        email:
            document.getElementById(
                'register_email'
            ).value,

        password:
            document.getElementById(
                'register_password'
            ).value

    };


    try {

        const response =
            await fetch(`${API}/register`, {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(user)

            });


        const result =
            await response.text();

        alert(result);


        if (
            result ===
            'Registration Successful'
        ) {

            window.location.href =
                'signin.html';

        }

    }
    catch (error) {

        console.log(error);

    }

}




// ======================================
// LOGOUT USER
// ======================================

async function logoutUser() {

    try {

        await fetch(`${API}/logout`, {
            credentials: 'include'
        });

        window.location.href =
            'signin.html';

    }
    catch (error) {

        console.log(error);

    }

}




// ======================================
// CHECK LOGIN
// ======================================

async function checkLogin() {

    const loginBtn =
        document.getElementById(
            'loginBtn'
        );

    const logoutBtn =
        document.getElementById(
            'logoutBtn'
        );


    if (
        !loginBtn ||
        !logoutBtn
    ) return;


    try {

        const response =
            await fetch(
                `${API}/checklogin`,
                {
                    credentials: 'include'
                }
            );

        const data =
            await response.json();


        const profileAvatar = document.getElementById('profileAvatar');
        const addFoodLink = document.getElementById('addFoodLink');

        if (data.loggedIn) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline';

            isAdminUser = data.user && data.user.role === 'admin';
            if (addFoodLink) {
                addFoodLink.style.display = isAdminUser ? 'inline' : 'none';
            }
            if (profileAvatar) {
                profileAvatar.style.display = 'inline-flex';
                profileAvatar.href = 'account.html';
                const avatarImg = profileAvatar.querySelector('img');
                const profileNameEl = profileAvatar.querySelector('.profile-name');
                if (profileNameEl) {
                    profileNameEl.textContent = data.user.name || '';
                    profileNameEl.style.display = 'inline-block';
                }
                if (avatarImg) {
                    avatarImg.src = 'https://via.placeholder.com/40?text=U';
                }
                try {
                    const profileResponse = await fetch(`${API}/api/profile`, { credentials: 'include' });
                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        const avatarImg = profileAvatar.querySelector('img');
                        if (avatarImg) {
                            avatarImg.src = profileData.profile_pic || 'https://via.placeholder.com/40?text=U';
                        }
                        if (profileNameEl && profileData.customer_name) {
                            profileNameEl.textContent = profileData.customer_name;
                            profileNameEl.style.display = 'inline-block';
                        }
                    }
                } catch (e) {
                    console.log('Failed to load profile avatar', e);
                }
            }
        }
        else {
            loginBtn.style.display = 'inline';
            logoutBtn.style.display = 'none';

            isAdminUser = false;
            if (addFoodLink) {
                addFoodLink.style.display = 'none';
            }
            if (profileAvatar) {
                profileAvatar.style.display = 'none';
                const profileNameEl = profileAvatar.querySelector('.profile-name');
                if (profileNameEl) profileNameEl.style.display = 'none';
            }
        }

    }
    catch (error) {

        console.log(error);

    }

}




// ======================================
// INITIAL PAGE LOAD
// ======================================

// ======================================
// INITIAL PAGE LOAD
// ======================================

async function initApp() {
    await checkLogin();
    initHomePage();
    initShopPage();
    initProductPage();
    initCartPage();
    initCheckoutPage();
    initAdminPage();
    loadFoods();
    loadAdminProducts();
    loadAdminBrands();
    populateRestaurantSelect();
    loadRestaurants();
    loadCart();
    loadCartDeliveryDetails();
    loadOrders();
}

initApp();

// Populate restaurant select on pages that have it
async function populateRestaurantSelect() {

    const select = document.getElementById('restaurant_id');

    if (!select) return;

    try {

        const response = await fetch(`${API}/restaurants`);

        const restaurants = await response.json();

        select.innerHTML = `<option value="">Select Restaurant</option>`;

        restaurants.forEach(r => {

            select.innerHTML += `\n                <option value="${r.restaurant_id}">${r.restaurant_name} ${r.location ? ' - ' + r.location : ''}</option>`;

        });

    }
    catch (error) {

        console.log('Failed to load restaurants for select', error);

    }

}


// -------------------------
// Admin functions
// -------------------------

let editingRestaurantId = null;
let restaurantImageBase64 = '';
let restaurantMap = {};

function normalizeRestaurantImage(src) {
    // Already a full data URL or a regular http(s) URL — return as-is
    if (!src) return '';
    if (typeof src !== 'string') return '';
    if (src.startsWith('data:')) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    // Otherwise it's a raw base64 string
    return `data:image/jpeg;base64,${src}`;
}

function handleRestaurantImageFile(event) {
    const file = event.target.files[0];
    if (!file) {
        restaurantImageBase64 = '';
        setRestaurantImagePreview('');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        restaurantImageBase64 = reader.result;
        setRestaurantImagePreview(restaurantImageBase64);
    };
    reader.readAsDataURL(file);
}

function setRestaurantImagePreview(src) {
    const preview = document.getElementById('admin_rest_preview');
    if (!preview) return;
    if (src) {
        // src is already a proper data URL or http URL — use directly
        preview.src = src;
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
}

async function adminLoadFoods() {

    const container = document.getElementById('adminFoods');
    if (!container) return;

    try {
        const res = await fetch(`${API}/foods`);
        const foods = await res.json();
        container.innerHTML = '';
        foods.forEach(f => {
            container.innerHTML += `
            <div class="food-card admin-card">
                <h3>${f.food_name}</h3>
                <p>Price: ₹${f.price}</p>
                <p>Restaurant: ${f.restaurant_name}</p>
                <button onclick="deleteFood(${f.food_id}); adminLoadFoods();">Delete</button>
            </div>`;
        });
    } catch (e) { console.log('adminLoadFoods', e); }

}

async function adminLoadRestaurants() {

    const container = document.getElementById('adminRestaurants');
    if (!container) return;

    try {
        const res = await fetch(`${API}/restaurants`);
        const list = await res.json();
        container.innerHTML = '';
        restaurantMap = {};
        list.forEach(r => {
            restaurantMap[r.restaurant_id] = r;
            container.innerHTML += `
            <div class="food-card admin-card restaurant-card">
                <img src="${r.restaurant_image || 'https://via.placeholder.com/280x160?text=No+Image'}" alt="${r.restaurant_name}" class="restaurant-thumb">
                <div class="restaurant-card-content">
                    <h3>${r.restaurant_name}</h3>
                    <p>${r.location || ''}</p>
                    <div class="restaurant-card-actions">
                        <button onclick="editRestaurant(${r.restaurant_id})">Edit</button>
                        <button onclick="deleteRestaurant(${r.restaurant_id}); adminLoadRestaurants(); populateRestaurantSelect();">Delete</button>
                    </div>
                </div>
            </div>`;
        });
    } catch (e) { console.log('adminLoadRestaurants', e); }

}

function editRestaurant(id) {
    const restaurant = restaurantMap[id];
    if (!restaurant) return;
    editingRestaurantId = id;
    document.getElementById('admin_rest_name').value = restaurant.restaurant_name;
    document.getElementById('admin_rest_location').value = restaurant.location || '';
    // Store raw image as-is (already a full data URL or http URL)
    restaurantImageBase64 = restaurant.restaurant_image || '';
    document.getElementById('admin_rest_image').value = '';
    // Display the existing image directly
    setRestaurantImagePreview(restaurantImageBase64);
    document.getElementById('addRestaurantBtn').style.display = 'none';
    document.getElementById('updateRestaurantBtn').style.display = 'inline-flex';
    document.getElementById('cancelRestaurantEditBtn').style.display = 'inline-flex';
}

function cancelRestaurantEdit() {
    editingRestaurantId = null;
    document.getElementById('admin_rest_name').value = '';
    document.getElementById('admin_rest_location').value = '';
    document.getElementById('admin_rest_image').value = '';
    restaurantImageBase64 = '';
    setRestaurantImagePreview('');
    document.getElementById('addRestaurantBtn').style.display = 'inline-flex';
    document.getElementById('updateRestaurantBtn').style.display = 'none';
    document.getElementById('cancelRestaurantEditBtn').style.display = 'none';
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function getRestaurantImageBase64() {
    const fileInput = document.getElementById('admin_rest_image');
    if (!fileInput) return restaurantImageBase64;
    const file = fileInput.files && fileInput.files[0];
    if (file) {
        // Read newly selected file as data URL
        const base64 = await readFileAsBase64(file);
        restaurantImageBase64 = base64; // already a full data URL from FileReader
        setRestaurantImagePreview(base64);
        return base64;
    }
    // Return whatever was stored (already a full data URL or http URL)
    return restaurantImageBase64;
}

async function adminLoadUsers() {

    const container = document.getElementById('adminUsers');
    if (!container) return;

    try {
        const res = await fetch(`${API}/customers`, { credentials: 'include' });
        const list = await res.json();
        container.innerHTML = '';
        list.forEach(u => {
            container.innerHTML += `
            <div class="food-card admin-card">
                <h3>${u.customer_name}</h3>
                <p>${u.email}</p>
                <button onclick="deleteUser(${u.customer_id}); adminLoadUsers();">Delete</button>
            </div>`;
        });
    } catch (e) { console.log('adminLoadUsers', e); }

}

async function addRestaurant() {
    const name = document.getElementById('admin_rest_name').value;
    const location = document.getElementById('admin_rest_location').value;
    if (!name) return alert('Enter name');
    try {
        // getRestaurantImageBase64 already returns a proper data URL or http URL
        const restaurant_image = await getRestaurantImageBase64();
        const res = await fetch(`${API}/addrestaurant`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurant_name: name, location, restaurant_image })
        });
        const text = await res.text();
        alert(text);
        cancelRestaurantEdit();
        adminLoadRestaurants();
        populateRestaurantSelect();
    } catch (e) { console.log(e); }
}

async function updateRestaurant() {
    if (!editingRestaurantId) return;
    const name = document.getElementById('admin_rest_name').value;
    const location = document.getElementById('admin_rest_location').value;
    if (!name) return alert('Enter name');
    try {
        // getRestaurantImageBase64 already returns a proper data URL or http URL
        const restaurant_image = await getRestaurantImageBase64();
        const res = await fetch(`${API}/updaterestaurant/${editingRestaurantId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurant_name: name, location, restaurant_image })
        });
        const text = await res.text();
        alert(text);
        cancelRestaurantEdit();
        adminLoadRestaurants();
        populateRestaurantSelect();
    } catch (e) { console.log(e); }
}

async function deleteRestaurant(id) {
    if (!confirm('Delete restaurant?')) return;
    try {
        const res = await fetch(`${API}/deleterestaurant/${id}`, { method: 'DELETE', credentials: 'include' });
        const text = await res.text();
        alert(text);
    } catch (e) { console.log(e); }
}

async function deleteUser(id) {
    if (!confirm('Delete user?')) return;
    try {
        const res = await fetch(`${API}/deleteuser/${id}`, { method: 'DELETE', credentials: 'include' });
        const text = await res.text();
        alert(text);
    } catch (e) { console.log(e); }
}

// call admin loaders if on admin page
async function ensureAdminPageAccess() {
    const adminFoods = document.getElementById('adminFoods');
    const foodImage = document.getElementById('food_image');
    if (!adminFoods && !foodImage) return;

    try {
        const response = await fetch(`${API}/checklogin`, { credentials: 'include' });
        const data = await response.json();
        if (!data.loggedIn || data.user.role !== 'admin') {
            alert('Admin access required');
            window.location.href = 'signin.html';
        }
    }
    catch (error) {
        console.log('Admin access check failed', error);
        window.location.href = 'signin.html';
    }
}

ensureAdminPageAccess();
adminLoadFoods();
adminLoadRestaurants();
adminLoadUsers();


// ======================================
// PROFILE FUNCTIONS
// ======================================

let profilePicBase64 = '';

async function loadUserProfile() {
    try {
        const response = await fetch(`${API}/api/profile`, { credentials: 'include' });
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'signin.html';
            } else {
                console.error('Failed to load profile:', response.statusText);
            }
            return;
        }
        const user = await response.json();

        const nameEl = document.getElementById('profile_name');
        if (nameEl) nameEl.value = user.customer_name || '';

        const emailEl = document.getElementById('profile_email');
        if (emailEl) emailEl.value = user.email || '';

        const phoneEl = document.getElementById('profile_phone');
        if (phoneEl) phoneEl.value = user.phone || '';

        const addressEl = document.getElementById('profile_address');
        if (addressEl) addressEl.value = user.address || '';

        const emailDispEl = document.getElementById('emailDisplay');
        if (emailDispEl) emailDispEl.textContent = user.email || '';

        if (user.profile_pic) {
            const picEl = document.getElementById('profilePicDisplay');
            if (picEl) picEl.src = user.profile_pic;
            profilePicBase64 = user.profile_pic;
        }
    } catch (e) {
        console.error('loadUserProfile error', e);
    }
}

function handleProfilePicChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        profilePicBase64 = e.target.result;
        document.getElementById('profilePicDisplay').src = profilePicBase64;
    };
    reader.readAsDataURL(file);
}

function enableEditMode() {
    document.getElementById('profileForm').classList.add('edit-mode');
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.getElementById('profile_name').disabled = false;
    document.getElementById('profile_phone').disabled = false;
    document.getElementById('profile_address').disabled = false;
}

function disableEditMode() {
    document.getElementById('profileForm').classList.remove('edit-mode');
    document.getElementById('editBtn').style.display = 'inline-block';
    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('profile_name').disabled = true;
    document.getElementById('profile_phone').disabled = true;
    document.getElementById('profile_address').disabled = true;
    loadUserProfile(); // Reload original data
}

async function saveProfile(event) {
    event.preventDefault();

    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    try {
        const profileData = {
            customer_name: document.getElementById('profile_name').value,
            phone: document.getElementById('profile_phone').value,
            address: document.getElementById('profile_address').value,
            profile_pic: profilePicBase64
        };

        const response = await fetch(`${API}/api/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (response.ok) {
            successMsg.textContent = 'Profile updated successfully!';
            successMsg.style.display = 'block';
            disableEditMode();
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 3000);
        } else {
            errorMsg.textContent = result.message || 'Failed to update profile';
            errorMsg.style.display = 'block';
        }
    } catch (e) {
        console.log('saveProfile error', e);
        errorMsg.textContent = 'An error occurred while saving profile';
        errorMsg.style.display = 'block';
    }
}