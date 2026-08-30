// server/src/services/executionService.js
// Business logic for execution lifecycle, database snapshots, queue dispatches, and log queries.

const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const { addExecutionJob } = require('../queues/executionQueue');

/**
 * Creates an execution run from a workflow and enqueues the job.
 * @param {object} params
 * @param {string} params.workflowId
 * @param {string} params.userId
 * @returns {Promise<object>} Created execution record
 */
const triggerExecution = async ({ workflowId, userId }) => {
  const workflow = await Workflow.findOne({ _id: workflowId, owner: userId });
  if (!workflow) {
    const err = new Error('Workflow not found or access denied.');
    err.statusCode = 404;
    throw err;
  }

  if (!workflow.nodes || workflow.nodes.length === 0) {
    const err = new Error('Cannot execute an empty workflow. Please add at least one node.');
    err.statusCode = 400;
    throw err;
  }

  // Create an immutable snapshot of the workflow graph
  const workflowSnapshot = workflow.toObject();

  const execution = await Execution.create({
    workflowId,
    triggeredBy: userId,
    status: 'PENDING',
    workflowSnapshot,
    nodeStates: {},
    retryCount: 0,
    startTime: new Date(),
  });

  // Enqueue job for background processing
  await addExecutionJob(execution._id.toString());

  return execution;
};

/**
 * Lists executions for a user with pagination.
 */
const listExecutions = async ({ userId, page = 1, limit = 15 }) => {
  const skip = (page - 1) * limit;
  const query = { triggeredBy: userId };

  const [executions, total] = await Promise.all([
    Execution.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('workflowId', 'name description'),
    Execution.countDocuments(query),
  ]);

  return {
    executions,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Gets details of a single execution run.
 */
const getExecutionById = async ({ executionId, userId }) => {
  const execution = await Execution.findOne({ _id: executionId, triggeredBy: userId }).populate('workflowId', 'name description');
  if (!execution) {
    const err = new Error('Execution run not found or access denied.');
    err.statusCode = 404;
    throw err;
  }
  return execution;
};

/**
 * Fetches all execution logs and builds raw terminal stream buffer for xterm.js hydration.
 */
const getExecutionTerminalLogs = async ({ executionId, userId }) => {
  // Verify ownership
  await getExecutionById({ executionId, userId });

  const logs = await ExecutionLog.find({ executionId }).sort({ timestamp: 1 });

  const rawTerminalStream = logs
    .filter((l) => l.rawStreamOutput)
    .map((l) => l.rawStreamOutput)
    .join('');

  return {
    logs,
    rawTerminalStream,
  };
};

/**
 * Cancels an ongoing execution run.
 */
const cancelExecution = async ({ executionId, userId }) => {
  const execution = await Execution.findOne({ _id: executionId, triggeredBy: userId });
  if (!execution) {
    const err = new Error('Execution run not found or access denied.');
    err.statusCode = 404;
    throw err;
  }

  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(execution.status)) {
    const err = new Error(`Cannot cancel execution in ${execution.status} status.`);
    err.statusCode = 400;
    throw err;
  }

  execution.status = 'CANCELLED';
  execution.endTime = new Date();
  execution.durationMs = Date.now() - new Date(execution.startTime).getTime();
  await execution.save();

  return execution;
};

module.exports = {
  triggerExecution,
  listExecutions,
  getExecutionById,
  getExecutionTerminalLogs,
  cancelExecution,
};
