// client/src/store/workflowStore.js
// Zustand store for workflow management. Handles CRUD and canvas layout actions.

import { create } from 'zustand';
import api from '../services/api';

const useWorkflowStore = create((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,

  setWorkflows: (workflows) => set({ workflows }),
  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
  clearError: () => set({ error: null }),

  /**
   * Fetches user's workflows.
   */
  fetchWorkflows: async (page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/workflows?page=${page}&limit=${limit}`);
      set({ workflows: res.data.data.workflows, isLoading: false });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch workflows.';
      set({ error: msg, isLoading: false });
    }
  },

  /**
   * Fetches details of a specific workflow.
   */
  fetchWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/workflows/${id}`);
      set({ currentWorkflow: res.data.data.workflow, isLoading: false });
      return res.data.data.workflow;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch workflow details.';
      set({ error: msg, isLoading: false });
      return null;
    }
  },

  /**
   * Creates a new workflow.
   */
  createWorkflow: async ({ name, description }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/workflows', {
        name,
        description,
        nodes: [],
        edges: [],
        status: 'draft',
      });
      const newWorkflow = res.data.data.workflow;
      set((state) => ({
        workflows: [newWorkflow, ...state.workflows],
        currentWorkflow: newWorkflow,
        isLoading: false,
      }));
      return newWorkflow;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create workflow.';
      set({ error: msg, isLoading: false });
      return null;
    }
  },

  /**
   * Saves updates (nodes, edges, configuration, name) to database.
   */
  updateWorkflow: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put(`/workflows/${id}`, updates);
      const updatedWorkflow = res.data.data.workflow;
      set((state) => ({
        workflows: state.workflows.map((w) => (w._id === id ? updatedWorkflow : w)),
        currentWorkflow:
          state.currentWorkflow?._id === id ? updatedWorkflow : state.currentWorkflow,
        isLoading: false,
      }));
      return updatedWorkflow;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update workflow.';
      set({ error: msg, isLoading: false });
      return null;
    }
  },

  /**
   * Deletes a workflow.
   */
  deleteWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/workflows/${id}`);
      set((state) => ({
        workflows: state.workflows.filter((w) => w._id !== id),
        currentWorkflow: state.currentWorkflow?._id === id ? null : state.currentWorkflow,
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete workflow.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  /**
   * Generates a workflow using natural language prompt.
   * Linked to AI generator endpoint.
   */
  generateWorkflow: async (prompt) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/workflows/generate', { prompt });
      const generatedWorkflow = res.data.data.workflow;
      set((state) => ({
        workflows: [generatedWorkflow, ...state.workflows],
        currentWorkflow: generatedWorkflow,
        isLoading: false,
      }));
      return generatedWorkflow;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate workflow via AI.';
      set({ error: msg, isLoading: false });
      return null;
    }
  },
}));

export default useWorkflowStore;
