import express from 'express';
import Comment from '../models/Comment.js';
import { verifyToken } from '../auth.js';

const router = express.Router();

// Edit a comment (author or admin)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Comment not found' });
    if (c.authorId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed' });
    c.content = req.body.content || c.content;
    c.updatedAt = new Date();
    await c.save();
    res.json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a comment (author or admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Comment not found' });
    if (c.authorId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not allowed' });
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle like on a comment
router.post('/:id/like', verifyToken, async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Comment not found' });
    const idx = (c.likedBy || []).indexOf(req.user.id);
    if (idx >= 0) c.likedBy.splice(idx, 1);
    else c.likedBy.push(req.user.id);
    await c.save();
    res.json({ likes: c.likedBy.length, likedBy: c.likedBy });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Report a comment
router.post('/:id/report', verifyToken, async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Comment not found' });
    c.reports = c.reports || [];
    // prevent duplicate reports by same user
    if (!c.reports.find(r => r.userId === req.user.id)) {
      c.reports.push({ userId: req.user.id, reason, createdAt: new Date() });
      await c.save();
    }
    res.json({ message: 'Reported' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
