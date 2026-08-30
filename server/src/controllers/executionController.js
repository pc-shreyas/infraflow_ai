// server/src/controllers/executionController.js
// Handles HTTP request/response formatting for executions and delegates to executionService.

const executionService = require('../services/executionService');

/**
 * POST /api/workflows/:id/execute
 */
const executeWorkflow = async (req, res, next) => {
  try {
    const workflowId = req.params.id;
    const userId = req.user._id;

    const execution = await executionService.triggerExecution({ workflowId, userId });

    res.status(202).json({
      success: true,
      message: 'Workflow execution dispatched to queue.',
      data: {
        executionId: execution._id,
        status: execution.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/executions
 */
const list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const userId = req.user._id;

    const result = await executionService.listExecutions({ userId, page, limit });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/executions/:id
 */
const getById = async (req, res, next) => {
  try {
    const executionId = req.params.id;
    const userId = req.user._id;

    const execution = await executionService.getExecutionById({ executionId, userId });

    res.status(200).json({
      success: true,
      data: { execution },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/executions/:id/terminal-logs
 */
const getTerminalLogs = async (req, res, next) => {
  try {
    const executionId = req.params.id;
    const userId = req.user._id;

    const result = await executionService.getExecutionTerminalLogs({ executionId, userId });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/executions/:id/cancel
 */
const cancel = async (req, res, next) => {
  try {
    const executionId = req.params.id;
    const userId = req.user._id;

    const execution = await executionService.cancelExecution({ executionId, userId });

    res.status(200).json({
      success: true,
      message: 'Execution run cancelled successfully.',
      data: { execution },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  executeWorkflow,
  list,
  getById,
  getTerminalLogs,
  cancel,
};
