// client/src/services/socket.js
// Singleton Socket.IO client. Call `getSocket()` anywhere in the app
// to get the shared socket connection. Initialise it once from _app.js.

import { io } from 'socket.io-client';

let socket = null;

/**
 * Creates and returns the Socket.IO singleton.
 * Safe to call multiple times – returns the existing instance if already connected.
 * @returns {import('socket.io-client').Socket}
 */
export const getSocket = () => {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }
  return socket;
};

/**
 * Disconnects and clears the singleton.
 * Useful during testing or explicit logout.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
