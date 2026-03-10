import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  visitorId: { type: String, required: true },
  source: { type: String, default: 'Direct' },
  referrer: { type: String, default: '' },
  searchKeyword: { type: String, default: '' },
  deviceType: { type: String, default: 'Desktop' },
  userAgent: { type: String, default: '' },
  visitedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Visit', visitSchema);
