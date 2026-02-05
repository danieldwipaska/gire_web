import mongoose from "mongoose";

const IssueSchema = new mongoose.Schema({
  githubId: { type: Number, unique: true },
  title: String,
  state: String,
  repoName: String,
  url: String,
  updatedAt: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.models.Issue || mongoose.model("Issue", IssueSchema);
