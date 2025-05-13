import { useEffect, useCallback, useRef } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { shapesState } from '@/state/atoms/shapes';
import { sessionState, currentUserState } from '@/state/atoms/session';
import socketClient from '@/lib/collaboration/socket';
import { createDiff, applyOperations } from '@/lib/collaboration/sync';
import { Shape, Operation, WebSocketMessage, User, DrawOperation } from '@/types/types';

export default function useCollaboration() {
  const [shapes, setShapes] = useRecoilState(shapesState);
  const [session, setSession] = useRecoilState(sessionState);
  const currentUser = useRecoilValue(currentUserState);
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
      setSession(current => ({
        ...current,
        users: users
      }));
      
      // Apply all operations to set initial state
      if (operations && operations.length) {
        setShapes(currentShapes => applyOperations([], operations));
        lastSyncedShapes.current = applyOperations([], operations);
      }
    };
    
    const handleUserJoined = (message: WebSocketMessage) => {
      const user = message.payload.user as User;
      
      setSession(current => ({
        ...current,
        users: [...current.users, user]
      }));
    };
    
    const handleUserLeft = (message: WebSocketMessage) => {
      const userId = message.payload.userId as string;
      
      setSession(current => ({
        ...current,
        users: current.users.filter(u => u.id !== userId)
      }));
    };
    
    const handleCursor = (message: WebSocketMessage) => {
      const { userId, position } = message.payload;
      
      setSession(current => ({
        ...current,
        users: current.users.map(user => 
          user.id === userId 
            ? { ...user, cursor: position, lastActive: Date.now() }
            : user
        )
      }));
    };
    
    // Register event handlers
    socketClient.on('operation', handleOperation);
    socketClient.on('session-state', handleSessionState);
    socketClient.on('user-joined', handleUserJoined);
    socketClient.on('user-left', handleUserLeft);
    socketClient.on('cursor', handleCursor);
    
    // Cleanup
    return () => {
      socketClient.off('operation', handleOperation);
      socketClient.off('session-state', handleSessionState);
      socketClient.off('user-joined', handleUserJoined);
      socketClient.off('user-left', handleUserLeft);
      socketClient.off('cursor', handleCursor);
    };
  }, [currentUser, setSession, setShapes]);
  
  // Join a session
  const joinSession = useCallback((sessionId: string, user: User) => {
    if (!sessionId || !user) return;
    
    socketClient.joinSession(sessionId, user);
    
    setSession(current => ({
      ...current,
      sessionId,
      activeUser: user.id
    }));
  }, [setSession]);
  
  // Update cursor position
  const updateCursor = useCallback((position: { x: number, y: number }) => {
    if (!session.sessionId || !currentUser) return;
    socketClient.sendCursorPosition(position);
  }, [session.sessionId, currentUser]);
  
  // Process drawing operation
  const processDrawOperation = useCallback((operation: DrawOperation) => {
    if (!session.sessionId || !currentUser) return;
    
    // For now, we'll sync the entire shapes state periodically
    const diff = createDiff(lastSyncedShapes.current, shapes);
    
    if (diff.length > 0) {
      diff.forEach(op => {
        socketClient.sendOperation(op);
      });
      lastSyncedShapes.current = [...shapes];
    }
  }, [shapes, session.sessionId, currentUser]);
  
  // Synchronize shapes with server
  useEffect(() => {
    if (!session.sessionId || !currentUser) return;
    
    // Debounce sync to avoid too frequent updates
    const syncTimeout = setTimeout(() => {
      const diff = createDiff(lastSyncedShapes.current, shapes);
      
      if (diff.length > 0) {
        diff.forEach(op => {
          socketClient.sendOperation(op);
        });
        lastSyncedShapes.current = [...shapes];
      }
    }, 200);
    
    return () => clearTimeout(syncTimeout);
  }, [shapes, session.sessionId, currentUser]);
  
  return {
    joinSession,
    updateCursor,
    processDrawOperation,
    isConnected: session.sessionId !== '',
    users: session.users
  };
}