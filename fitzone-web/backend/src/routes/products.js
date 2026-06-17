import express from 'express';
import { z } from 'zod';
import { dbQuery, pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { productImageUpload } from '../middleware/upload.js';

const router = express.Router();

const productSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().min(2),
  ingredients: z.string().optional().or(z.literal('')),
  usage_notes: z.string().optional().or(z.literal('')),
  price: z.number().positive(),
  compare_at_price: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  rating: z.number().min(0).max(5).optional(),
  review_count: z.number().int().min(0).optional(),
  image_url: z.string().optional().or(z.literal('')),
  images: z.array(z.string().min(1)).max(10).optional(),
  is_active: z.boolean().optional()
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review_text: z.string().trim().max(1000).optional().or(z.literal(''))
});

const salesSelect = `
  COALESCE((
    SELECT SUM(oi.quantity)
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = p.id AND o.order_status <> 'cancelled'
  ), 0) AS purchase_count
`;

async function attachImages(products) {
  if (!products.length) return products;
  const ids = products.map((product) => product.id);
  const placeholders = ids.map(() => '?').join(',');
  const images = await dbQuery(
    `SELECT product_id, image_url FROM product_images
     WHERE product_id IN (${placeholders})
     ORDER BY product_id, sort_order, id`,
    ids
  );
  const byProduct = new Map();
  for (const image of images) {
    const gallery = byProduct.get(image.product_id) || [];
    gallery.push(image.image_url);
    byProduct.set(image.product_id, gallery);
  }
  return products.map((product) => {
    const gallery = byProduct.get(product.id) || [];
    if (!gallery.length && product.image_url) gallery.push(product.image_url);
    return { ...product, images: gallery };
  });
}

async function saveProductImages(connection, productId, images) {
  await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
  for (const [index, imageUrl] of images.entries()) {
    await connection.execute(
      'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
      [productId, imageUrl, index]
    );
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { search = '', category = '', sort = 'featured' } = req.query;
    const params = [];
    let sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug, ${salesSelect}
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1
    `;

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND c.slug = ?';
      params.push(category);
    }

    const sortMap = {
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
      newest: 'p.created_at DESC',
      featured: 'p.id ASC'
    };
    sql += ` ORDER BY ${sortMap[sort] || sortMap.featured}`;

    const products = await attachImages(await dbQuery(sql, params));
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/all', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const products = await attachImages(await dbQuery(
      `SELECT p.*, c.name AS category_name, ${salesSelect}
       FROM products p JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    ));
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/images', requireAuth, requireAdmin, productImageUpload.array('images', 10), (req, res) => {
  const images = (req.files || []).map((file) => (
    `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`
  ));
  if (!images.length) return res.status(400).json({ message: 'Select at least one image' });
  res.status(201).json({ images });
});

router.post('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const data = productSchema.parse(req.body);
    const images = data.images?.length ? data.images : (data.image_url ? [data.image_url] : []);
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO products
       (category_id, name, slug, description, ingredients, usage_notes, price, compare_at_price, stock, rating, review_count, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.category_id, data.name, data.slug, data.description, data.ingredients || null, data.usage_notes || null, data.price, data.compare_at_price || null, data.stock, data.rating || 0, data.review_count || 0, images[0] || null, data.is_active === false ? 0 : 1]
    );
    await saveProductImages(connection, result.insertId, images);
    await connection.commit();
    const [product] = await attachImages(await dbQuery('SELECT * FROM products WHERE id = ?', [result.insertId]));
    res.status(201).json({ product });
  } catch (error) {
    await connection.rollback();
    if (error.name === 'ZodError') return res.status(400).json({ message: error.issues[0].message });
    next(error);
  } finally {
    connection.release();
  }
});

router.put('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const data = productSchema.parse(req.body);
    const images = data.images?.length ? data.images : (data.image_url ? [data.image_url] : []);
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE products SET
       category_id=?, name=?, slug=?, description=?, ingredients=?, usage_notes=?, price=?, compare_at_price=?, stock=?, rating=?, review_count=?, image_url=?, is_active=?
       WHERE id=?`,
      [data.category_id, data.name, data.slug, data.description, data.ingredients || null, data.usage_notes || null, data.price, data.compare_at_price || null, data.stock, data.rating || 0, data.review_count || 0, images[0] || null, data.is_active === false ? 0 : 1, req.params.id]
    );
    await saveProductImages(connection, req.params.id, images);
    await connection.commit();
    const [product] = await attachImages(await dbQuery('SELECT * FROM products WHERE id = ?', [req.params.id]));
    res.json({ product });
  } catch (error) {
    await connection.rollback();
    if (error.name === 'ZodError') return res.status(400).json({ message: error.issues[0].message });
    next(error);
  } finally {
    connection.release();
  }
});

router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await dbQuery('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product disabled' });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const products = await attachImages(await dbQuery(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, ${salesSelect}
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`,
      [req.params.slug]
    ));
    if (!products.length) return res.status(404).json({ message: 'Product not found' });
    const reviews = await dbQuery(
      `SELECT pr.id, pr.rating, pr.review_text, pr.created_at, pr.updated_at,
              u.id AS user_id, u.name AS customer_name
       FROM product_reviews pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.product_id = ?
       ORDER BY pr.updated_at DESC
       LIMIT 50`,
      [products[0].id]
    );
    res.json({ product: { ...products[0], reviews } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reviews', requireAuth, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const data = reviewSchema.parse(req.body);
    const [products] = await connection.execute(
      'SELECT id FROM products WHERE id = ? AND is_active = 1',
      [req.params.id]
    );
    if (!products.length) return res.status(404).json({ message: 'Product not found' });

    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO product_reviews (product_id, user_id, rating, review_text)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         review_text = VALUES(review_text),
         updated_at = CURRENT_TIMESTAMP`,
      [req.params.id, req.user.id, data.rating, data.review_text || null]
    );
    await connection.execute(
      `UPDATE products p
       SET p.rating = (
         SELECT COALESCE(ROUND(AVG(pr.rating), 1), 0)
         FROM product_reviews pr WHERE pr.product_id = p.id
       ),
       p.review_count = (
         SELECT COUNT(*) FROM product_reviews pr WHERE pr.product_id = p.id
       )
       WHERE p.id = ?`,
      [req.params.id]
    );
    await connection.commit();

    const [review] = await dbQuery(
      `SELECT pr.id, pr.rating, pr.review_text, pr.created_at, pr.updated_at,
              u.id AS user_id, u.name AS customer_name
       FROM product_reviews pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.product_id = ? AND pr.user_id = ?`,
      [req.params.id, req.user.id]
    );
    const [summary] = await dbQuery(
      'SELECT rating, review_count FROM products WHERE id = ?',
      [req.params.id]
    );
    res.json({ review, summary });
  } catch (error) {
    await connection.rollback();
    if (error.name === 'ZodError') return res.status(400).json({ message: error.issues[0].message });
    next(error);
  } finally {
    connection.release();
  }
});

export default router;
