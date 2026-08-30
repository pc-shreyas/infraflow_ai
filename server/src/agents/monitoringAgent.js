// server/src/agents/monitoringAgent.js
// 5th Agent in the 5-Agent Model: Handles log persistence and real-time Socket.IO broadcasting.

const ExecutionLog = require('../models/ExecutionLog');
const { getIO } = require('../config/socket');

class MonitoringAgent {
  /**
   * Logs a message to MongoDB and broadcasts it to connected clients in real-time.
   * @param {object} params
   * @param {string} params.executionId
   * @param {string} [params.nodeId]
   * @param {'architect'|'execution'|'validation'|'recovery'|'monitoring'|'orchestrator'} params.agent
   * @param {'info'|'warning'|'error'|'success'|'terminal'} [params.level]
   * @param {string} params.message
   * @param {string} [params.rawStreamOutput]
   */
  static async log({ executionId, nodeId = null, agent, level = 'info', message, rawStreamOutput = null }) {
    try {
      const logEntry = await ExecutionLog.create({
        executionId,
        nodeId,
        agent,
        level,
        message,
        rawStreamOutput,
        timestamp: new Date(),
      });

      // Broadcast via Socket.IO if available
      try {
        const io = getIO();
        io.to(`execution:${executionId}`).emit('execution:log', logEntry);
      } catch (_) {
        // Socket.IO may not have any listeners connected yet
      }

      return logEntry;
    } catch (err) {
      console.error('[MonitoringAgent] Failed to write log:', err.message);
    }
  }

  /**
   * Broadcasts node state change event (e.g. running, success, failed).
   * @param {string} executionId
   * @param {string} nodeId
   * @param {'idle'|'running'|'success'|'failed'|'remediating'} status
   * @param {object} [output]
   */
  static emitNodeStatus(executionId, nodeId, status, output = null) {
    try {
      const io = getIO();
      io.to(`execution:${executionId}`).emit('execution:node_status', {
        executionId,
        nodeId,
        status,
        output,
        timestamp: new Date(),
      });
    } catch (_) {}
  }

  /**
   * Broadcasts execution status change (e.g. RUNNING, COMPLETED, FAILED, REMEDIATING).
   * @param {string} executionId
   * @param {string} status
   * @param {object} [extra]
   */
  static emitExecutionStatus(executionId, status, extra = {}) {
    try {
      const io = getIO();
      io.to(`execution:${executionId}`).emit('execution:status', {
        executionId,
        status,
        ...extra,
        timestamp: new Date(),
      });
    } catch (_) {}
  }
}

module.exports = MonitoringAgent;
