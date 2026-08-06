const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');

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

function initializeDatabase() {
    const statements = [
        `CREATE TABLE IF NOT EXISTS  (
            customer_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20) DEFAULT NULL,
            address TEXT DEFAULT NULL,
            profile_pic LONGTEXT DEFAULT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS brands (
            brand_id INT AUTO_INCREMENT PRIMARY KEY,
            brand_name VARCHAR(100) NOT NULL,
            location VARCHAR(200) DEFAULT NULL,
            brand_image LONGTEXT DEFAULT NULL,
            brand_story TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS products (
            product_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            slug VARCHAR(180) UNIQUE,
            brand_id INT,
            category VARCHAR(100) DEFAULT NULL,
            description TEXT DEFAULT NULL,
            price DECIMAL(10,2) DEFAULT 0,
            discount INT DEFAULT 0,
            final_price DECIMAL(10,2) DEFAULT 0,
            stock INT DEFAULT 0,
            sizes VARCHAR(255) DEFAULT NULL,
            colors VARCHAR(255) DEFAULT NULL,
            images LONGTEXT DEFAULT NULL,
            rating DECIMAL(3,2) DEFAULT 4.8,
            featured TINYINT(1) DEFAULT 0,
            best_seller TINYINT(1) DEFAULT 0,
            new_arrival TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (brand_id) REFERENCES brands(brand_id)
        )`,
        `CREATE TABLE IF NOT EXISTS orders (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT,
            product_id INT,
            quantity INT,
            total_price DECIMAL(10,2),
            order_status VARCHAR(50) DEFAULT 'Processing',
            tracking_number VARCHAR(50) DEFAULT NULL,
            payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
            payment_provider VARCHAR(50) DEFAULT NULL,
            payment_reference VARCHAR(100) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES (customer_id),
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        )`,
        `CREATE TABLE IF NOT EXISTS wishlists (
            wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT,
            product_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES (customer_id),
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        )`
    ];

    statements.forEach(sql => {
        db.query(sql, err => {
            if (err) console.error('Schema init error:', err);
        });
    });

    db.query("SELECT * FROM  WHERE email='admin@example.com'", (err, result) => {
        if (!err && result && !result.length) {
            db.query("INSERT INTO  (customer_name, email, password, role) VALUES ('Admin', 'admin@example.com', 'admin123', 'admin')", err2 => {
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
                ['DIDOXX Studio', 'Los Angeles', 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5c4?auto=format&fit=crop&w=900&q=80', 'A premium streetwear line defined by minimal silhouettes and everyday luxury.'],
                ['Noir Atelier', 'Paris', 'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=900&q=80', 'Modern essentials with a refined tonal palette built for the city.'],
                ['Essential Archive', 'London', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', 'Curated wardrobe staples with elevated fabrics and iconic details.']
            ];
            db.query('INSERT INTO brands (brand_name, location, brand_image, brand_story) VALUES ?', [brands], err2 => {
                if (err2) console.error('Seed brands insert error:', err2);
            });
        }
    });

    db.query('SELECT COUNT(*) AS count FROM products', (err, result) => {
        if (err || !result || !result.length) return;
        if (result[0].count === 0) {
            db.query('SELECT brand_id FROM brands ORDER BY brand_id LIMIT 3', (err2, brands) => {
                if (err2 || !brands.length) return;
                const products = [
                    ['Oversized Signature Hoodie', 'oversized-signature-hoodie', brands[0].brand_id, 'Hoodies', 'A premium heavyweight hoodie with a relaxed fit, micro-fleece interior, and sculpted drop shoulder design.', 158.00, 10, 142.20, 35, 'S,M,L,XL', 'Black,Charcoal,White', JSON.stringify(['https://images.unsplash.com/photo-1530845644445-5a7e0dc39b9f?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1520975913034-75deb4929fa3?auto=format&fit=crop&w=900&q=80']), 4.9, 1, 1, 0],
                    ['Essential Crew Neck Tee', 'essential-crew-neck-tee', brands[0].brand_id, 'Tees', 'A timeless soft cotton tee with clean lines, tonal stitching, and a premium modern fit.', 58.00, 0, 58.00, 78, 'S,M,L,XL', 'Black,White,Grey', JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1495121605193-b116b5b9c5c4?auto=format&fit=crop&w=900&q=80']), 4.7, 0, 1, 1],
                    ['Wide-Leg Denim Jean', 'wide-leg-denim-jean', brands[1].brand_id, 'Jeans', 'Tailored denim with a modern wide-leg silhouette and premium washed finish.', 182.00, 15, 154.70, 22, '28,30,32,34,36', 'Indigo,Black', JSON.stringify(['https://images.unsplash.com/photo-1495121605193-b116b5b9c5c4?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80']), 4.8, 0, 0, 1],
                    ['Minimal Runner Sneaker', 'minimal-runner-sneaker', brands[2].brand_id, 'Sneakers', 'A sleek low-top sneaker with premium leather panels, soft cushioning, and versatile street-ready styling.', 198.00, 5, 188.10, 40, '7,8,9,10,11', 'White,Black', JSON.stringify(['https://images.unsplash.com/photo-1528701800489-20b2324e9826?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80']), 4.9, 1, 1, 0],
                    ['Signature Cargo Pant', 'signature-cargo-pant', brands[1].brand_id, 'Cargo', 'Functional cargo pants with premium hardware, modern tailoring, and a clean, elevated finish.', 148.00, 0, 148.00, 30, 'S,M,L,XL', 'Khaki,Black', JSON.stringify(['https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80']), 4.6, 0, 0, 1]
                ];
                db.query('INSERT INTO products (name, slug, brand_id, category, description, price, discount, final_price, stock, sizes, colors, images, rating, featured, best_seller, new_arrival) VALUES ?', [products], err3 => {
                    if (err3) console.error('Seed products insert error:', err3);
                });
            });
        }
    });
}

initializeDatabase();
seedData();

function buildProductQuery(baseSql, filters = {}) {
    const conditions = [];
    const params = [];
    if (filters.category && filters.category !== 'All') {
        conditions.push('p.category = ?');
        params.push(filters.category);
    }
    if (filters.brandId) {
        conditions.push('p.brand_id = ?');
        params.push(filters.brandId);
    }
    if (filters.search) {
        conditions.push('(p.name LIKE ? OR p.description LIKE ? OR b.brand_name LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    const sql = [baseSql].concat(conditions.length ? ['WHERE', conditions.join(' AND ')] : []).join(' ');
    return { sql, params };
}

app.get('/products', (req, res) => {
    const sql = `SELECT p.*, b.brand_name, b.brand_image, b.brand_story FROM products p LEFT JOIN brands b ON p.brand_id = b.brand_id`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result);
    });
});

app.get('/foods', (req, res) => {
    res.redirect('/products');
});

app.get('/brands', (req, res) => {
    db.query('SELECT * FROM brands', (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result);
    });
});

app.get('/restaurants', (req, res) => {
    res.redirect('/brands');
});

app.get('/brandproducts/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT p.*, b.brand_name, b.brand_image FROM products p LEFT JOIN brands b ON p.brand_id = b.brand_id WHERE p.brand_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result);
    });
});

app.get('/restaurantfoods/:id', (req, res) => {
    res.redirect(`/brandproducts/${req.params.id}`);
});

app.get('/', requireAdmin, (req, res) => {
    db.query('SELECT customer_id, customer_name, email, phone, address, role, created_at FROM ', (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result);
    });
});

app.post('/addbrand', requireAdmin, (req, res) => {
    const { brand_name, location, brand_image, brand_story } = req.body;
    db.query('INSERT INTO brands (brand_name, location, brand_image, brand_story) VALUES (?, ?, ?, ?)', [brand_name, location, brand_image, brand_story], err => {
        if (err) return res.status(500).send('Error Adding Brand');
        res.send('Brand Added');
    });
});

app.post('/addrestaurant', requireAdmin, (req, res) => {
    const { brand_name, location, brand_image, brand_story } = req.body;
    db.query('INSERT INTO brands (brand_name, location, brand_image, brand_story) VALUES (?, ?, ?, ?)', [brand_name, location, brand_image, brand_story], err => {
        if (err) return res.status(500).send('Error Adding Brand');
        res.send('Brand Added');
    });
});

app.put('/updatebrand/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const { brand_name, location, brand_image, brand_story } = req.body;
    db.query('UPDATE brands SET brand_name=?, location=?, brand_image=?, brand_story=? WHERE brand_id=?', [brand_name, location, brand_image, brand_story, id], err => {
        if (err) return res.status(500).send('Error Updating Brand');
        res.send('Brand Updated');
    });
});

app.put('/updaterestaurant/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const { brand_name, location, brand_image, brand_story } = req.body;
    db.query('UPDATE brands SET brand_name=?, location=?, brand_image=?, brand_story=? WHERE brand_id=?', [brand_name, location, brand_image, brand_story, id], err => {
        if (err) return res.status(500).send('Error Updating Brand');
        res.send('Brand Updated');
    });
});

app.delete('/deletebrand/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM brands WHERE brand_id=?', [id], err => {
        if (err) return res.status(500).send('Delete Failed');
        res.send('Brand Deleted');
    });
});

app.delete('/deleterestaurant/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM brands WHERE brand_id=?', [id], err => {
        if (err) return res.status(500).send('Delete Failed');
        res.send('Brand Deleted');
    });
});

app.post('/addproduct', requireAdmin, (req, res) => {
    const { name, slug, brand_id, category, description, price, discount, final_price, stock, sizes, colors, images, rating = 4.8, featured = 0, best_seller = 0, new_arrival = 0 } = req.body;
    const imagesPayload = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify(images || []);
    db.query('INSERT INTO products (name, slug, brand_id, category, description, price, discount, final_price, stock, sizes, colors, images, rating, featured, best_seller, new_arrival) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, slug, brand_id, category, description, price, discount, final_price, stock, sizes, colors, imagesPayload, rating, featured, best_seller, new_arrival], err => {
        if (err) return res.status(500).send('Error Adding Product');
        res.send('Product Added');
    });
});

app.post('/addfood', requireAdmin, (req, res) => {
    const { name, slug, brand_id, category, description, price, discount, final_price, stock, sizes, colors, images, rating = 4.8, featured = 0, best_seller = 0, new_arrival = 0 } = req.body;
    const imagesPayload = Array.isArray(images) ? JSON.stringify(images) : JSON.stringify(images || []);
    db.query('INSERT INTO products (name, slug, brand_id, category, description, price, discount, final_price, stock, sizes, colors, images, rating, featured, best_seller, new_arrival) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, slug, brand_id, category, description, price, discount, final_price, stock, sizes, colors, imagesPayload, rating, featured, best_seller, new_arrival], err => {
        if (err) return res.status(500).send('Error Adding Product');
        res.send('Product Added');
    });
});

app.put('/updateproduct/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const allowed = ['name', 'slug', 'brand_id', 'category', 'description', 'price', 'discount', 'final_price', 'stock', 'sizes', 'colors', 'images', 'rating', 'featured', 'best_seller', 'new_arrival'];
    const updates = [];
    const params = [];
    allowed.forEach(field => {
        if (req.body[field] !== undefined) {
            updates.push(`${field} = ?`);
            if (field === 'images') {
                params.push(Array.isArray(req.body.images) ? JSON.stringify(req.body.images) : JSON.stringify(req.body.images || []));
            } else {
                params.push(req.body[field]);
            }
        }
    });
    if (!updates.length) return res.status(400).send('No fields to update');
    params.push(id);
    db.query(`UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`, params, err => {
        if (err) return res.status(500).send('Error Updating Product');
        res.send('Product Updated');
    });
});

app.delete('/deleteproduct/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM orders WHERE product_id = ?', [id], err => {
        if (err) return res.status(500).send('Delete Failed');
        db.query('DELETE FROM products WHERE product_id = ?', [id], err2 => {
            if (err2) return res.status(500).send('Delete Failed');
            res.send('Product Deleted');
        });
    });
});

app.delete('/deletefood/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM orders WHERE product_id = ?', [id], err => {
        if (err) return res.status(500).send('Delete Failed');
        db.query('DELETE FROM products WHERE product_id = ?', [id], err2 => {
            if (err2) return res.status(500).send('Delete Failed');
            res.send('Product Deleted');
        });
    });
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    db.query('INSERT INTO  (customer_name, email, password) VALUES (?, ?, ?)', [name, email, password], err => {
        if (err) return res.status(500).send('Registration Failed');
        res.send('Registration Successful');
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM  WHERE email = ? AND password = ?', [email, password], (err, result) => {
        if (err) return res.status(500).send('Login Failed');
        if (result.length > 0) {
            req.session.user = result[0];
            res.json({ message: 'Login Successful', role: result[0].role || 'user' });
        } else {
            res.status(401).json({ message: 'Invalid Credentials' });
        }
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
        res.json({ loggedIn: true, user: { id: user.customer_id, name: user.customer_name, role: user.role || 'user' } });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/profile', (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    db.query('SELECT customer_id, customer_name, email, phone, address, profile_pic, role FROM  WHERE customer_id = ?', [user.customer_id], (err, result) => {
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
    ['customer_name', 'phone', 'address', 'profile_pic'].forEach(field => {
        if (req.body[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(req.body[field]);
        }
    });
    if (!updates.length) return res.status(400).json({ message: 'No fields to update' });
    params.push(user.customer_id);
    db.query(`UPDATE  SET ${updates.join(', ')} WHERE customer_id = ?`, params, err => {
        if (err) return res.status(500).json({ message: 'Failed to update profile' });
        db.query('SELECT * FROM  WHERE customer_id = ?', [user.customer_id], (err2, result2) => {
            if (!err2 && result2.length) req.session.user = result2[0];
            res.json({ message: 'Profile Updated Successfully' });
        });
    });
});

app.post('/placeorder', (req, res) => {
    const { customer_id, product_id, quantity, total_price } = req.body;
    const tracking_number = 'TRK' + Math.floor(Math.random() * 1000000);
    const payment_provider = process.env.PAYMENT_PROVIDER || 'stripe';
    const payment_reference = `${payment_provider}__${Date.now()}`;
    db.query('INSERT INTO orders (customer_id, product_id, quantity, total_price, order_status, tracking_number, payment_status, payment_provider, payment_reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [customer_id, product_id, quantity, total_price, 'Processing', tracking_number, 'pending', payment_provider, payment_reference], err => {
        if (err) return res.status(500).json({ message: 'Order Failed' });
        res.json({ message: 'Order Placed Successfully', tracking_number, payment: { provider: payment_provider, reference: payment_reference, status: 'pending' } });
    });
});

app.get('/orders', (req, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    let sql = `SELECT o.*, c.customer_name, c.address AS delivery_address, p.name AS product_name, p.images AS product_images, b.brand_name FROM orders o LEFT JOIN  c ON o.customer_id = c.customer_id LEFT JOIN products p ON o.product_id = p.product_id LEFT JOIN brands b ON p.brand_id = b.brand_id`;
    const params = [];
    if (user.role !== 'admin') {
        sql += ' WHERE o.customer_id = ?';
        params.push(user.customer_id);
    }
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result);
    });
});

app.post('/payment/webhook', (req, res) => {
    const { payment_reference, status, provider } = req.body || {};
    if (!payment_reference || !status) return res.status(400).json({ message: 'Missing payment_reference or status' });
    db.query('UPDATE orders SET payment_status = ?, payment_provider = COALESCE(?, payment_provider) WHERE payment_reference = ?', [status, provider || null, payment_reference], err => {
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
    db.query(`UPDATE orders SET ${updates.join(', ')} WHERE order_id = ?`, params, err => {
        if (err) return res.status(500).send('Update Failed');
        res.send('Status Updated');
    });
});

app.listen(3000, () => {
    console.log('Server Running On Port 3000');
});