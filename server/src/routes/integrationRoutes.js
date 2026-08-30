const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', integrationController.getIntegrations);
router.post('/', integrationController.saveIntegration);
router.delete('/:provider', integrationController.deleteIntegration);

module.exports = router;
