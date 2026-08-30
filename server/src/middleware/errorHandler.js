// server/src/middleware/errorHandler.js
// Central Express error handler. Normalises all thrown errors into a
// consistent JSON envelope: { success, message, errors?, stack? }

const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  // Default to 500 unless the error carries an explicit statusCode
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value: '${value}' already exists for '${field}'.`;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed.';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired.';
  }

  const response = { success: false, message };
  if (errors) response.errors = errors;
  if (env.NODE_ENV === 'development') response.stack = err.stack;

  console.error(`[Error] ${statusCode} – ${message}`, env.NODE_ENV === 'development' ? err.stack : '');

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
