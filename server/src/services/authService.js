// server/src/services/authService.js
// All authentication business logic lives here; the controller stays thin.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

/**
 * Signs a JWT for a given user ID.
 * @param {string} userId
 * @returns {string} Signed JWT
 */
const signToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

/**
 * Registers a new user.
 * @param {{ name: string, email: string, password: string, role?: string }} data
 * @returns {{ user: object, token: string }}
 */
const registerUser = async ({ name, email, password, role }) => {
  // Check for existing account
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // Hash password with bcrypt (cost factor 12)
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    ...(role && { role }),
  });

  const token = signToken(user._id);

  // Return user without the password field
  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, token };
};

/**
 * Authenticates a user by email + password.
 * @param {{ email: string, password: string }} credentials
 * @returns {{ user: object, token: string }}
 */
const loginUser = async ({ email, password }) => {
  // Explicitly select the password field since it has select: false in the schema
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user._id);

  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, token };
};

/**
 * Returns a user profile by ID (without the password field).
 * @param {string} userId
 * @returns {object} User document
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

module.exports = { registerUser, loginUser, getUserProfile };
