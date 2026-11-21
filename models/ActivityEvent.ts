import mongoose from "mongoose";

const ActivityEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  githubEventId: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "pr_created",
      "pr_updated",
      "pr_reviewed",
      "pr_commented",
      "pr_merged",
      "pr_closed",
      "issue_opened",
      "issue_closed",
      "issue_commented",
      "pushed",
    ],
    required: true,
  },
  rawType: String,
  action: String,
  actor: String,
  repoName: { type: String, required: true },
  targetType: { type: String, enum: ["pr", "issue", "push"], required: true },
  targetNumber: Number,
  title: { type: String, required: true },
  description: String,
  url: { type: String, required: true },
  occurredAt: { type: Date, required: true },
  integrationId: { type: mongoose.Schema.Types.ObjectId, ref: "Integration" },
});

ActivityEventSchema.index({ userId: 1, githubEventId: 1 }, { unique: true });
ActivityEventSchema.index({ userId: 1, occurredAt: -1 });

export default mongoose.models.ActivityEvent ||
  mongoose.model("ActivityEvent", ActivityEventSchema);

