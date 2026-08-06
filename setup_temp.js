const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');

    const sql = `
        CREATE DATABASE IF NOT EXISTS didoxx;
        USE didoxx;

        DROP TABLE IF EXISTS wishlists;
        DROP TABLE IF EXISTS orders;
        DROP TABLE IF EXISTS products;
        DROP TABLE IF EXISTS brands;
        DROP TABLE IF EXISTS ;

        CREATE TABLE  (
            customer_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20) DEFAULT NULL,
            address TEXT DEFAULT NULL,
            profile_pic LONGTEXT DEFAULT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE brands (
            brand_id INT AUTO_INCREMENT PRIMARY KEY,
            brand_name VARCHAR(100) NOT NULL,
            location VARCHAR(200) DEFAULT NULL,
            brand_image LONGTEXT DEFAULT NULL,
            brand_story TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE products (
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
        );

        CREATE TABLE orders (
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
        );

        CREATE TABLE wishlists (
            wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT,
            product_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES (customer_id),
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        );

        INSERT INTO  (customer_name, email, password, role) VALUES
        ('Admin', 'admin@example.com', 'admin123', 'admin'),
        ('John Doe', 'john@example.com', 'password123', 'user'),
        ('Jane Smith', 'jane@example.com', 'password456', 'user'),
        ('Bob Johnson', 'bob@example.com', 'password789', 'user');

        INSERT INTO brands (brand_name, location, brand_image, brand_story) VALUES
        ('DIDOXX Studio', 'Los Angeles', 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5c4?auto=format&fit=crop&w=900&q=80', 'A premium streetwear line defined by minimal silhouettes and everyday luxury.'),
        ('Noir Atelier', 'Paris', 'https://images.unsplash.com/photo-1519974719765-e6559eac2575?auto=format&fit=crop&w=900&q=80', 'Modern essentials with a refined tonal palette built for the city.'),
        ('Essential Archive', 'London', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', 'Curated wardrobe staples with elevated fabrics and iconic details.');

        INSERT INTO products (name, slug, brand_id, category, description, price, discount, final_price, stock, sizes, colors, images, rating, featured, best_seller, new_arrival) VALUES
        ('Oversized Signature Hoodie', 'oversized-signature-hoodie', 1, 'Hoodies', 'A premium heavyweight hoodie with a relaxed fit, micro-fleece interior, and sculpted drop shoulder design.', 158.00, 10, 142.20, 35, 'S,M,L,XL', 'Black,Charcoal,White', '["https://images.unsplash.com/photo-1530845644445-5a7e0dc39b9f?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1520975913034-75deb4929fa3?auto=format&fit=crop&w=900&q=80"]', 4.9, 1, 1, 0),
        ('Essential Crew Neck Tee', 'essential-crew-neck-tee', 1, 'Tees', 'A timeless soft cotton tee with clean lines, tonal stitching, and a premium modern fit.', 58.00, 0, 58.00, 78, 'S,M,L,XL', 'Black,White,Grey', '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1495121605193-b116b5b9c5c4?auto=format&fit=crop&w=900&q=80"]', 4.7, 0, 1, 1),
        ('Wide-Leg Denim Jean', 'wide-leg-denim-jean', 2, 'Jeans', 'Tailored denim with a modern wide-leg silhouette and premium washed finish.', 182.00, 15, 154.70, 22, '28,30,32,34,36', 'Indigo,Black', '["https://images.unsplash.com/photo-1495121605193-b116b5b9c5c4?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"]', 4.8, 0, 0, 1),
        ('Minimal Runner Sneaker', 'minimal-runner-sneaker', 3, 'Sneakers', 'A sleek low-top sneaker with premium leather panels, soft cushioning, and versatile street-ready styling.', 198.00, 5, 188.10, 40, '7,8,9,10,11', 'White,Black', '["https://images.unsplash.com/photo-1528701800489-20b2324e9826?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"]', 4.9, 1, 1, 0),
        ('Signature Cargo Pant', 'signature-cargo-pant', 2, 'Cargo', 'Functional cargo pants with premium hardware, modern tailoring, and a clean, elevated finish.', 148.00, 0, 148.00, 30, 'S,M,L,XL', 'Khaki,Black', '["https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"]', 4.6, 0, 0, 1);
    `;

    connection.query(sql, (err) => {
        if (err) {
            console.error('Error creating database/tables:', err);
        } else {
            console.log('Database and tables created successfully!');
            console.log('Sample data inserted.');
            console.log('\nYou can now login with:');
            console.log('Email: john@example.com');
            console.log('Password: password123');
        }
        connection.end();
    });
});