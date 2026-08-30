// server/src/app.js
// Express application factory. Exports the configured `app` instance so
// server.js can attach it to an HTTP server (enabling Socket.IO sharing).

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { getConnectionMode } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');

const createApp = () => {
  const app = express();

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Body parsers ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'InfraFlow AI API is operational.',
      data: {
        status: 'ok',
        dbMode: getConnectionMode(),       // 'mongodb' | 'memory'
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/workflows', workflowRoutes);
  app.use('/api/executions', executionRoutes);
  app.use('/api/integrations', integrationRoutes);

  // Catch-all for unmatched routes
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // ── Centralised Error Handler ─────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;