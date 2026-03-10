import bcrypt from 'bcryptjs';
import User from './models/User.js';

export async function createAdmin() {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log('admin exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    const admin = new User({
      username: 'admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('admin logged in');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}
