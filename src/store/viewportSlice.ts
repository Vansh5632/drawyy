import { StateCreator, StoreApi } from 'zustand';
import { DrawboardStore } from '.';

interface Viewport {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface ViewportSlice {
  // State
  viewport: Viewport;
  
  // Actions
  setViewport: (viewport: Partial<Viewport>) => void;
}

export const createViewportSlice: StateCreator<
  DrawboardStore, 
  [], 
  [], 
  ViewportSlice
> = (set, get, store) => ({
  viewport: {
    scale: 1,
    translateX: 0,
    translateY: 0
  },
  
  setViewport: (viewportUpdate) => set((state) => ({
    viewport: {
      ...state.viewport,
      ...viewportUpdate
    }
  })),
});