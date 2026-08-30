// server/src/controllers/authController.js
// Thin controller: validates input, delegates to authService, returns JSON.

const { validationResult } = require('express-validator');
const authService = require('../services/authService');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { name, email, password, role } = req.body;
    const { user, token } = await authService.registerUser({ name, email, password, role });

    res.status(201).json({ success: true, message: 'Account created successfully.', data: { user, token } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    res.status(200).json({ success: true, message: 'Login successful.', data: { user, token } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me  (protected)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware
    const user = await authService.getUserProfile(req.user._id);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
