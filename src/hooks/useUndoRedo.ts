import { useCallback } from 'react';
import { useStore } from '@/store';
import { Shape } from '@/types/types';
import socketClient from '@/lib/collaboration/socket';

/**
 * Hook for managing undo/redo functionality
 */
export default function useUndoRedo() {
  const shapes = useStore(state => state.shapes);
  const setShapes = useStore(state => state.setShapes);
  const history = useStore(state => state.history);
  const historyIndex = useStore(state => state.historyIndex);
  const setHistoryIndex = useStore(state => state.setHistoryIndex);
  const setSelectedShapeId = useStore(state => state.setSelectedShapeId);
  const currentUser = useStore(state => state.currentUser);
  const setHistory = useStore(state => state.setHistory);
  const clearHistory = useStore(state => state.clearHistory);

  /**
   * Save current state to history
   */
  const saveToHistory = useCallback((newShapes: Shape[] = shapes) => {
    // Create new history entry
    const newHistoryEntry = {
      shapes: [...newShapes],
      timestamp: Date.now()
    };
    
    useStore.setState(state => {
      // If we're not at the end of history, truncate future states
      const pastHistory = state.historyIndex < state.history.length - 1
        ? state.history.slice(0, state.historyIndex + 1)
        : state.history;
      
      // Add new entry and limit history size
      const newHistory = [...pastHistory, newHistoryEntry].slice(-50);
      
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, [shapes]);

  /**
   * Perform undo operation
   */
  const undo = useCallback(() => {
    if (historyIndex <= 0) return false;
    
    // Get the previous state
    const newIndex = historyIndex - 1;
    const previousState = history[newIndex];
    
    if (previousState) {
      // Apply previous state
      setShapes(previousState.shapes);
      setHistoryIndex(newIndex);
      setSelectedShapeId(null);
      
      // Sync with collaborators
      if (currentUser) {
        socketClient.sendOperation({
          id: Math.random().toString(36).substring(2, 15),
          type: 'batch',
          data: { shapes: previousState.shapes, type: 'undo' },
          timestamp: Date.now(),
          userId: currentUser.id,
          vectorClock: socketClient.getVectorClock()
        });
      }
      
      return true;
    }
    
    return false;
  }, [history, historyIndex, setShapes, setHistoryIndex, setSelectedShapeId, currentUser]);

  /**
   * Perform redo operation
   */
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return false;
    
    // Get the next state
    const newIndex = historyIndex + 1;
    const nextState = history[newIndex];
    
    if (nextState) {
      // Apply next state
      setShapes(nextState.shapes);
      setHistoryIndex(newIndex);
      setSelectedShapeId(null);
      
      // Sync with collaborators
      if (currentUser) {
        socketClient.sendOperation({
          id: Math.random().toString(36).substring(2, 15),
          type: 'batch',
          data: { shapes: nextState.shapes, type: 'redo' },
          timestamp: Date.now(),
          userId: currentUser.id,
          vectorClock: socketClient.getVectorClock()
        });
      }
      
      return true;
    }
    
    return false;
  }, [history, historyIndex, setShapes, setHistoryIndex, setSelectedShapeId, currentUser]);

  return {
    saveToHistory,
    undo,
    redo,
    clearHistory
  };
}