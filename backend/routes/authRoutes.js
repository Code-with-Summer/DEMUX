import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../auth.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { username, email, password, role, profilePhoto } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const safeRole = role === 'admin' && email === 'admin@gmail.com' ? 'admin' : 'user';
    const user = new User({
      username,
      email,
      password: hashed,
      role: safeRole,
      profilePhoto: profilePhoto || ''
    });
    console.log('Creating user with role:', user.role);
    await user.save();
    console.log('User saved with role:', user.role);
    const token = generateToken(user);
    console.log('Signup - JWT:', token, 'Email:', email);
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Signin
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });
    
    // Ensure role is set
    if (!user.role) {
      console.log('User role missing, setting to:', user.email === 'admin@gmail.com' ? 'admin' : 'user');
      user.role = user.email === 'admin@gmail.com' ? 'admin' : 'user';
      await user.save();
      console.log('User role saved:', user.role);
    }
    
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);
    console.log('Login - JWT:', token, 'Email:', email);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || '',
        lastLoginAt: user.lastLoginAt || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
