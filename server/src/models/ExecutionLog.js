// server/src/models/ExecutionLog.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const executionLogSchema = new Schema(
  {
    executionId: {
      type: Schema.Types.ObjectId,
      ref: 'Execution',
      required: true,
      index: true,
    },
    nodeId: { type: String }, // null for global/orchestrator-level logs
    agent: {
      type: String,
      enum: ['architect', 'execution', 'validation', 'recovery', 'monitoring', 'orchestrator'],
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success', 'terminal'],
      default: 'info',
    },
    message: { type: String, required: true },
    rawStreamOutput: { type: String }, // Raw terminal stream text for xterm.js hydration
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false } // We use our own timestamp field for log precision
);

module.exports = mongoose.model('ExecutionLog', executionLogSchema);
