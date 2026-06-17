import express from 'express';
import { z } from 'zod';
import { pool, dbQuery } from '../config/db.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { computeShipping, makeOrderCode } from '../utils/order.js';

const router = express.Router();

const itemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99)
});

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1),
  customer_name: z.string().min(2),
  customer_email: z.string().email(),
  customer_phone: z.string().min(6),
  shipping_address: z.string().min(10),
  city: z.string().min(2),
  notes: z.string().optional().or(z.literal('')),
  payment_method: z.string().refine((value) => value === 'cash_on_delivery', {
    message: 'Only cash on delivery is currently available'
  })
});

router.post('/checkout', optionalAuth, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const data = checkoutSchema.parse(req.body);
    const productIds = data.items.map((item) => item.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await connection.execute(
      `SELECT id, name, price, stock FROM products WHERE id IN (${placeholders}) AND is_active = 1`,
      productIds
    );

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'Some products are unavailable' });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const product = productMap.get(item.product_id);
      if (product.stock < item.quantity) {
        const error = new Error(`${product.name} has only ${product.stock} in stock`);
        error.statusCode = 400;
        throw error;
      }
      const lineTotal = Number(product.price) * item.quantity;
      subtotal += lineTotal;
      return { ...item, product_name: product.name, unit_price: Number(product.price), line_total: lineTotal };
    });

    const [shippingSetting] = await connection.execute(
      `SELECT setting_value FROM site_settings WHERE setting_key = 'shipping_fee' LIMIT 1`
    );
    const shipping = computeShipping(subtotal, shippingSetting[0]?.setting_value);
    const total = subtotal + shipping;
    const orderCode = makeOrderCode();
    const status = 'processing';

    await connection.beginTransaction();
    const [orderResult] = await connection.execute(
      `INSERT INTO orders
       (order_code, user_id, customer_name, customer_email, customer_phone, shipping_address, city, notes, payment_method, payment_status, order_status, subtotal, shipping_fee, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderCode, req.user?.id || null, data.customer_name, data.customer_email, data.customer_phone, data.shipping_address, data.city, data.notes || null, data.payment_method, 'unpaid', status, subtotal, shipping, total]
    );

    for (const item of orderItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total]
      );
      await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await connection.commit();
    res.status(201).json({ order: { id: orderResult.insertId, order_code: orderCode, total, subtotal, shipping_fee: shipping, payment_method: data.payment_method, order_status: status } });
  } catch (error) {
    await connection.rollback();
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors[0].message });
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const orders = await dbQuery(
      `SELECT id, order_code, payment_method, payment_status, order_status, subtotal, shipping_fee, total, created_at
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

router.get('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await dbQuery(
      `SELECT id, order_code, customer_name, customer_email, customer_phone, city, payment_method, payment_status, order_status, total, created_at
       FROM orders ORDER BY created_at DESC LIMIT 200`
    );
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await dbQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ message: 'Order not found' });
    const items = await dbQuery('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ order: orders[0], items });
  } catch (error) {
    next(error);
  }
});

router.patch('/admin/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      order_status: z.enum(['pending_payment', 'processing', 'packed', 'shipped', 'delivered', 'cancelled']),
      payment_status: z.enum(['unpaid', 'paid', 'refunded']).optional()
    });
    const data = schema.parse(req.body);
    await dbQuery(
      'UPDATE orders SET order_status = ?, payment_status = COALESCE(?, payment_status) WHERE id = ?',
      [data.order_status, data.payment_status || null, req.params.id]
    );
    const rows = await dbQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json({ order: rows[0] });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors[0].message });
    next(error);
  }
});

export default router;
