// client/src/store/authStore.js
// Zustand store for authentication state.
// Persists token + user to localStorage under key 'infraflow-auth'.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── State ────────────────────────────────────────────────────────────
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // ── Computed helpers ─────────────────────────────────────────────────
      isAuthenticated: () => !!get().token && !!get().user,

      // ── Actions ──────────────────────────────────────────────────────────

      /**
       * Registers a new user and sets auth state on success.
       * @param {{ name: string, email: string, password: string, role?: string }} payload
       */
      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/register', payload);
          const { user, token } = res.data.data;
          set({ user, token, isLoading: false });
          return { success: true };
        } catch (err) {
          const message =
            err.response?.data?.message || 'Registration failed. Please try again.';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      /**
       * Logs in an existing user.
       * @param {{ email: string, password: string }} credentials
       */
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/login', credentials);
          const { user, token } = res.data.data;
          set({ user, token, isLoading: false });
          return { success: true };
        } catch (err) {
          const message =
            err.response?.data?.message || 'Login failed. Please check your credentials.';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      /**
       * Fetches the current user profile from /api/auth/me and refreshes state.
       */
      fetchMe: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.data.user, isLoading: false });
        } catch (_) {
          set({ isLoading: false });
        }
      },

      /**
       * Clears auth state and removes localStorage entry.
       */
      logout: () => {
        set({ user: null, token: null, error: null, isLoading: false });
      },

      /**
       * Clears any error message.
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: 'infraflow-auth',           // localStorage key
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (state) => ({ user: state.user, token: state.token }), // only persist these
    }
  )
);

export default useAuthStore;
