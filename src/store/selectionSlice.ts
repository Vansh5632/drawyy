import { StateCreator, StoreApi } from 'zustand';
import { DrawboardStore } from '.';

export interface SelectionSlice {
  // State
  selectedShapeId: string | null;
  
  // Actions
  setSelectedShapeId: (id: string | null) => void;
}

export const createSelectionSlice: StateCreator<
  DrawboardStore, 
  [], 
  [], 
  SelectionSlice
> = (set, get, store) => ({
  selectedShapeId: null,
  
  setSelectedShapeId: (selectedShapeId) => set({ selectedShapeId }),
});