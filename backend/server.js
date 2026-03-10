import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import SiteSetting from './models/SiteSetting.js';
import { createAdmin } from './createAdmin.js';

dotenv.config();

const app = express();
app.use(cors());
// log content-length for blog POSTs to help debug large payloads
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.startsWith('/api/blogs')) {
    const len = req.headers['content-length'] || 'unknown';
    console.log(`[uploads] Incoming /api/blogs POST content-length: ${len}`);
  }
  next();
});
// allow larger JSON payloads (e.g. posts with many blocks)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// serve uploaded files
app.use('/uploads', express.static(uploadsDir));

app.use('/', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/blogs', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/comments', commentRoutes);

// Public endpoint to get site settings (blog title)
app.get('/api/settings/site', async (req, res) => {
    try {
        let site = await SiteSetting.findOne();
        if (!site) {
            site = await SiteSetting.create({ blogTitle: 'Simple Blog' });
        }
        res.json({ blogTitle: site.blogTitle });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await createAdmin();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
