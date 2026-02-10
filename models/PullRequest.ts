import mongoose from 'mongoose';

const PRSchema = new mongoose.Schema({
  githubId: { type: Number, unique: true },
  title: String,
  state: String,
  repoName: String,
  additions: Number,
  deletions: Number,
  changedFiles: Number,
  comments: Number,
  url: String,
  mentionedInDescription: Boolean,
  reviewRequested: Boolean,
  author: String,
  assignee: String,
  mergedAt: Date,
  updatedAt: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.models.PullRequest || mongoose.model('PullRequest', PRSchema);
