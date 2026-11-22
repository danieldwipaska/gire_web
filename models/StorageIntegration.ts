import mongoose from "mongoose";

const StorageIntegrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: ["cloudflare_r2", "gcp_gcs"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    bucket: {
      type: String,
      required: true,
      trim: true,
    },
    prefix: {
      type: String,
      default: "notes",
      trim: true,
    },
    publicUrl: {
      type: String,
      default: "",
      trim: true,
    },
    // Cloudflare R2 (S3-compatible)
    r2AccountId: {
      type: String,
      default: "",
      trim: true,
    },
    r2Endpoint: {
      type: String,
      default: "",
      trim: true,
    },
    r2AccessKeyId: {
      type: String,
      default: "",
      trim: true,
    },
    r2SecretAccessKey: {
      type: String,
      default: "",
    },
    // Google Cloud Storage (Service Account)
    gcpProjectId: {
      type: String,
      default: "",
      trim: true,
    },
    gcpClientEmail: {
      type: String,
      default: "",
      trim: true,
    },
    gcpPrivateKey: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "error"],
      default: "active",
    },
    lastError: {
      type: String,
      default: "",
    },
    lastTestedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

StorageIntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

export default mongoose.models.StorageIntegration ||
  mongoose.model("StorageIntegration", StorageIntegrationSchema);

