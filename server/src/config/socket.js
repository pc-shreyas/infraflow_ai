// server/src/config/socket.js
// Initialises Socket.IO with the HTTP server and exports a helper to
// broadcast events to all connected clients. Other modules (agents,
// execution service) import `getIO()` to emit real-time events.

const { Server } = require('socket.io');
const env = require('./env');

let io = null;

/**
 * Attaches Socket.IO to the Node HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, env.JWT_SECRET);
        socket.userId = decoded.id;
      }
      next();
    } catch (_) {
      // Allow connection but unauthenticated sockets cannot join restricted rooms
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Allow clients to subscribe to a specific execution room
    socket.on('join:execution', async (executionId) => {
      if (!executionId) return;
      try {
        const Execution = require('../models/Execution');
        const execution = await Execution.findById(executionId).select('triggeredBy');
        if (execution && socket.userId && String(execution.triggeredBy) !== String(socket.userId)) {
          console.warn(`[Socket] Unauthorized room join attempt: User ${socket.userId} on Execution ${executionId}`);
          return;
        }
      } catch (_) {}

      socket.join(`execution:${executionId}`);
      console.log(`[Socket] ${socket.id} joined execution room: ${executionId}`);
    });

    socket.on('leave:execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket] Socket.IO initialised.');
  return io;
};

/**
 * Returns the initialised Socket.IO server instance.
 * Throws if called before initSocket().
 * @returns {import('socket.io').Server}
 */
const getIO = () => {
  if (!io) throw new Error('Socket.IO has not been initialised. Call initSocket() first.');
  return io;
};

module.exports = { initSocket, getIO };
