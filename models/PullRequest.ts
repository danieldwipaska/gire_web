import mongoose from 'mongoose';

const PRSchema = new mongoose.Schema({
  githubId: { type: Number, required: true },
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
  reviewedByMe: { type: Boolean, default: false },
  myReviewState: { type: String, default: null },
  author: String,
  assignee: String,
  githubCreatedAt: Date,
  closedAt: Date,
  mergedAt: Date,
  updatedAt: Date,
  integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Integration' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

PRSchema.index({ userId: 1, githubId: 1 }, { unique: true });

export default mongoose.models.PullRequest || mongoose.model('PullRequest', PRSchema);
