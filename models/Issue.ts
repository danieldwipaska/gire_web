import mongoose from "mongoose";

const IssueSchema = new mongoose.Schema({
  githubId: { type: Number, required: true },
  title: String,
  state: String,
  repoName: String,
  url: String,
  mentionedInDescription: Boolean,
  author: String,
  assignee: String,
  assignees: { type: [String], default: [] },
  githubCreatedAt: Date,
  closedAt: Date,
  updatedAt: Date,
  integrationId: { type: mongoose.Schema.Types.ObjectId, ref: "Integration" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

IssueSchema.index({ userId: 1, githubId: 1 }, { unique: true });

export default mongoose.models.Issue || mongoose.model("Issue", IssueSchema);
