import express from 'express';
import { z } from 'zod';
import { dbQuery } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/store-settings', async (req, res, next) => {
  try {
    const rows = await dbQuery(
      `SELECT setting_key, setting_value FROM site_settings
       WHERE setting_key IN ('shipping_fee')`
    );
    const settings = Object.fromEntries(rows.map((row) => [row.setting_key, Number(row.setting_value)]));
    res.json({ settings: { shipping_fee: settings.shipping_fee ?? 450, free_shipping_threshold: 15000 } });
  } catch (error) {
    next(error);
  }
});

router.put('/store-settings', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = z.object({ shipping_fee: z.number().min(0).max(100000) }).parse(req.body);
    await dbQuery(
      `INSERT INTO site_settings (setting_key, setting_value) VALUES ('shipping_fee', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [String(data.shipping_fee)]
    );
    res.json({ settings: { shipping_fee: data.shipping_fee, free_shipping_threshold: 15000 } });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.issues[0].message });
    next(error);
  }
});

router.get('/stats', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [sales] = await dbQuery('SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders');
    const [products] = await dbQuery('SELECT COUNT(*) AS products, COALESCE(SUM(stock), 0) AS stock FROM products WHERE is_active = 1');
    const recentOrders = await dbQuery(
      `SELECT order_code, customer_name, order_status, total, created_at
       FROM orders ORDER BY created_at DESC LIMIT 5`
    );
    const lowStock = await dbQuery(
      `SELECT id, name, stock FROM products WHERE is_active = 1 AND stock <= 10 ORDER BY stock ASC LIMIT 8`
    );
    res.json({ stats: { ...sales, ...products }, recentOrders, lowStock });
  } catch (error) {
    next(error);
  }
});

export default router;
