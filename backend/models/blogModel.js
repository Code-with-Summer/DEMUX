import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  bookmarks: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  publishedAt: { type: Date },
  readTime: { type: Number, default: 0 },
  status: { type: String, enum: ['published', 'unpublished'], default: 'published' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Blog', blogSchema);
