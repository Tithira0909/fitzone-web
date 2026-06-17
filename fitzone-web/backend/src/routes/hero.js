import express from 'express';
import fs from 'fs/promises';
import { z } from 'zod';
import { dbQuery } from '../config/db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { heroVideoUpload } from '../middleware/upload.js';

const router = express.Router();
const heroKeys = ['hero_video_desktop', 'hero_video_mobile'];

async function hasValidVideoSignature(file) {
  const handle = await fs.open(file.path, 'r');
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, buffer.length, 0);
    if (file.mimetype === 'video/mp4') return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
    if (file.mimetype === 'video/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    return false;
  } finally {
    await handle.close();
  }
}

async function getHeroSettings() {
  const rows = await dbQuery(
    `SELECT setting_key, setting_value FROM site_settings
     WHERE setting_key IN (?, ?)`,
    heroKeys
  );
  const settings = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
  return {
    desktop_video_url: settings.hero_video_desktop || '',
    mobile_video_url: settings.hero_video_mobile || ''
  };
}

router.get('/', async (req, res, next) => {
  try {
    res.json({ hero: await getHeroSettings() });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/upload', requireAuth, requireAdmin, heroVideoUpload.single('video'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: 'Select an MP4 or WebM video' });
  try {
    if (!await hasValidVideoSignature(req.file)) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ message: 'The uploaded file is not a valid MP4 or WebM video' });
    }
    const videoUrl = `${req.protocol}://${req.get('host')}/uploads/hero/${req.file.filename}`;
    res.status(201).json({ video_url: videoUrl });
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => {});
    next(error);
  }
});

router.put('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = z.object({
      desktop_video_url: z.string().max(1000).optional().or(z.literal('')),
      mobile_video_url: z.string().max(1000).optional().or(z.literal(''))
    }).parse(req.body);

    const values = [
      ['hero_video_desktop', data.desktop_video_url || null],
      ['hero_video_mobile', data.mobile_video_url || null]
    ];
    for (const [key, value] of values) {
      await dbQuery(
        `INSERT INTO site_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value]
      );
    }
    res.json({ hero: await getHeroSettings() });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ message: error.issues[0].message });
    next(error);
  }
});

export default router;
