import express from 'express';
import bcrypt from 'bcryptjs';
import Blog from '../models/blogModel.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import SiteSetting from '../models/SiteSetting.js';
import { requireAdmin, verifyToken } from '../auth.js';
import Visit from '../models/Visit.js';

const router = express.Router();

router.use(verifyToken, requireAdmin);

const parseDateStart = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseDateEnd = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
};

router.get('/overview', async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id).select('username profilePhoto lastLoginAt');

    const [
      totalPosts,
      totalUsers,
      totalComments,
      pendingComments,
      likesAgg,
      recentPosts,
      recentComments,
      recentUsers
    ] = await Promise.all([
      Blog.countDocuments(),
      User.countDocuments(),
      Comment.countDocuments(),
      Comment.countDocuments({ status: 'pending' }),
      Blog.aggregate([{ $group: { _id: null, totalLikes: { $sum: { $ifNull: ['$likes', 0] } } } }]),
      Blog.find().sort({ createdAt: -1 }).limit(5).select('title author createdAt'),
      Comment.find().sort({ createdAt: -1 }).limit(5).select('author content status createdAt'),
      User.find().sort({ createdAt: -1 }).limit(5).select('username email role createdAt')
    ]);

    res.json({
      welcome: {
        adminName: adminUser?.username || 'Admin',
        profilePhoto: adminUser?.profilePhoto || '',
        lastLoginAt: adminUser?.lastLoginAt || null,
        pendingComments
      },
      stats: {
        totalPosts,
        totalUsers,
        totalComments,
        totalLikes: likesAgg[0]?.totalLikes || 0,
        pendingComments
      },
      recentActivity: {
        posts: recentPosts,
        comments: recentComments,
        users: recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/posts', async (req, res) => {
  try {
    const { search = '', author = '', fromDate = '', toDate = '', status = '' } = req.query;
    const filters = {};

    if (search) {
      filters.title = { $regex: search, $options: 'i' };
    }
    if (author) {
      filters.author = { $regex: `^${author}$`, $options: 'i' };
    }
    if (status) {
      filters.status = status;
    }

    const startDate = parseDateStart(fromDate);
    const endDate = parseDateEnd(toDate);
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = startDate;
      if (endDate) filters.createdAt.$lte = endDate;
    }

    const posts = await Blog.find(filters).sort({ createdAt: -1 });
    const authors = await Blog.distinct('author');
    res.json({ posts, authors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/posts/:id', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const post = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, content, author, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/posts/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['published', 'unpublished'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const update = { status, updatedAt: new Date() };
    if (status === 'published') {
      update.publishedAt = new Date();
    } else if (status === 'unpublished') {
      // keep the post in DB as a draft, clear publishedAt so it's treated as a draft
      update.publishedAt = null;
    }
    const post = await Blog.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const post = await Blog.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await Comment.deleteMany({ blogId: post._id });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/comments', async (req, res) => {
  try {
    const { status = '' } = req.query;
    const filter = status ? { status } : {};
    const comments = await Comment.find(filter).sort({ createdAt: -1 }).limit(100);

    const blogIds = comments.map((comment) => comment.blogId);
    const blogs = await Blog.find({ _id: { $in: blogIds } }).select('title');
    const blogTitleMap = Object.fromEntries(blogs.map((blog) => [String(blog._id), blog.title]));

    const result = comments.map((comment) => ({
      ...comment.toObject(),
      postTitle: blogTitleMap[String(comment.blogId)] || 'Unknown Post'
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/comments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid comment status' });
    }
    const comment = await Comment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30Days = new Date(now);
    startOf30Days.setDate(startOf30Days.getDate() - 30);

    const [
      totalVisits,
      visitsToday,
      visitsWeek,
      visitsMonth,
      uniqueVisitorsAll,
      uniqueVisitors30Days,
      trafficSourceAgg,
      deviceAgg,
      keywordAgg,
      dailyAgg,
      commentsCount,
      likesAgg,
      posts
    ] = await Promise.all([
      Visit.countDocuments(),
      Visit.countDocuments({ visitedAt: { $gte: startOfDay } }),
      Visit.countDocuments({ visitedAt: { $gte: startOfWeek } }),
      Visit.countDocuments({ visitedAt: { $gte: startOfMonth } }),
      Visit.distinct('visitorId'),
      Visit.distinct('visitorId', { visitedAt: { $gte: startOf30Days } }),
      Visit.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
      Visit.aggregate([{ $group: { _id: '$deviceType', count: { $sum: 1 } } }]),
      Visit.aggregate([
        { $match: { searchKeyword: { $ne: '' } } },
        { $group: { _id: '$searchKeyword', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Visit.aggregate([
        { $match: { visitedAt: { $gte: startOfWeek } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitedAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Comment.countDocuments(),
      Blog.aggregate([{ $group: { _id: null, totalLikes: { $sum: { $ifNull: ['$likes', 0] } } } }]),
      Blog.find().select('title views readTime likes')
    ]);

    const pageViews = posts
      .map((p) => ({ title: p.title, views: p.views || 0, readTime: p.readTime || 0, likes: p.likes || 0 }))
      .sort((a, b) => b.views - a.views);

    const topPosts = pageViews.slice(0, 5);

    const totalViews = pageViews.reduce((sum, p) => sum + (p.views || 0), 0);
    const weightedReadTime = pageViews.reduce((sum, p) => sum + (p.readTime || 0) * (p.views || 0), 0);
    const avgReadTime = totalViews ? Math.round((weightedReadTime / totalViews) * 100) / 100 : 0;

    const visitorCounts = await Visit.aggregate([
      { $match: { visitedAt: { $gte: startOf30Days } } },
      { $group: { _id: '$visitorId', count: { $sum: 1 } } }
    ]);
    const bounceCount = visitorCounts.filter((v) => v.count === 1).length;
    const bounceRate = visitorCounts.length ? Math.round((bounceCount / visitorCounts.length) * 100) : 0;

    const dailyTraffic = dailyAgg.map((d) => ({ date: d._id, visits: d.count }));

    res.json({
      totalVisits,
      uniqueVisitors: uniqueVisitorsAll.length,
      visitsToday,
      visitsWeek,
      visitsMonth,
      pageViews,
      topPosts,
      trafficSource: trafficSourceAgg.map((s) => ({ source: s._id || 'Direct', visitors: s.count })),
      dailyTraffic,
      averageReadTime: avgReadTime,
      bounceRate,
      deviceType: deviceAgg.map((d) => ({ device: d._id || 'Desktop', percent: d.count })),
      searchKeywords: keywordAgg.map((k) => ({ keyword: k._id, count: k.count })),
      engagement: {
        comments: commentsCount,
        likes: likesAgg[0]?.totalLikes || 0,
        shares: 0
      },
      activeVisitors30Days: uniqueVisitors30Days.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get posts that have been bookmarked by any user
router.get('/saved', async (req, res) => {
  try {
    const posts = await Blog.find({ bookmarks: { $exists: true, $ne: [] } }).sort({ createdAt: -1 }).select('title author bookmarks createdAt likes');
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('username email profilePhoto');
    let site = await SiteSetting.findOne();
    if (!site) {
      site = await SiteSetting.create({ blogTitle: 'Simple Blog' });
    }
    res.json({
      profile: admin,
      site: {
        blogTitle: site.blogTitle
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings/profile', async (req, res) => {
  try {
    const { username, profilePhoto } = req.body;
    const admin = await User.findByIdAndUpdate(
      req.user.id,
      { username, profilePhoto },
      { new: true, runValidators: true }
    ).select('username email profilePhoto');
    res.json(admin);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/settings/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }
    const admin = await User.findById(req.user.id);
    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/settings/site', async (req, res) => {
  try {
    const { blogTitle } = req.body;
    let site = await SiteSetting.findOne();
    if (!site) {
      site = await SiteSetting.create({ blogTitle: blogTitle || 'Simple Blog' });
    } else {
      site.blogTitle = blogTitle || site.blogTitle;
      site.updatedAt = new Date();
      await site.save();
    }
    res.json({ blogTitle: site.blogTitle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
