// server/src/config/env.js
// Loads environment variables from the server/.env file and exports them
// with sensible defaults to ensure out-of-the-box local execution.

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the .env file in the server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'infraflow_super_secret_jwt_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY || 'infraflow_encryption_key_32chars!',
  REDIS_URL: process.env.REDIS_URL || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

// Simple validations
if (env.CREDENTIAL_ENCRYPTION_KEY.length < 32) {
  console.warn('[Env] WARNING: CREDENTIAL_ENCRYPTION_KEY should be at least 32 characters long.');
}

module.exports = env;