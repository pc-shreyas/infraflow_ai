// server/src/routes/authRoutes.js
const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),
    body('role')
      .optional()
      .isIn(['admin', 'sre_operator', 'developer'])
      .withMessage('Role must be admin, sre_operator, or developer.'),
  ],
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  authController.login
);

// GET /api/auth/me  — protected
router.get('/me', protect, authController.getMe);

module.exports = router;
