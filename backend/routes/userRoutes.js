import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { verifyToken } from '../auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email profilePhoto role');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { username, email, profilePhoto } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const existing = await User.findOne({
      _id: { $ne: req.user.id },
      $or: [{ username }, { email }]
    });
    if (existing) {
      return res.status(400).json({ error: 'Username or email already in use' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { username, email, profilePhoto },
      { new: true, runValidators: true }
    ).select('username email profilePhoto role');
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
