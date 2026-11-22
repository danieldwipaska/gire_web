import mongoose from "mongoose";

const WorkspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

WorkspaceSchema.index({ ownerId: 1, createdAt: -1 });

export default mongoose.models.Workspace ||
  mongoose.model("Workspace", WorkspaceSchema);

