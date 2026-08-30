// server/src/routes/workflowRoutes.js
const { Router } = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { protect } = require('../middleware/auth');

const router = Router();

// Secure all workflow endpoints
router.use(protect);

// GET /api/workflows - list workflows
// POST /api/workflows - create workflow
router.route('/')
  .get(workflowController.list)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Workflow name is required.'),
      body('status')
        .optional()
        .isIn(['draft', 'active', 'paused', 'archived'])
        .withMessage('Invalid status value.'),
      body('nodes').optional().isArray().withMessage('Nodes must be an array.'),
      body('edges').optional().isArray().withMessage('Edges must be an array.'),
    ],
    workflowController.create
  );

// POST /api/workflows/generate - AI Graph Generator
router.post(
  '/generate',
  [
    body('prompt').trim().notEmpty().withMessage('Prompt is required for workflow generation.'),
  ],
  workflowController.generate
);

// GET /api/workflows/:id - fetch details
// PUT /api/workflows/:id - save changes
// DELETE /api/workflows/:id - delete workflow
router.route('/:id')
  .get(workflowController.getById)
  .put(
    [
      body('name').optional().trim().notEmpty().withMessage('Workflow name cannot be empty.'),
      body('status')
        .optional()
        .isIn(['draft', 'active', 'paused', 'archived'])
        .withMessage('Invalid status value.'),
      body('nodes').optional().isArray().withMessage('Nodes must be an array.'),
      body('edges').optional().isArray().withMessage('Edges must be an array.'),
    ],
    workflowController.update
  )
  .delete(workflowController.remove);

// POST /api/workflows/:id/execute - dispatch execution job
const executionController = require('../controllers/executionController');
router.post('/:id/execute', executionController.executeWorkflow);

module.exports = router;
