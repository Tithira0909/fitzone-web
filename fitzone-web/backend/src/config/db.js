import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vitacart_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z'
});

export async function dbQuery(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function initializeDatabase() {
  const [ratingColumns] = await pool.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
       AND COLUMN_NAME IN ('rating', 'review_count')`
  );
  const existingColumns = new Set(ratingColumns.map((column) => column.COLUMN_NAME));
  if (!existingColumns.has('rating')) {
    await pool.execute('ALTER TABLE products ADD COLUMN rating DECIMAL(2,1) NOT NULL DEFAULT 0 AFTER stock');
  }
  if (!existingColumns.has('review_count')) {
    await pool.execute('ALTER TABLE products ADD COLUMN review_count INT NOT NULL DEFAULT 0 AFTER rating');
  }
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_product_images_product_sort (product_id, sort_order)
    ) ENGINE=InnoDB
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      rating TINYINT NOT NULL,
      review_text TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_product_reviews_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_product_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uq_product_reviews_user_product (product_id, user_id),
      INDEX idx_product_reviews_product_updated (product_id, updated_at)
    ) ENGINE=InnoDB
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  await pool.execute(
    `INSERT INTO site_settings (setting_key, setting_value)
     VALUES ('shipping_fee', '450')
     ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key)`
  );
}
