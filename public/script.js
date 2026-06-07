const API = 'http://localhost:3000';
let isAdminUser = false;
let orderFilterState = 'in-process';

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
    const cartNavLink = document.querySelector('nav a[href="cart.html"]');
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
            'login.html';

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


        await fetch(

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

    }


    localStorage.removeItem('cart');

    updateCartCount();

    alert(
        'Order Placed Successfully'
    );

    window.location.href =
        'orders.html';

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
                window.location.href = 'admin.html';
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
                'login.html';

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
            'login.html';

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
                profileAvatar.href = 'profile.html';
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
    loadFoods();
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
            window.location.href = 'login.html';
        }
    }
    catch (error) {
        console.log('Admin access check failed', error);
        window.location.href = 'login.html';
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
                window.location.href = 'login.html';
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