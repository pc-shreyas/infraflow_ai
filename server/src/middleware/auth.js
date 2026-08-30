// server/src/middleware/auth.js
// JWT authentication middleware. Attaches `req.user` on success.

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised – no token provided.' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    // Attach user (without password) to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * Role-based access guard factory.
 * Usage: router.delete('/admin-route', protect, authorize('admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorised for this action.`,
    });
  }
  next();
};

module.exports = { protect, authorize };
