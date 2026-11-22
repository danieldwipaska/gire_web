import mongoose from "mongoose";

const UploadedAssetSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    storage: {
      type: String,
      enum: ["local", "cloudflare_r2", "gcp_gcs"],
      default: "local",
    },
  },
  { timestamps: true },
);

UploadedAssetSchema.index({ userId: 1 });

export default mongoose.models.UploadedAsset ||
  mongoose.model("UploadedAsset", UploadedAssetSchema);

