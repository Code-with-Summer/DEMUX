import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  author: { type: String, required: true },
  authorId: { type: String },
  authorRole: { type: String, enum: ['user', 'admin'], default: 'user' },
  content: { type: String, required: true },
  likedBy: { type: [String], default: [] },
  reports: { type: [{ userId: String, reason: String, createdAt: Date }], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

export default mongoose.model('Comment', commentSchema);
