// server/src/controllers/workflowController.js
// Handles HTTP request/response handling, input validation check, and delegates to service.

const { validationResult } = require('express-validator');
const workflowService = require('../services/workflowService');

/**
 * GET /api/workflows
 */
const list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const ownerId = req.user._id;

    const result = await workflowService.listWorkflows(ownerId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/workflows
 */
const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const ownerId = req.user._id;
    const workflow = await workflowService.createWorkflow(ownerId, req.body);

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully.',
      data: { workflow },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/workflows/:id
 */
const getById = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const workflow = await workflowService.getWorkflowById(req.params.id, ownerId);

    res.status(200).json({
      success: true,
      data: { workflow },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/workflows/:id
 */
const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const ownerId = req.user._id;
    const workflow = await workflowService.updateWorkflow(req.params.id, ownerId, req.body);

    res.status(200).json({
      success: true,
      message: 'Workflow updated successfully.',
      data: { workflow },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/workflows/:id
 */
const remove = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    await workflowService.deleteWorkflow(req.params.id, ownerId);

    res.status(200).json({
      success: true,
      message: 'Workflow deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/workflows/generate
 * Converts natural language intent to React Flow node-graph.
 */
const generate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { prompt } = req.body;
    const aiService = require('../services/aiService');

    const graphData = await aiService.generateWorkflowGraph(prompt);
    const ownerId = req.user._id;

    const workflow = await workflowService.createWorkflow(ownerId, graphData);

    res.status(201).json({
      success: true,
      message: 'Workflow successfully generated from natural language intent.',
      data: { workflow },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
  remove,
  generate,
};
