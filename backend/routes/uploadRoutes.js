import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken, requireAdmin } from '../auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'server', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage });

// POST /api/uploads - single file upload (admin only)
router.post('/', verifyToken, requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // return filename and accessible url path
  res.json({ filename: req.file.filename, url: `/uploads/${req.file.filename}` });
});

// POST /api/uploads/profile - single file upload (any signed-in user)
router.post('/profile', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ filename: req.file.filename, url: `/uploads/${req.file.filename}` });
});

// DELETE /api/uploads/:filename - delete uploaded file
router.delete('/:filename', verifyToken, requireAdmin, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'server', 'uploads', filename);
  try {
    fs.unlinkSync(filePath);
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(404).json({ error: 'File not found' });
  }
});

export default router;
