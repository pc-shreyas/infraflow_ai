// server/src/queues/executionQueue.js
// Dispatches execution jobs. Falls back to an in-memory queue runner if Redis is not configured.

const env = require('../config/env');
const Orchestrator = require('../agents/orchestrator');

let isRedisMode = false;
let redisQueue = null;

// Initialize BullMQ if REDIS_URL is configured
if (env.REDIS_URL) {
  try {
    const { Queue, Worker } = require('bullmq');
    const IORedis = require('ioredis');

    const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

    redisQueue = new Queue('infraflow-executions', { connection });

    new Worker(
      'infraflow-executions',
      async (job) => {
        const { executionId } = job.data;
        await Orchestrator.run(executionId);
      },
      { connection }
    );

    isRedisMode = true;
    console.log('[Queue] BullMQ Redis Queue initialised.');
  } catch (err) {
    console.warn('[Queue] Failed to initialize BullMQ Redis queue, falling back to in-memory queue:', err.message);
    isRedisMode = false;
  }
}

// In-memory queue handler
const inMemoryQueue = [];
let isProcessingInMemory = false;

const processInMemoryQueue = async () => {
  if (isProcessingInMemory || inMemoryQueue.length === 0) return;
  isProcessingInMemory = true;

  while (inMemoryQueue.length > 0) {
    const executionId = inMemoryQueue.shift();
    try {
      console.log(`[Queue] [InMemory] Starting execution run for ${executionId}...`);
      await Orchestrator.run(executionId);
    } catch (err) {
      console.error(`[Queue] [InMemory] Error executing ${executionId}:`, err.message);
    }
  }

  isProcessingInMemory = false;
};

/**
 * Adds an execution job to the queue.
 * @param {string} executionId
 * @returns {Promise<boolean>}
 */
const addExecutionJob = async (executionId) => {
  if (isRedisMode && redisQueue) {
    await redisQueue.add('execute-workflow', { executionId });
    return true;
  }

  // Use in-memory queue runner
  inMemoryQueue.push(executionId);
  setImmediate(() => {
    processInMemoryQueue().catch((err) => console.error('[Queue] In-memory queue worker error:', err));
  });
  return true;
};

module.exports = {
  addExecutionJob,
  getQueueMode: () => (isRedisMode ? 'redis' : 'in-memory'),
};
