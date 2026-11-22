import mongoose from "mongoose";

const FigmaLinkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    kind: {
      type: String,
      enum: ["design", "prototype"],
      default: "design",
    },
  },
  { _id: true },
);

const ProjectMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member",
    },
  },
  { _id: false },
);

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["office", "freelance", "personal"],
      default: "office",
    },
    clientOrTeam: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "on_hold", "completed", "archived"],
      default: "active",
    },
    color: { type: String, default: "indigo" },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: { type: [ProjectMemberSchema], default: [] },
    repos: { type: [String], default: [] },
    figmaLinks: { type: [FigmaLinkSchema], default: [] },
  },
  { timestamps: true },
);

ProjectSchema.index({ workspaceId: 1, updatedAt: -1 });
ProjectSchema.index({ ownerId: 1, updatedAt: -1 });
ProjectSchema.index({ "members.userId": 1 });

export default mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema);

