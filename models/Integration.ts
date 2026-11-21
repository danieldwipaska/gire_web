import mongoose from 'mongoose';

const IntegrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: { type: String, default: 'github' },
    label: { type: String, default: 'Personal' },
    githubUsername: { type: String, required: true },
    accessToken: { type: String, required: true },

    lastSync: { type: Date },
    lastFullSync: { type: Date },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
  },
  { timestamps: true },
);

IntegrationSchema.index(
  { userId: 1, provider: 1, githubUsername: 1 },
  { unique: true },
);

export default mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);
