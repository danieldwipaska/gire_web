import mongoose from 'mongoose';

const IntegrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    provider: { type: String, default: 'github' },
    githubUsername: { type: String, required: true },
    accessToken: { type: String, required: true },

    lastSync: { type: Date },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
  },
  { timestamps: true },
);

export default mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);
