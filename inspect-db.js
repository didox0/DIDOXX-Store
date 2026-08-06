const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'didoxx' });

db.connect(err => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  db.query('SHOW TABLES LIKE "products"', (e, result) => {
    if (e) {
      console.error(e);
      db.end();
      return;
    }

    console.log('products table exists', JSON.stringify(result));
    if (result && result.length) {
      db.query('DESCRIBE products', (e2, cols) => {
        if (e2) {
          console.error(e2);
        } else {
          console.log(JSON.stringify(cols, null, 2));
        }
        db.end();
      });
    } else {
      db.end();
    }
  });
});
