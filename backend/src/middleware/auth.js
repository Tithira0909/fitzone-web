import jwt from 'jsonwebtoken';
import { dbQuery } from '../config/db.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const users = await dbQuery(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
      [payload.id]
    );
    if (!users.length) return res.status(401).json({ message: 'Invalid token' });
    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const users = await dbQuery(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
      [payload.id]
    );
    if (users.length) req.user = users[0];
    next();
  } catch {
    next();
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
