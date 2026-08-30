// server/src/models/Workflow.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const nodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true }, // 'githubRepo' | 'dockerBuild' | 'awsEC2' | 'postgresDB' | 'nginxProxy'
    position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
    data: {
      label: { type: String },
      config: { type: Schema.Types.Mixed, default: {} },
    },
  },
  { _id: false }
);

const edgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
  },
  { _id: false }
);

const workflowSchema = new Schema(
  {
    name: { type: String, required: [true, 'Workflow name is required'], trim: true },
    description: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft',
    },
    nodes: [nodeSchema],
    edges: [edgeSchema],
    environmentVars: { type: Map, of: String, default: {} },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workflow', workflowSchema);
