import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String },
  image: String,
  role: {
    type: String,
    enum: ['super_user', 'member', 'user'],
    default: 'super_user',
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null,
  },
  activeWorkspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.index({ workspaceId: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
