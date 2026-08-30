// client/src/services/api.js
// Axios instance pre-configured with the backend base URL.
// Automatically attaches the JWT Bearer token from Zustand authStore
// and handles 401 responses by clearing the auth state.

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor ────────────────────────────────────────────────────
// Attaches JWT from localStorage (set by authStore) on every request.
api.interceptors.request.use(
  (config) => {
    // Only runs in browser
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('infraflow-auth');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const token = parsed?.state?.token;
          if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch (_) {}
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ───────────────────────────────────────────────────
// On 401, clear local auth state and redirect to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear persisted Zustand auth state
      localStorage.removeItem('infraflow-auth');
      // Only redirect if not already on auth pages
      const path = window.location.pathname;
      if (!['/login', '/register'].includes(path)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
