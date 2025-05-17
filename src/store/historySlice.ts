import { StateCreator, StoreApi } from 'zustand';
import { HistoryEntry } from '@/types/types';
import { DrawboardStore } from '.';

// Maximum history states to store
const MAX_HISTORY_SIZE = 50;

export interface HistorySlice {
  // State
  history: HistoryEntry[];
  historyIndex: number;
  
  // Actions
  setHistory: (history: HistoryEntry[]) => void;
  setHistoryIndex: (index: number) => void;
  addToHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

export const createHistorySlice: StateCreator<
  DrawboardStore, 
  [], 
  [], 
  HistorySlice
> = (set, get, store) => ({
  history: [],
  historyIndex: -1,
  
  setHistory: (history) => set({ history }),
  
  setHistoryIndex: (historyIndex) => set({ historyIndex }),
  
  addToHistory: (entry) => set((state) => {
    // If we're not at the end of history, truncate future states
    const pastHistory = state.historyIndex < state.history.length - 1
      ? state.history.slice(0, state.historyIndex + 1)
      : state.history;
    
    // Add new entry and limit history size
    const newHistory = [...pastHistory, entry]
      .slice(-MAX_HISTORY_SIZE);
    
    return {
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }),
  
  clearHistory: () => set({ history: [], historyIndex: -1 }),
});