// server/src/models/Integration.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const integrationSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: {
      type: String,
      enum: ['github', 'aws', 'docker', 'digitalocean', 'vercel'],
      required: true,
    },
    isConnected: { type: Boolean, default: false },
    // AES-256-GCM encrypted token/key pair – never stored as plaintext
    encryptedCredentials: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} }, // e.g. { region, accountId, username }
  },
  { timestamps: true }
);

// Compound unique index: one record per owner-provider pair
integrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Integration', integrationSchema);
