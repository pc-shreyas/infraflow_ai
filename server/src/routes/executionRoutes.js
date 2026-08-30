// server/src/routes/executionRoutes.js
const { Router } = require('express');
const executionController = require('../controllers/executionController');
const { protect } = require('../middleware/auth');

const router = Router();

// Secure all execution endpoints with authentication
router.use(protect);

// GET /api/executions - list historical and active execution runs
router.get('/', executionController.list);

// GET /api/executions/:id/terminal-logs - raw terminal logs for xterm.js hydration
router.get('/:id/terminal-logs', executionController.getTerminalLogs);

// GET /api/executions/:id - single execution run state
router.get('/:id', executionController.getById);

// POST /api/executions/:id/cancel - force cancel running execution
router.post('/:id/cancel', executionController.cancel);

module.exports = router;
