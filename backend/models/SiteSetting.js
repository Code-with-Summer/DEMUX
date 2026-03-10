import mongoose from 'mongoose';

const siteSettingSchema = new mongoose.Schema({
  blogTitle: { type: String, default: 'Simple Blog' },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('SiteSetting', siteSettingSchema);
