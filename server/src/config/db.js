// server/src/config/db.js
// Connects to MongoDB. Falls back to an in-memory MongoDB instance
// (via mongodb-memory-server) when MONGO_URI is not set, so the
// application works out-of-the-box without an external database.

const mongoose = require('mongoose');
const env = require('./env');

let connectionMode = 'mongodb'; // 'mongodb' | 'memory'
let memoryServer = null;

/**
 * Returns the current database connection mode.
 * @returns {'mongodb' | 'memory'}
 */
const getConnectionMode = () => connectionMode;

/**
 * Establishes a Mongoose connection.
 * Priority: MONGO_URI env var → in-memory MongoMemoryServer.
 */
const connectDB = async () => {
  // If already connected, skip
  if (mongoose.connection.readyState === 1) return;

  let uri = env.MONGO_URI;

  if (!uri) {
    console.log('[DB] No MONGO_URI provided – starting in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      connectionMode = 'memory';
      console.log(`[DB] In-memory MongoDB started at: ${uri}`);
    } catch (err) {
      console.error('[DB] Failed to start in-memory MongoDB:', err.message);
      process.exit(1);
    }
  } else {
    connectionMode = 'mongodb';
  }

  try {
    await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected (mode: ${connectionMode})`);

    if (connectionMode === 'memory') {
      const User = require('../models/User');
      const existingUser = await User.findOne({ email: 'shreyas@gmail.com' });

      if (!existingUser) {
        const bcrypt = require('bcryptjs');
        await User.create({
          name: 'Shreyas',
          email: 'shreyas@gmail.com',
          password: await bcrypt.hash('Password123!', 12),
          role: 'sre_operator',
        });
        console.log('Default dev user seeded: shreyas@gmail.com / Password123!');
      }
    }
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] Runtime error:', err.message);
  });
};

/**
 * Gracefully closes the Mongoose connection and stops the in-memory server
 * (if applicable). Should be called during process teardown.
 */
const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    console.log('[DB] In-memory MongoDB stopped.');
  }
};

module.exports = { connectDB, disconnectDB, getConnectionMode };
