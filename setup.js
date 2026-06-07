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
        CREATE DATABASE IF NOT EXISTS fooddelivery;
        USE fooddelivery;

        DROP TABLE IF EXISTS orders;
        DROP TABLE IF EXISTS food_items;
        DROP TABLE IF EXISTS customers;
        DROP TABLE IF EXISTS restaurants;

        CREATE TABLE customers (
            customer_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            phone VARCHAR(20) DEFAULT NULL,
            address TEXT DEFAULT NULL,
            profile_pic LONGTEXT DEFAULT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE restaurants (
            restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
            restaurant_name VARCHAR(100) NOT NULL,
            location VARCHAR(200),
            restaurant_image LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE food_items (
            food_id INT AUTO_INCREMENT PRIMARY KEY,
            food_name VARCHAR(100) NOT NULL,
            category VARCHAR(50),
            price DECIMAL(10, 2),
            restaurant_id INT,
            delivery_time INT,
            food_image LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
        );

        CREATE TABLE orders (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT,
            food_id INT,
            quantity INT,
            total_price DECIMAL(10, 2),
            order_status VARCHAR(50),
            tracking_number VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
            FOREIGN KEY (food_id) REFERENCES food_items(food_id)
        );

        INSERT INTO restaurants (restaurant_name, location) VALUES 
        ('Pizza Palace', 'Downtown'),
        ('Burger Barn', 'Midtown'),
        ('Sushi Supreme', 'Uptown');

        INSERT INTO food_items (food_name, category, price, restaurant_id, delivery_time, food_image) VALUES 

        -- Pizza Palace (restaurant 1)
        ('Margherita Pizza',    'Veg',      250, 1, 30, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=60'),
        ('Pepperoni Pizza',     'Non-Veg',  300, 1, 30, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60'),
        ('BBQ Chicken Pizza',   'Non-Veg',  320, 1, 35, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60'),
        ('Veggie Supreme Pizza','Veg',      280, 1, 30, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60'),
        ('Lemonade',            'Beverage', 80,  1, 10, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&auto=format&fit=crop&q=60'),
        ('Chocolate Lava Cake', 'Dessert',  150, 1, 15, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60'),

        -- Burger Barn (restaurant 2)
        ('Classic Burger',      'Non-Veg',  200, 2, 20, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60'),
        ('Veggie Burger',       'Veg',      220, 2, 20, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=60'),
        ('Crispy Chicken Burger','Non-Veg', 240, 2, 20, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&auto=format&fit=crop&q=60'),
        ('Double Smash Burger', 'Non-Veg',  299, 2, 25, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&auto=format&fit=crop&q=60'),
        ('Cold Coffee',         'Beverage', 90,  2, 10, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=60'),
        ('Strawberry Sundae',   'Dessert',  120, 2, 10, 'https://images.unsplash.com/photo-1560008511-11c63416e52d?w=500&auto=format&fit=crop&q=60'),

        -- Sushi Supreme (restaurant 3)
        ('California Roll',     'Non-Veg',  350, 3, 25, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60'),
        ('Veggie Sushi Roll',   'Veg',      300, 3, 25, 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=500&auto=format&fit=crop&q=60'),
        ('Spicy Tuna Roll',     'Non-Veg',  380, 3, 25, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&auto=format&fit=crop&q=60'),
        ('Salmon Nigiri',       'Non-Veg',  320, 3, 20, 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=500&auto=format&fit=crop&q=60'),
        ('Iced Green Tea',      'Beverage', 80,  3, 10, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60'),
        ('Mochi Ice Cream',     'Dessert',  130, 3, 10, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=60');

        INSERT INTO customers (customer_name, email, password, role) VALUES 
        ('Admin', 'admin@example.com', 'admin123', 'admin'),
        ('John Doe', 'john@example.com', 'password123', 'user'),
        ('Jane Smith', 'jane@example.com', 'password456', 'user'),
        ('Bob Johnson', 'bob@example.com', 'password789', 'user');
    `;

    connection.query(sql, (err, result) => {
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
