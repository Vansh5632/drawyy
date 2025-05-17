import { StateCreator, StoreApi } from 'zustand';
import { Shape } from '@/types/types';
import { DrawboardStore } from '.';

export interface ShapesSlice {
  // State
  shapes: Shape[];
  
  // Actions
  setShapes: (shapes: Shape[]) => void;
  addShape: (shape: Shape) => void;
  updateShape: (shape: Shape) => void;
  deleteShape: (shapeId: string) => void;
}

export const createShapesSlice: StateCreator<
  DrawboardStore, 
  [], 
  [], 
  ShapesSlice
> = (set, get, store) => ({
  shapes: [] as Shape[],
  
  setShapes: (shapes: Shape[]): void => set({ shapes }),
  
  addShape: (shape: Shape): void => set((state: DrawboardStore) => ({
    shapes: [...state.shapes, shape]
  })),
  
  updateShape: (shape: Shape): void => set((state: DrawboardStore) => ({
    shapes: state.shapes.map((s: Shape) => s.id === shape.id ? shape : s)
  })),
  
  deleteShape: (shapeId: string): void => set((state: DrawboardStore) => ({
    shapes: state.shapes.filter((s: Shape) => s.id !== shapeId)
  })),
});