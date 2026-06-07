const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(session({
    secret: 'fooddelivery_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static('public'));



// ======================================
// MYSQL CONNECTION
// ======================================

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fooddelivery',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL Connection Error:', err);
    } else {
        console.log('MySQL Connected (via Pool)');
        connection.release();
    }
});




// Note: login state is stored in the session (req.session.user)

function requireAdmin(req, res, next) {
    const user = req.session.user;
    if (!user || user.role !== 'admin') {
        return res.status(403).send('Admin access required');
    }
    next();
}

function initializeAdminRole() {
    db.query("SHOW COLUMNS FROM customers LIKE 'role'", (err, result) => {
        if (err) {
            console.log('Role check error:', err);
            return;
        }
        if (!result.length) {
            db.query(
                "ALTER TABLE customers ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'",
                (err) => {
                    if (err) {
                        console.log('Failed to add role column:', err);
                        return;
                    }
                    console.log('Added role column to customers.');
                }
            );
        }
    });

    db.query("SHOW COLUMNS FROM customers LIKE 'phone'", (err, result) => {
        if (err) {
            console.log('Phone check error:', err);
            return;
        }
        if (!result.length) {
            db.query(
                "ALTER TABLE customers ADD COLUMN phone VARCHAR(20) DEFAULT NULL",
                (err) => {
                    if (err) {
                        console.log('Failed to add phone column:', err);
                        return;
                    }
                    console.log('Added phone column to customers.');
                }
            );
        }
    });

    db.query("SHOW COLUMNS FROM customers LIKE 'address'", (err, result) => {
        if (err) {
            console.log('Address check error:', err);
            return;
        }
        if (!result.length) {
            db.query(
                "ALTER TABLE customers ADD COLUMN address TEXT DEFAULT NULL",
                (err) => {
                    if (err) {
                        console.log('Failed to add address column:', err);
                        return;
                    }
                    console.log('Added address column to customers.');
                }
            );
        }
    });

    db.query("SHOW COLUMNS FROM customers LIKE 'profile_pic'", (err, result) => {
        if (err) {
            console.log('Profile pic check error:', err);
            return;
        }
        if (!result.length) {
            db.query(
                "ALTER TABLE customers ADD COLUMN profile_pic LONGTEXT DEFAULT NULL",
                (err) => {
                    if (err) {
                        console.log('Failed to add profile_pic column:', err);
                        return;
                    }
                    console.log('Added profile_pic column to customers.');
                }
            );
        }
    });

    db.query("SHOW COLUMNS FROM restaurants LIKE 'restaurant_image'", (err, result) => {
        if (err) {
            console.log('Restaurant image check error:', err);
            return;
        }
        if (!result.length) {
            db.query(
                "ALTER TABLE restaurants ADD COLUMN restaurant_image LONGTEXT",
                (err) => {
                    if (err) {
                        console.log('Failed to add restaurant_image column:', err);
                        return;
                    }
                    console.log('Added restaurant_image column to restaurants.');
                }
            );
        }
    });

    db.query(
        "SELECT * FROM customers WHERE email='admin@example.com'",
        (err, result) => {
            if (err) {
                console.log('Admin user check error:', err);
                return;
            }
            if (!result.length) {
                db.query(
                    "INSERT INTO customers (customer_name, email, password, role) VALUES ('Admin', 'admin@example.com', 'admin123', 'admin')",
                    (err) => {
                        if (err) {
                            console.log('Failed to create admin user:', err);
                        } else {
                            console.log('Admin user created: admin@example.com / admin123');
                        }
                    }
                );
            }
        }
    );
}

initializeAdminRole();



// ======================================
// GET ALL FOODS
// ======================================

app.get('/foods', (req, res) => {

    const sql = `

    SELECT
    food_items.*,
    restaurants.restaurant_name

    FROM food_items

    JOIN restaurants

    ON food_items.restaurant_id =
    restaurants.restaurant_id

    `;


    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            res.json([]);

        }
        else {

            res.json(result);

        }

    });

});




// ======================================
// GET RESTAURANTS
// ======================================

app.get('/restaurants', (req, res) => {

    db.query(

        'SELECT * FROM restaurants',

        (err, result) => {

            if (err) {

                console.log(err);

                res.json([]);

            }
            else {

                console.log('GET /restaurants -> rows (from restaurants handler):', Array.isArray(result) ? result.length : 0);

                res.json(result);

            }

        }

    );

});




// ======================================
// GET RESTAURANT FOODS
// ======================================

app.get(
    '/restaurantfoods/:id',

    (req, res) => {

        const id =
            req.params.id;


        const sql = `

    SELECT *

    FROM food_items

    WHERE restaurant_id = ?

    `;


        db.query(

            sql,

            [id],

            (err, result) => {

                if (err) {

                    console.log(err);

                    res.json([]);

                }
                else {

                    res.json(result);

                }

            }

        );

    });




// ======================================
// GET CUSTOMERS
// ======================================

app.get('/customers', requireAdmin, (req, res) => {

    db.query(

        'SELECT * FROM customers',

        (err, result) => {

            if (err) {

                console.log(err);

                res.json([]);

            }
            else {

                console.log('GET /restaurants -> rows:', Array.isArray(result) ? result.length : 0);


                res.json(result);

            }

        }

    );

});


// ======================================
// ADD RESTAURANT
// ======================================

app.post('/addrestaurant', requireAdmin, (req, res) => {

    const { restaurant_name, location, restaurant_image } = req.body;

    const sql = `

    INSERT INTO restaurants

    (
        restaurant_name,
        location,
        restaurant_image
    )

    VALUES (?, ?, ?)

    `;

    db.query(sql, [restaurant_name, location, restaurant_image], (err, result) => {
        if (err) {
            console.log('Add restaurant error:', err);
            return res.send('Error Adding Restaurant');
        }
        res.send('Restaurant Added');
    });

});


// ======================================
// UPDATE RESTAURANT
// ======================================

app.put('/updaterestaurant/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const { restaurant_name, location, restaurant_image } = req.body;

    const sql = `

    UPDATE restaurants

    SET restaurant_name=?, location=?, restaurant_image=?
    WHERE restaurant_id=?

    `;

    db.query(sql, [restaurant_name, location, restaurant_image, id], (err, result) => {
        if (err) {
            console.log('Update restaurant error:', err);
            return res.send('Error Updating Restaurant');
        }
        res.send('Restaurant Updated');
    });
});


// ======================================
// DELETE RESTAURANT
// ======================================

app.delete('/deleterestaurant/:id', requireAdmin, (req, res) => {

    const id = req.params.id;

    db.query('DELETE FROM restaurants WHERE restaurant_id=?', [id], (err, result) => {
        if (err) {
            console.log('Delete restaurant error:', err);
            return res.send('Delete Failed');
        }
        res.send('Restaurant Deleted');
    });

});


// ======================================
// DELETE USER
// ======================================

app.delete('/deleteuser/:id', requireAdmin, (req, res) => {

    const id = req.params.id;

    db.query('DELETE FROM customers WHERE customer_id=?', [id], (err, result) => {
        if (err) {
            console.log('Delete user error:', err);
            return res.send('Delete Failed');
        }
        res.send('User Deleted');
    });

});




// ======================================
// ADD FOOD
// ======================================

app.post('/addfood', requireAdmin, (req, res) => {

    const {

        food_name,
        category,
        price,
        restaurant_id,
        delivery_time,
        food_image

    } = req.body;


    const sql = `

    INSERT INTO food_items

    (
        food_name,
        category,
        price,
        restaurant_id,
        delivery_time,
        food_image
    )

    VALUES (?, ?, ?, ?, ?, ?)

    `;


    db.query(

        sql,

        [

            food_name,
            category,
            price,
            restaurant_id,
            delivery_time,
            food_image

        ],

        (err, result) => {

            if (err) {

                console.log(err);

                res.send(
                    'Error Adding Food'
                );

            }
            else {

                res.send(
                    'Food Added Successfully'
                );

            }

        }

    );

});




// ======================================
// DELETE FOOD
// ======================================

app.delete(
    '/deletefood/:id',

    (req, res) => {

        const id =
            req.params.id;

        // First remove any dependent orders (to avoid FK constraint errors)
        db.query(
            'DELETE FROM orders WHERE food_id=?',
            [id],
            (err) => {
                if (err) {
                    console.log('Error deleting dependent orders for food', id, err);
                    return res.status(500).send('Delete Failed: could not remove dependent orders');
                }

                // Now delete the food item
                db.query(
                    'DELETE FROM food_items WHERE food_id=?',
                    [id],
                    (err2, result) => {
                        if (err2) {
                            console.log('Error deleting food item', id, err2);
                            return res.status(500).send('Delete Failed');
                        }

                        return res.send('Food Deleted');
                    }
                );
            }
        );

    });




// ======================================
// REGISTER
// ======================================

app.post('/register', (req, res) => {

    const {

        name,
        email,
        password

    } = req.body;


    const sql = `

    INSERT INTO customers
    (
        customer_name,
        email,
        password
    )

    VALUES (?, ?, ?)

    `;


    db.query(

        sql,

        [

            name,
            email,
            password

        ],

        (err, result) => {

            if (err) {

                console.log('Register Error:', err);

                res.send(
                    'Registration Failed'
                );

            }
            else {

                res.send(
                    'Registration Successful'
                );

            }

        }

    );

});




// ======================================
// LOGIN
// ======================================

app.post('/login', (req, res) => {

    const {

        email,
        password

    } = req.body;


    const sql = `

    SELECT *

    FROM customers

    WHERE email=? AND password=?

    `;


    db.query(

        sql,

        [

            email,
            password

        ],

        (err, result) => {

            if (err) {

                console.log('Login Error:', err);

                res.send('Login Failed');

            } else if (result.length > 0) {

                // store user in session
                req.session.user = result[0];

                res.json({
                    message: 'Login Successful',
                    role: result[0].role || 'user'
                });

            } else {

                console.log('No user found for email:', email);

                res.status(401).json({
                    message: 'Invalid Credentials'
                });

            }

        }

    );

});




// ======================================
// LOGOUT
// ======================================

app.get('/logout', (req, res) => {

    req.session.destroy(err => {
        if (err) {
            console.log('Logout error:', err);
            return res.send('Logout Failed');
        }

        res.clearCookie('connect.sid');
        res.send('Logout Successful');
    });

});




// ======================================
// CHECK LOGIN
// ======================================

app.get('/checklogin', (req, res) => {
    const user = req.session.user;
    console.log('GET /checklogin hit, session user:', user);
    if (user) {
        res.json({
            loggedIn: true,
            user: {
                id: user.customer_id,
                name: user.customer_name,
                role: user.role || 'user'
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});




// ======================================
// GET PROFILE
// ======================================

app.get('/api/profile', (req, res) => {
    const user = req.session.user;
    console.log('GET /api/profile hit, session user:', user);
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    db.query(
        'SELECT customer_id, customer_name, email, phone, address, profile_pic, role FROM customers WHERE customer_id = ?',
        [user.customer_id],
        (err, result) => {
            if (err) {
                console.log('Get profile error:', err);
                return res.status(500).json({ message: 'Database Error' });
            }
            if (result.length > 0) {
                console.log('Profile found:', result[0]);
                res.json(result[0]);
            } else {
                console.log('User not found in DB:', user.customer_id);
                res.status(404).json({ message: 'User not found' });
            }
        }
    );
});

// ======================================
// UPDATE PROFILE
// ======================================

app.put('/api/profile', (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { customer_name, phone, address, profile_pic } = req.body;

    const updates = [];
    const params = [];

    if (customer_name !== undefined) {
        updates.push('customer_name = ?');
        params.push(customer_name);
    }
    if (phone !== undefined) {
        updates.push('phone = ?');
        params.push(phone);
    }
    if (address !== undefined) {
        updates.push('address = ?');
        params.push(address);
    }
    if (profile_pic !== undefined) {
        updates.push('profile_pic = ?');
        params.push(profile_pic);
    }

    if (!updates.length) {
        return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(user.customer_id);

    const sql = `UPDATE customers SET ${updates.join(', ')} WHERE customer_id = ?`;

    db.query(sql, params, (err, result) => {
        if (err) {
            console.log('Update profile error:', err);
            return res.status(500).json({ message: 'Failed to update profile' });
        }

        // Fetch the updated user details to update session
        db.query(
            'SELECT * FROM customers WHERE customer_id = ?',
            [user.customer_id],
            (err2, result2) => {
                if (!err2 && result2.length > 0) {
                    req.session.user = result2[0];
                }
                res.json({ message: 'Profile Updated Successfully' });
            }
        );
    });
});




// ======================================
// PLACE ORDER
// ======================================

app.post('/placeorder', (req, res) => {

    const {

        customer_id,
        food_id,
        quantity,
        total_price

    } = req.body;


    const tracking_number =
        'TRK' +
        Math.floor(
            Math.random() * 100000
        );


    const sql = `

    INSERT INTO orders

    (
        customer_id,
        food_id,
        quantity,
        total_price,
        order_status,
        tracking_number
    )

    VALUES (?, ?, ?, ?, ?, ?)

    `;


    db.query(

        sql,

        [

            customer_id,
            food_id,
            quantity,
            total_price,
            'Preparing',
            tracking_number

        ],

        (err, result) => {

            if (err) {

                console.log(err);

                res.json({

                    message:
                        'Order Failed'

                });

            }
            else {

                res.json({

                    message:
                        'Order Placed Successfully',

                    tracking_number

                });

            }

        }

    );

});




// ======================================
// GET ORDERS
// ======================================

app.get('/orders', (req, res) => {

    const user = req.session.user;

    if (!user) {
        return res.json([]);
    }

    let sql = `

    SELECT

    orders.*,

    customers.customer_name,
    customers.address AS delivery_address,

    food_items.food_name

    FROM orders

    JOIN customers

    ON orders.customer_id =
    customers.customer_id

    JOIN food_items

    ON orders.food_id =
    food_items.food_id

    `;

    const params = [];

    if (user.role !== 'admin') {
        sql += `
        WHERE orders.customer_id=?
        `;
        params.push(user.customer_id);
    }

    db.query(

        sql,

        params,

        (err, result) => {

            if (err) {

                console.log(err);

                res.json([]);

            }
            else {

                res.json(result);

            }

        }

    );

});




// ======================================
// UPDATE ORDER STATUS
// ======================================

app.put(
    '/updateorder/:id',
    requireAdmin,
    (req, res) => {

        const id =
            req.params.id;

        const {
            order_status,
            tracking_number
        } = req.body;

        const updates = [];
        const params = [];

        if (order_status !== undefined) {
            updates.push('order_status=?');
            params.push(order_status);
        }
        if (tracking_number !== undefined) {
            updates.push('tracking_number=?');
            params.push(tracking_number);
        }

        if (!updates.length) {
            return res.status(400).send('No fields to update');
        }

        const sql = `

    UPDATE orders

    SET ${updates.join(', ')}

    WHERE order_id=?

    `;

        params.push(id);

        db.query(

            sql,

            params,

            (err, result) => {

                if (err) {

                    console.log(err);

                    res.send(
                        'Update Failed'
                    );

                }
                else {

                    res.send(
                        'Status Updated'
                    );

                }

            }

        );

    });




// ======================================
// SERVER START
// ======================================

app.listen(3000, () => {

    console.log(
        'Server Running On Port 3000'
    );

});