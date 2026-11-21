import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    title: { type: String, required: true, default: "Untitled Note" },
    content: { type: String, default: "" },
    tags: { type: [String], default: [] },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NoteSchema.index({ userId: 1, updatedAt: -1 });
NoteSchema.index({ projectId: 1, updatedAt: -1 });
NoteSchema.index({ sharedWith: 1 });

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);

