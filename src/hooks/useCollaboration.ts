import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/store';
import socketClient from '@/lib/collaboration/socket';
import { createDiff, applyOperations } from '@/lib/collaboration/sync';
import { Shape, Operation, WebSocketMessage, User, DrawOperation } from '@/types/types';

export default function useCollaboration() {
  const shapes = useStore(state => state.shapes);
  const setShapes = useStore(state => state.setShapes);
  const session = useStore(state => state.session);
  const setSession = useStore(state => state.setSession);
  const currentUser = useStore(state => state.currentUser);
  const lastSyncedShapes = useRef<Shape[]>([]);
  
  // Initialize WebSocket connection and listen for events
  useEffect(() => {
    socketClient.connect();
    
    const handleOperation = (message: WebSocketMessage) => {
      if (message.sender === currentUser?.id) return; // Skip own operations
      
      const operation = message.payload as Operation;
      setShapes(currentShapes => applyOperations(currentShapes, [operation]));
    };
    
    const handleSessionState = (message: WebSocketMessage) => {
      const { users, operations } = message.payload;
      
      // Update session state with users
      setSession({
        ...session,
        users
      });
      
      // Apply all operations to set initial state
      if (operations && operations.length) {
        // Apply operations and update lastSyncedShapes with the new state
        setShapes(prevShapes => {
          const newShapes = applyOperations([], operations);
          lastSyncedShapes.current = [...newShapes];
          return newShapes;
        });
      }
    };
    
    const handleCursorUpdate = (message: WebSocketMessage) => {
      const { userId, cursor } = message.payload;
      
      // Update cursor position for the specified user
      setSession(current => {
        const updatedUsers = current.users.map(user => 
          user.id === userId 
            ? { ...user, cursor } 
            : user
        );
        
        return {
          ...current,
          users: updatedUsers
        };
      });
    };
    
    // Register event handlers
    socketClient.on('operation', handleOperation);
    socketClient.on('sync', handleSessionState);
    socketClient.on('cursor', handleCursorUpdate);
    
    // Cleanup on unmount
    return () => {
      socketClient.off('operation', handleOperation);
      socketClient.off('sync', handleSessionState);
      socketClient.off('cursor', handleCursorUpdate);
    };
  }, [setShapes, setSession, session, currentUser]);
  
  // Process and sync draw operations
  const processDrawOperation = useCallback((drawOp: DrawOperation) => {
    if (!currentUser || !socketClient.isConnected()) return;
    
    // Create operation to sync
    const operation: Operation = {
      id: Math.random().toString(36).substring(2, 15),
      type: 'update',
      data: drawOp,
      timestamp: Date.now(),
      userId: currentUser.id,
      vectorClock: socketClient.getVectorClock()
    };
    
    // Send operation to all collaborators
    socketClient.sendOperation(operation);
  }, [currentUser]);
  
  // Update cursor position
  const updateCursor = useCallback((position: {x: number, y: number}) => {
    if (!currentUser || !socketClient.isConnected()) return;
    
    socketClient.sendCursorUpdate(currentUser.id, position);
  }, [currentUser]);
  
  // Sync local changes with collaborators
  const syncChanges = useCallback(() => {
    if (!currentUser || shapes.length === 0 || !socketClient.isConnected()) return;
    
    // Create diff of current and last synced shapes
    const operations = createDiff(lastSyncedShapes.current, shapes, currentUser.id);
    
    // Send operations if there are changes
    if (operations.length > 0) {
      operations.forEach(operation => {
        socketClient.sendOperation(operation);
      });
      
      // Update last synced state
      lastSyncedShapes.current = [...shapes];
    }
  }, [shapes, currentUser]);
  
  return {
    users: session?.users || [],
    processDrawOperation,
    updateCursor,
    syncChanges
  };
}