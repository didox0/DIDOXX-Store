const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(session({ secret: 'didoxx_secret_key', resave: false, saveUninitialized: false, cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } }));
app.use(express.static('public'));

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'didoxx',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function requireAdmin(req, res, next) {
    const user = req.session.user;
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';
}

function normalizeBrandRow(row) {
    return {
        ...row,
        brand_id: row.brand_id ?? row.id,
        brand_name: row.brand_name ?? row.name,
        brand_image: row.brand_image ?? row.logo_url,
        brand_story: row.brand_story ?? row.description,
        description: row.description ?? row.brand_story,
        logo_url: row.logo_url ?? row.brand_image,
        name: row.name ?? row.brand_name
    };
}

function normalizeProductRow(row) {
    const imageValue = row.images ?? row.image_url ?? null;
    return {
        ...row,
        product_id: row.product_id ?? row.id,
        name: row.name,
        slug: row.slug,
        brand_id: row.brand_id,
        category: row.category ?? row.category_id ?? null,
        category_id: row.category_id ?? null,
        description: row.description ?? '',
        price: row.price ?? 0,
        discount: row.discount ?? 0,
        final_price: row.final_price ?? row.sale_price ?? row.price ?? 0,
        stock: row.stock ?? row.stock_quantity ?? 0,
        sizes: row.sizes ?? (row.size ? row.size : null),
        colors: row.colors ?? (row.color ? row.color : null),
        images: imageValue ? (typeof imageValue === 'string' ? imageValue : JSON.stringify(imageValue)) : null,
        image_url: row.image_url ?? imageValue ?? null,
        rating: row.rating ?? 4.8,
        featured: row.featured ?? 0,
        best_seller: row.best_seller ?? 0,
        new_arrival: row.new_arrival ?? 0,
        brand_name: row.brand_name ?? null,
        brand_image: row.brand_image ?? null,
        brand_story: row.brand_story ?? null
    };
}

function initializeDatabase() {
    const statements = [
        `CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            phone VARCHAR(20) DEFAULT NULL,
            role ENUM('customer','admin','vendor') NOT NULL DEFAULT 'customer',
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_users_email (email)
        )`,
        `CREATE TABLE IF NOT EXISTS brands (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) NOT NULL,
            description TEXT DEFAULT NULL,
            logo_url VARCHAR(255) DEFAULT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_brands_slug (slug)
        )`,
        `CREATE TABLE IF NOT EXISTS products (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            description TEXT DEFAULT NULL,
            brand_id BIGINT UNSIGNED DEFAULT NULL,
            category_id BIGINT UNSIGNED DEFAULT NULL,
            sku VARCHAR(100) DEFAULT NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            sale_price DECIMAL(10,2) DEFAULT NULL,
            stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
            size VARCHAR(50) DEFAULT NULL,
            color VARCHAR(50) DEFAULT NULL,
            gender ENUM('men','women','unisex','kids') NOT NULL DEFAULT 'unisex',
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            image_url VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_products_slug (slug),
            KEY idx_products_brand_id (brand_id),
            KEY idx_products_category_id (category_id),
            CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL ON UPDATE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS orders (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            address_id BIGINT UNSIGNED DEFAULT NULL,
            coupon_id BIGINT UNSIGNED DEFAULT NULL,
            order_number VARCHAR(50) NOT NULL,
            order_status ENUM('pending','processing','shipped','delivered','cancelled','returned') NOT NULL DEFAULT 'pending',
            payment_status ENUM('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            notes TEXT DEFAULT NULL,
            tracking_number VARCHAR(100) DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_orders_number (order_number),
            KEY idx_orders_user_id (user_id),
            CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS wishlist (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            product_id BIGINT UNSIGNED NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
            CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
        )`
    ];

    statements.forEach(sql => {
        db.query(sql, err => {
            if (err) console.error('Schema init error:', err);
        });
    });

    db.query("SELECT id, email, role FROM users WHERE email = ?", ['admin@example.com'], (err, result) => {
        if (!err && result && !result.length) {
            const passwordHash = bcrypt.hashSync('admin123', 10);
            db.query("INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)", ['Admin', 'admin@example.com', passwordHash, 'admin'], err2 => {
                if (err2) console.error('Failed to create admin user:', err2);
            });
        }
    });
}

function seedData() {
    db.query('SELECT COUNT(*) AS count FROM brands', (err, result) => {
        if (err || !result || !result.length) return;
        if (result[0].count === 0) {
            const brands = [
                ['DIDOXX Studio', 'didoxx-studio', 'A premium streetwear line defined by minimal silhouettes and everyday luxury.', 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5c4?auto=format&fit=crop&w=900&q=80', 1],
                ['Noir Atelier', 'noir-atelier', 'Modern essentials with a refined tonal palette built for the city.', 'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=900&q=80', 1],
                ['Essential Archive', 'essential-archive', 'Curated wardrobe staples with elevated fabrics and iconic details.', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', 1]
            ];
            db.query('INSERT INTO brands (name, slug, description, logo_url, is_active) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), description = VALUES(description), logo_url = VALUES(logo_url), is_active = VALUES(is_active)', [brands], err2 => {
                if (err2) console.error('Seed brands insert error:', err2);
            });
        }
    });

    db.query('SELECT COUNT(*) AS count FROM products', (err, result) => {
        if (err || !result || !result.length) return;
        if (result[0].count === 0) {
            db.query('SELECT id FROM brands ORDER BY id LIMIT 3', (err2, brands) => {
                if (err2 || !brands.length) return;
                const products = [
                    ['Oversized Signature Hoodie', 'oversized-signature-hoodie', brands[0].id, null, 'A premium heavyweight hoodie with a relaxed fit, micro-fleece interior, and sculpted drop shoulder design.', 158.00, 142.20, 35, 'https://images.unsplash.com/photo-1530845644445-5a7e0dc39b9f?auto=format&fit=crop&w=900&q=80', 1, 'SKU-HOOD-001'],
                    ['Essential Crew Neck Tee', 'essential-crew-neck-tee', brands[0].id, null, 'A timeless soft cotton tee with clean lines, tonal stitching, and a premium modern fit.', 58.00, 58.00, 78, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', 1, 'SKU-TEE-001'],
                    ['Wide-Leg Denim Jean', 'wide-leg-denim-jean', brands[1].id, null, 'Tailored denim with a modern wide-leg silhouette and premium washed finish.', 182.00, 154.70, 22, 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5c4?auto=format&fit=crop&w=900&q=80', 1, 'SKU-JEAN-001'],
                    ['Minimal Runner Sneaker', 'minimal-runner-sneaker', brands[2].id, null, 'A sleek low-top sneaker with premium leather panels, soft cushioning, and versatile street-ready styling.', 198.00, 188.10, 40, 'https://images.unsplash.com/photo-1528701800489-20b2324e9826?auto=format&fit=crop&w=900&q=80', 1, 'SKU-SNEAKER-001'],
                    ['Signature Cargo Pant', 'signature-cargo-pant', brands[1].id, null, 'Functional cargo pants with premium hardware, modern tailoring, and a clean, elevated finish.', 148.00, 148.00, 30, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 1, 'SKU-PANT-001']
                ];
                db.query('INSERT INTO products (name, slug, brand_id, category_id, description, price, sale_price, stock_quantity, image_url, is_active, sku) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), brand_id = VALUES(brand_id), category_id = VALUES(category_id), description = VALUES(description), price = VALUES(price), sale_price = VALUES(sale_price), stock_quantity = VALUES(stock_quantity), image_url = VALUES(image_url), is_active = VALUES(is_active)', [products], err3 => {
                    if (err3) console.error('Seed products insert error:', err3);
                });
            });
        }
    });
}

initializeDatabase();
seedData();

app.get('/products', (req, res) => {
    const sql = `SELECT p.id AS product_id, p.name, p.slug, p.description, p.brand_id, p.category_id, p.price, p.sale_price AS final_price, p.stock_quantity AS stock, p.image_url AS images, p.is_active, p.created_at, b.id AS brand_id, b.name AS brand_name, b.logo_url AS brand_image, b.description AS brand_story FROM products p LEFT JOIN brands b ON p.brand_id = b.id`;
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Products query error:', err);
            return res.status(500).json([]);
        }

        const rows = Array.isArray(result) ? result : [];
        res.json(rows.map(normalizeProductRow));
    });
});

app.get('/foods', (req, res) => {
    res.redirect('/products');
});

app.get('/brands', (req, res) => {
    const sql = 'SELECT id AS brand_id, name AS brand_name, slug, description AS brand_story, logo_url AS brand_image, is_active, created_at FROM brands';
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result.map(normalizeBrandRow));
    });
});

app.get('/restaurants', (req, res) => {
    res.redirect('/brands');
});

app.get('/brandproducts/:id', (req, res) => {
    const id = req.params.id;
    const sql = `SELECT p.id AS product_id, p.name, p.slug, p.description, p.brand_id, p.category_id, p.price, p.sale_price AS final_price, p.stock_quantity AS stock, p.image_url AS images, p.is_active, p.created_at, b.id AS brand_id, b.name AS brand_name, b.logo_url AS brand_image, b.description AS brand_story FROM products p LEFT JOIN brands b ON p.brand_id = b.id WHERE p.brand_id = ?`;
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result.map(normalizeProductRow));
    });
});

app.get('/restaurantfoods/:id', (req, res) => {
    res.redirect(`/brandproducts/${req.params.id}`);
});

app.get('/customers', requireAdmin, (req, res) => {
    db.query('SELECT id AS customer_id, name AS customer_name, email, phone, role, created_at FROM users', (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result);
    });
});

app.post('/addbrand', requireAdmin, (req, res) => {
    const { brand_name, brand_image, brand_story, slug, description, logo_url, name, is_active = 1 } = req.body;
    const finalName = name || brand_name;
    const finalSlug = slug || slugify(finalName);
    const finalDescription = description || brand_story;
    const finalImage = logo_url || brand_image;
    db.query('INSERT INTO brands (name, slug, description, logo_url, is_active) VALUES (?, ?, ?, ?, ?)', [finalName, finalSlug, finalDescription, finalImage, is_active], err => {
        if (err) return res.status(500).send('Error Adding Brand');
        res.send('Brand Added');
    });
});

app.post('/addrestaurant', requireAdmin, (req, res) => {
    const { brand_name, brand_image, brand_story, slug, description, logo_url, name, is_active = 1 } = req.body;
    const finalName = name || brand_name;
    const finalSlug = slug || slugify(finalName);
    const finalDescription = description || brand_story;
    const finalImage = logo_url || brand_image;
    db.query('INSERT INTO brands (name, slug, description, logo_url, is_active) VALUES (?, ?, ?, ?, ?)', [finalName, finalSlug, finalDescription, finalImage, is_active], err => {
        if (err) return res.status(500).send('Error Adding Brand');
        res.send('Brand Added');
    });
});

app.put('/updatebrand/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const { brand_name, brand_image, brand_story, slug, description, logo_url, name, is_active = 1 } = req.body;
    const finalName = name || brand_name;
    const finalSlug = slug || slugify(finalName || 'brand');
    const finalDescription = description || brand_story;
    const finalImage = logo_url || brand_image;
    const updates = [];
    const params = [];
    if (finalName) { updates.push('name = ?'); params.push(finalName); }
    if (finalSlug) { updates.push('slug = ?'); params.push(finalSlug); }
    if (finalDescription !== undefined) { updates.push('description = ?'); params.push(finalDescription); }
    if (finalImage !== undefined) { updates.push('logo_url = ?'); params.push(finalImage); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
    if (!updates.length) return res.status(400).send('No fields to update');
    params.push(id);
    db.query(`UPDATE brands SET ${updates.join(', ')} WHERE id = ?`, params, err => {
        if (err) return res.status(500).send('Error Updating Brand');
        res.send('Brand Updated');
    });
});

app.put('/updaterestaurant/:id', requireAdmin, (req, res) => {
    return app._router.handle(req, res);
});

app.delete('/deletebrand/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM brands WHERE id=?', [id], err => {
        if (err) return res.status(500).send('Delete Failed');
        res.send('Brand Deleted');
    });
});

app.delete('/deleterestaurant/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM brands WHERE id=?', [id], err => {
        if (err) return res.status(500).send('Delete Failed');
        res.send('Brand Deleted');
    });
});

app.post('/addproduct', requireAdmin, (req, res) => {
    const { name, slug, brand_id, category_id, category, description, price, discount, final_price, stock, sizes, colors, images, image_url, rating = 4.8, featured = 0, best_seller = 0, new_arrival = 0 } = req.body;
    const finalSlug = slug || slugify(name);
    const imagePayload = image_url || (Array.isArray(images) ? images[0] : images);
    const finalPrice = price ?? 0;
    const finalSalePrice = final_price ?? price ?? null;
    const finalStock = stock ?? 0;
    const finalCategoryId = category_id ?? category ?? null;
    db.query('INSERT INTO products (name, slug, brand_id, category_id, description, price, sale_price, stock_quantity, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, finalSlug, brand_id || null, finalCategoryId, description || '', finalPrice, finalSalePrice, finalStock, imagePayload || null, 1], err => {
        if (err) return res.status(500).send('Error Adding Product');
        res.send('Product Added');
    });
});

app.post('/addfood', requireAdmin, (req, res) => {
    const { name, slug, brand_id, category_id, category, description, price, discount, final_price, stock, sizes, colors, images, image_url, rating = 4.8, featured = 0, best_seller = 0, new_arrival = 0 } = req.body;
    const finalSlug = slug || slugify(name);
    const imagePayload = image_url || (Array.isArray(images) ? images[0] : images);
    const finalPrice = price ?? 0;
    const finalSalePrice = final_price ?? price ?? null;
    const finalStock = stock ?? 0;
    const finalCategoryId = category_id ?? category ?? null;
    db.query('INSERT INTO products (name, slug, brand_id, category_id, description, price, sale_price, stock_quantity, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, finalSlug, brand_id || null, finalCategoryId, description || '', finalPrice, finalSalePrice, finalStock, imagePayload || null, 1], err => {
        if (err) return res.status(500).send('Error Adding Product');
        res.send('Product Added');
    });
});

app.put('/updateproduct/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const updates = [];
    const params = [];
    const pushField = (field, value) => {
        updates.push(`${field} = ?`);
        params.push(value);
    };
    if (req.body.name !== undefined) pushField('name', req.body.name);
    if (req.body.slug !== undefined) pushField('slug', req.body.slug || slugify(req.body.name));
    if (req.body.brand_id !== undefined) pushField('brand_id', req.body.brand_id || null);
    if (req.body.category_id !== undefined) pushField('category_id', req.body.category_id || null);
    if (req.body.category !== undefined && req.body.category_id === undefined) pushField('category_id', req.body.category || null);
    if (req.body.description !== undefined) pushField('description', req.body.description || '');
    if (req.body.price !== undefined) pushField('price', req.body.price);
    if (req.body.final_price !== undefined) pushField('sale_price', req.body.final_price);
    if (req.body.stock !== undefined) pushField('stock_quantity', req.body.stock);
    if (req.body.images !== undefined) pushField('image_url', Array.isArray(req.body.images) ? req.body.images[0] || null : req.body.images || null);
    if (req.body.image_url !== undefined) pushField('image_url', req.body.image_url || null);
    if (req.body.is_active !== undefined) pushField('is_active', req.body.is_active);
    if (!updates.length) return res.status(400).send('No fields to update');
    params.push(id);
    db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params, err => {
        if (err) return res.status(500).send('Error Updating Product');
        res.send('Product Updated');
    });
});

app.delete('/deleteproduct/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM wishlist WHERE product_id = ?', [id], err => {
        if (err) return res.status(500).send('Delete Failed');
        db.query('DELETE FROM products WHERE id = ?', [id], err2 => {
            if (err2) return res.status(500).send('Delete Failed');
            res.send('Product Deleted');
        });
    });
});

app.delete('/deletefood/:id', requireAdmin, (req, res) => {
    return app._router.handle(req, res);
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    const passwordHash = bcrypt.hashSync(password, 10);
    db.query('INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)', [name, email, passwordHash, 'customer'], err => {
        if (err) return res.status(500).send('Registration Failed');
        res.send('Registration Successful');
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) return res.status(500).send('Login Failed');
        if (!result.length) return res.status(401).json({ message: 'Invalid Credentials' });
        const user = result[0];
        const storedPassword = user.password_hash || user.password;
        const isValid = storedPassword && (storedPassword === password || bcrypt.compareSync(password, storedPassword));
        if (!isValid) return res.status(401).json({ message: 'Invalid Credentials' });
        req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role || 'user' };
        res.json({ message: 'Login Successful', role: user.role || 'user' });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Logout Failed');
        res.clearCookie('connect.sid');
        res.send('Logout Successful');
    });
});

app.get('/checklogin', (req, res) => {
    const user = req.session.user;
    if (user) {
        res.json({ loggedIn: true, user: { id: user.id, name: user.name, role: user.role || 'user' } });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/profile', (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    db.query('SELECT id, name, email, phone, role FROM users WHERE id = ?', [user.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database Error' });
        if (!result.length) return res.status(404).json({ message: 'User not found' });
        res.json(result[0]);
    });
});

app.put('/api/profile', (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const updates = [];
    const params = [];
    ['name', 'phone'].forEach(field => {
        if (req.body[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(req.body[field]);
        }
    });
    if (!updates.length) return res.status(400).json({ message: 'No fields to update' });
    params.push(user.id);
    db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, err => {
        if (err) return res.status(500).json({ message: 'Failed to update profile' });
        db.query('SELECT * FROM users WHERE id = ?', [user.id], (err2, result2) => {
            if (!err2 && result2.length) req.session.user = { ...req.session.user, ...result2[0] };
            res.json({ message: 'Profile Updated Successfully' });
        });
    });
});

app.post('/placeorder', (req, res) => {
    const { customer_id, total_price } = req.body;
    const tracking_number = 'TRK' + Math.floor(Math.random() * 1000000);
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userId = customer_id || req.session.user?.id;
    db.query('INSERT INTO orders (user_id, order_number, order_status, payment_status, total_amount, tracking_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, orderNumber, 'pending', 'pending', total_price || 0, tracking_number, 'Order placed via API'], err => {
        if (err) return res.status(500).json({ message: 'Order Failed' });
        res.json({ message: 'Order Placed Successfully', tracking_number, payment: { provider: process.env.PAYMENT_PROVIDER || 'stripe', reference: `${process.env.PAYMENT_PROVIDER || 'stripe'}__${Date.now()}`, status: 'pending' } });
    });
});

app.get('/orders', (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    let sql = 'SELECT o.id AS order_id, o.order_number, o.order_status, o.payment_status, o.total_amount, o.tracking_number, o.created_at, u.name AS customer_name FROM orders o LEFT JOIN users u ON o.user_id = u.id';
    const params = [];
    if (user.role !== 'admin') {
        sql += ' WHERE o.user_id = ?';
        params.push(user.id);
    }
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result);
    });
});

app.post('/payment/webhook', (req, res) => {
    const { payment_reference, status, provider } = req.body || {};
    if (!payment_reference || !status) return res.status(400).json({ message: 'Missing payment_reference or status' });
    db.query('UPDATE orders SET payment_status = ?, notes = COALESCE(CONCAT(notes, ?), ?) WHERE order_number = ?', [status, provider ? ` | provider:${provider}` : '', status, payment_reference], err => {
        if (err) return res.status(500).json({ message: 'Webhook update failed' });
        res.json({ message: 'Webhook received' });
    });
});

app.put('/updateorder/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const updates = [];
    const params = [];
    ['order_status', 'tracking_number'].forEach(field => {
        if (req.body[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(req.body[field]);
        }
    });
    if (!updates.length) return res.status(400).send('No fields to update');
    params.push(id);
    db.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params, err => {
        if (err) return res.status(500).send('Update Failed');
        res.send('Status Updated');
    });
});

app.listen(3000, () => {
    console.log('Server Running On Port 3000');
});