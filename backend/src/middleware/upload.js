import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productUploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'products');
const heroUploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'hero');
fs.mkdirSync(productUploadDirectory, { recursive: true });
fs.mkdirSync(heroUploadDirectory, { recursive: true });

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const extensionByType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const storage = multer.diskStorage({
  destination: productUploadDirectory,
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extensionByType[file.mimetype]}`;
    callback(null, uniqueName);
  }
});

export const productImageUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error('Only JPG, PNG, WebP, and GIF images are allowed');
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  }
});

const allowedVideoTypes = new Set(['video/mp4', 'video/webm']);
const videoExtensionByType = {
  'video/mp4': '.mp4',
  'video/webm': '.webm'
};

const heroVideoStorage = multer.diskStorage({
  destination: heroUploadDirectory,
  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${videoExtensionByType[file.mimetype]}`;
    callback(null, uniqueName);
  }
});

export const heroVideoUpload = multer({
  storage: heroVideoStorage,
  limits: { fileSize: 80 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!allowedVideoTypes.has(file.mimetype)) {
      const error = new Error('Only MP4 and WebM videos are allowed');
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  }
});
