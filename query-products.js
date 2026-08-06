const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'didoxx' });

db.connect(err => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const sql = `SELECT p.id AS product_id, p.name, p.slug, p.description, p.brand_id, p.category_id, p.price, p.sale_price AS final_price, p.stock_quantity AS stock, p.image_url AS images, p.is_active, p.created_at, b.id AS brand_id, b.name AS brand_name, b.logo_url AS brand_image, b.description AS brand_story FROM products p LEFT JOIN brands b ON p.brand_id = b.id`;

  db.query(sql, (e, result) => {
    console.log('error', e);
    console.log('result', JSON.stringify(result, null, 2));
    db.end();
  });
});
