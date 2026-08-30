// client/src/store/executionStore.js
// Placeholder Zustand store for execution state (populated in Phase 4).

import { create } from 'zustand';

const useExecutionStore = create((set) => ({
  executions: [],
  activeExecution: null,
  terminalLogs: [],
  isLoading: false,
  error: null,

  setExecutions: (executions) => set({ executions }),
  setActiveExecution: (execution) => set({ activeExecution: execution }),
  appendLog: (log) => set((state) => ({ terminalLogs: [...state.terminalLogs, log] })),
  clearLogs: () => set({ terminalLogs: [] }),
  clearError: () => set({ error: null }),
}));

export default useExecutionStore;
