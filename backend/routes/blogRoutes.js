import express from 'express';
import Blog from '../models/blogModel.js';
import { verifyToken } from '../auth.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Visit from '../models/Visit.js';

const normalizeSource = (referrer) => {
  if (!referrer) return 'Direct';
  const lower = referrer.toLowerCase();
  if (lower.includes('google.') || lower.includes('bing.') || lower.includes('yahoo.')) return 'Google search';
  if (lower.includes('twitter.com') || lower.includes('x.com') || lower.includes('facebook.com') || lower.includes('linkedin.com') || lower.includes('instagram.com')) {
    return 'Social media';
  }
  return 'Other websites';
};

const getSearchKeyword = (referrer) => {
  if (!referrer) return '';
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (host.includes('google.') || host.includes('bing.') || host.includes('yahoo.')) {
      return url.searchParams.get('q') || url.searchParams.get('p') || '';
    }
  } catch (err) {
    return '';
  }
  return '';
};

const getDeviceType = (userAgent) => {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
  if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) return 'Mobile';
  return 'Desktop';
};

const router = express.Router();

// Create a new blog
router.post('/', async (req, res) => {
  const { title, content, author, status } = req.body;
  if (!title || !content || !author) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (status && !['published', 'unpublished'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    // estimate readTime (words per minute = 200)
    let readTime = 0;
    try {
      const parsed = JSON.parse(content);
      const text = parsed
        .map((b) => (b.type === 'text' ? b.text : b.type === 'image' ? (b.desc || '') : ''))
        .join(' ');
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      readTime = Math.max(1, Math.round(words / 200));
    } catch (e) {
      const words = String(content).trim().split(/\s+/).filter(Boolean).length;
      readTime = Math.max(1, Math.round(words / 200));
    }
    const publishedAt = status === 'published' ? new Date() : null;
    const blog = new Blog({ title, content, author, readTime, publishedAt, status: status || 'published' });
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all blogs
router.get('/', async (req, res) => {
  try {
    // Only return published posts for public listing
    const blogs = await Blog.find({ status: 'published' }).sort({ createdAt: -1 });
    const admins = await User.find({ role: 'admin' }).select('username');
    const adminNames = new Set(admins.map((a) => a.username));
    const result = blogs.map((b) => {
      const obj = b.toObject();
      obj.authorRole = adminNames.has(obj.author) ? 'admin' : 'user';
      return obj;
    });
    // debug logging to help verify drafts are excluded
    try {
      console.log(`[blogs] GET /api/blogs -> returning ${blogs.length} posts`);
      const ids = blogs.map((b) => `${b._id}:${b.status}`);
      console.log('[blogs] ids:', ids.join(', '));
    } catch (e) {
      // ignore logging errors
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single blog by ID
router.get('/:id', async (req, res) => {
  try {
    // Only allow fetching published posts via public API
    const blog = await Blog.findOneAndUpdate(
      { _id: req.params.id, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    );
    try {
      console.log(`[blogs] GET /api/blogs/${req.params.id} -> ${blog ? 'found published' : 'not found or draft'}`);
    } catch (e) {}
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    const admins = await User.find({ role: 'admin' }).select('username');
    const adminNames = new Set(admins.map((a) => a.username));
    const obj = blog.toObject();
    obj.authorRole = adminNames.has(obj.author) ? 'admin' : 'user';
    try {
      const referrer = req.get('referer') || '';
      const userAgent = req.get('user-agent') || '';
      const visitorId = `${req.ip || 'unknown'}|${userAgent}`;
      await Visit.create({
        blogId: blog._id,
        visitorId,
        source: normalizeSource(referrer),
        referrer,
        searchKeyword: getSearchKeyword(referrer),
        deviceType: getDeviceType(userAgent),
        userAgent
      });
    } catch (err) {
      // ignore visit logging errors
    }
    res.json(obj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get comments for a blog (only approved public comments)
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.id, status: 'approved' }).sort({ createdAt: 1 });
    const admins = await User.find({ role: 'admin' }).select('username profilePhoto');
    const adminById = Object.fromEntries(admins.map((a) => [String(a._id), a]));
    const adminIds = new Set(admins.map((a) => String(a._id)));
    // build nested structure
    const byId = {};
    comments.forEach(c => {
      const base = { ...c.toObject(), replies: [] };
      const authorId = String(c.authorId || '');
      const isAdminAuthor = adminIds.has(authorId);
      base.authorRole = base.authorRole || (isAdminAuthor ? 'admin' : 'user');

      // if any admin liked, attach first admin avatar + name
      const likedBy = Array.isArray(c.likedBy) ? c.likedBy.map((id) => String(id)) : [];
      const adminLikeId = likedBy.find((id) => adminIds.has(id));
      if (adminLikeId) {
        const admin = adminById[adminLikeId];
        if (admin) {
          base.adminLikeName = admin.username;
          base.adminLikePhoto = admin.profilePhoto || '';
        }
      }
      byId[c._id] = base;
    });
    const roots = [];
    comments.forEach(c => {
      if (c.parentId) {
        if (byId[c.parentId]) byId[c.parentId].replies.push(byId[c._id]);
      } else {
        roots.push(byId[c._id]);
      }
    });
    res.json(roots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a comment or reply (auth required)
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const comment = await Comment.create({
      blogId: req.params.id,
      parentId: parentId || null,
      author: req.user.username,
      authorId: req.user.id,
      authorRole: req.user.role || 'user',
      content,
      status: 'approved'
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle like for a blog (requires auth)
router.post('/:id/like', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    const liked = (blog.likedBy || []).includes(userId);
    if (liked) {
      blog.likedBy = blog.likedBy.filter((id) => id !== userId);
      blog.likes = Math.max(0, blog.likes - 1);
    } else {
      blog.likedBy = blog.likedBy.concat(userId);
      blog.likes = (blog.likes || 0) + 1;
    }
    await blog.save();
    res.json({ likes: blog.likes, liked: !liked });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle bookmark for a blog (requires auth)
router.post('/:id/bookmark', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    const bookmarked = (blog.bookmarks || []).includes(userId);
    if (bookmarked) {
      blog.bookmarks = blog.bookmarks.filter((id) => id !== userId);
    } else {
      blog.bookmarks = blog.bookmarks.concat(userId);
    }
    await blog.save();
    res.json({ bookmarks: blog.bookmarks });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get saved posts for current authenticated user
router.get('/saved', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await Blog.find({ bookmarks: userId }).sort({ createdAt: -1 }).select('title author createdAt readTime likes bookmarks');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a blog by ID
router.put('/:id', async (req, res) => {
  const { title, content, author, status } = req.body;
  if (status && !['published', 'unpublished'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const update = { title, content, author, updatedAt: Date.now() };
    if (typeof status !== 'undefined') {
      update.status = status;
      if (status === 'published') update.publishedAt = new Date();
      else if (status === 'unpublished') update.publishedAt = null;
    }
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a blog by ID
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
