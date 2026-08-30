// server/server.js
// Application entry point.
// 1. Connects to MongoDB (or spins up in-memory fallback)
// 2. Creates the Express app
// 3. Attaches Socket.IO to the HTTP server
// 4. Starts listening

const http = require('http');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const createApp = require('./src/app');
const env = require('./src/config/env');

const main = async () => {
  // Connect to database first so models are ready before requests arrive
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  // Attach Socket.IO
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`\n🚀 InfraFlow AI Server running on http://localhost:${env.PORT}`);
    console.log(`   Environment : ${env.NODE_ENV}`);
    console.log(`   Health check: http://localhost:${env.PORT}/api/health\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    httpServer.close(async () => {
      const { disconnectDB } = require('./src/config/db');
      await disconnectDB();
      console.log('[Server] HTTP server closed. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

main().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
