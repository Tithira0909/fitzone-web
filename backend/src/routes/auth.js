import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { dbQuery } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(6).optional().or(z.literal(''))
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await dbQuery('SELECT id FROM users WHERE email = ?', [data.email]);
    if (existing.length) return res.status(409).json({ message: 'Email is already registered' });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = await dbQuery(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.email, passwordHash, data.phone || null, 'customer']
    );
    const users = await dbQuery('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?', [result.insertId]);
    const token = signToken(users[0]);
    res.status(201).json({ user: users[0], token });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors[0].message });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const users = await dbQuery('SELECT * FROM users WHERE email = ?', [data.email]);
    if (!users.length) return res.status(401).json({ message: 'Invalid email or password' });

    const user = users[0];
    const ok = await bcrypt.compare(data.password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, created_at: user.created_at };
    const token = signToken(safeUser);
    res.json({ user: safeUser, token });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.errors[0].message });
    next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
