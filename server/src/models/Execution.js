// server/src/models/Execution.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const executionSchema = new Schema(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    triggeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'REMEDIATING', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    // Full snapshot of the workflow graph at the time of execution
    workflowSnapshot: { type: Schema.Types.Mixed, required: true },
    // Per-node execution state map: { [nodeId]: { status, output, error } }
    nodeStates: { type: Map, of: Schema.Types.Mixed, default: {} },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    durationMs: { type: Number, default: 0 },
    retryCount: { type: Number, default: 0 },
    errorDetails: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Execution', executionSchema);
