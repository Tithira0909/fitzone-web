import express from 'express';
import { z } from 'zod';
import { dbQuery } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const categorySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(140).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional().or(z.literal(''))
});

router.get('/', async (req, res, next) => {
  try {
    const categories = await dbQuery(
      `SELECT c.id, c.name, c.slug, c.description, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       GROUP BY c.id, c.name, c.slug, c.description
       ORDER BY c.name`
    );
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

router.post('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const result = await dbQuery(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [data.name, data.slug, data.description || null]
    );
    const rows = await dbQuery('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ category: rows[0] });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors[0].message });
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Category slug already exists' });
    next(error);
  }
});

router.put('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    await dbQuery(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [data.name, data.slug, data.description || null, req.params.id]
    );
    const rows = await dbQuery('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Category not found' });
    res.json({ category: rows[0] });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors[0].message });
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Category slug already exists' });
    next(error);
  }
});

router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [{ product_count }] = await dbQuery(
      'SELECT COUNT(*) AS product_count FROM products WHERE category_id = ?',
      [req.params.id]
    );
    if (Number(product_count) > 0) {
      return res.status(409).json({ message: 'Move or remove products in this category before deleting it' });
    }
    const result = await dbQuery('DELETE FROM categories WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
