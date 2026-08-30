// server/src/services/workflowService.js
// Handles Mongoose CRUD logic for Workflows. Keeps the controller thin.

const Workflow = require('../models/Workflow');

/**
 * Lists workflows owned by a user, with pagination.
 * @param {string} ownerId
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{ workflows: Array, total: number, page: number, pages: number }>}
 */
const listWorkflows = async (ownerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = { owner: ownerId };

  const [workflows, total] = await Promise.all([
    Workflow.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Workflow.countDocuments(query),
  ]);

  return {
    workflows,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Creates a new manual workflow.
 * @param {string} ownerId
 * @param {object} workflowData
 * @returns {Promise<object>} Created workflow document
 */
const createWorkflow = async (ownerId, workflowData) => {
  const workflow = new Workflow({
    ...workflowData,
    owner: ownerId,
  });
  return await workflow.save();
};

/**
 * Retrieves a workflow by ID and verifies ownership.
 * @param {string} workflowId
 * @param {string} ownerId
 * @returns {Promise<object>} Workflow document
 */
const getWorkflowById = async (workflowId, ownerId) => {
  const workflow = await Workflow.findOne({ _id: workflowId, owner: ownerId });
  if (!workflow) {
    const err = new Error('Workflow not found or access denied.');
    err.statusCode = 404;
    throw err;
  }
  return workflow;
};

/**
 * Updates an existing workflow.
 * @param {string} workflowId
 * @param {string} ownerId
 * @param {object} updates
 * @returns {Promise<object>} Updated workflow document
 */
const updateWorkflow = async (workflowId, ownerId, updates) => {
  const workflow = await Workflow.findOne({ _id: workflowId, owner: ownerId });
  if (!workflow) {
    const err = new Error('Workflow not found or access denied.');
    err.statusCode = 404;
    throw err;
  }

  // Fields allowed to be updated
  const allowedFields = ['name', 'description', 'status', 'nodes', 'edges', 'environmentVars', 'version'];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      workflow[field] = updates[field];
    }
  });

  return await workflow.save();
};

/**
 * Deletes a workflow by ID.
 * @param {string} workflowId
 * @param {string} ownerId
 * @returns {Promise<object>} Deleted workflow document
 */
const deleteWorkflow = async (workflowId, ownerId) => {
  const workflow = await Workflow.findOneAndDelete({ _id: workflowId, owner: ownerId });
  if (!workflow) {
    const err = new Error('Workflow not found or access denied.');
    err.statusCode = 404;
    throw err;
  }
  return workflow;
};

module.exports = {
  listWorkflows,
  createWorkflow,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
};
