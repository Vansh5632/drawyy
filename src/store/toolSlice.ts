import { StateCreator, StoreApi } from 'zustand';
import { Tool, StrokeStyle } from '@/types/types';
import { DrawboardStore } from '.';

export interface ToolSlice {
  // State
  tool: Tool;
  strokeStyle: StrokeStyle;
  
  // Actions
  setTool: (tool: Tool) => void;
  setStrokeStyle: (style: Partial<StrokeStyle>) => void;
}

export const createToolSlice: StateCreator<
  DrawboardStore, 
  [], 
  [], 
  ToolSlice
> = (set, get, store) => ({
  tool: 'freedraw',
  strokeStyle: {
    color: '#000000',
    width: 2,
    opacity: 1,
  },
  
  setTool: (tool) => set({ tool }),
  
  setStrokeStyle: (style) => set((state) => ({
    strokeStyle: {
      ...state.strokeStyle,
      ...style
    }
  })),
});