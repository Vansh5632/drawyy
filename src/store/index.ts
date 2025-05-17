import { create } from 'zustand';
import { createShapesSlice, ShapesSlice } from './shapesSlice';
import { createHistorySlice, HistorySlice } from './historySlice';
import { createSelectionSlice, SelectionSlice } from './selectionSlice';
import { createSessionSlice, SessionSlice } from './sessionSlice';
import { createToolSlice, ToolSlice } from './toolSlice';
import { createViewportSlice, ViewportSlice } from './viewportSlice';

// Define the combined store type
export type DrawboardStore = 
  & ShapesSlice 
  & HistorySlice 
  & SelectionSlice 
  & SessionSlice
  & ToolSlice
  & ViewportSlice;

// Create the store with combined slices
export const useStore = create<DrawboardStore>((set, get, store) => ({
  ...createShapesSlice(set, get, store),
  ...createHistorySlice(set, get, store),
  ...createSelectionSlice(set, get, store),
  ...createSessionSlice(set, get, store),
  ...createToolSlice(set, get, store),
  ...createViewportSlice(set, get, store),
}));