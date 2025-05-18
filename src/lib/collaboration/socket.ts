import { io, Socket } from "socket.io-client";
import { User, WebSocketMessage, Operation, VectorClock } from "@/types/types";

// Determine server URL based on environment
const SERVER_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-domain.com'
  : 'http://localhost:4000';

class WebSocketClient {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private vectorClock: VectorClock = {};
  private messageHandlers: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();

  // Connect to WebSocket server
  connect() {
    if (this.socket) return;

    this.socket = io(SERVER_URL);
    
    // Set up event handlers
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
    
    // Handle incoming messages
    this.socket.on('operation', (message: WebSocketMessage) => {
      this.updateVectorClock(message.vectorClock);
      this.notifyHandlers('operation', message);
    });
    
    this.socket.on('cursor', (message: WebSocketMessage) => {
      this.notifyHandlers('cursor', message);
    });
    
    this.socket.on('user-joined', (message: WebSocketMessage) => {
      this.notifyHandlers('user-joined', message);
    });
    
    this.socket.on('user-left', (message: WebSocketMessage) => {
      this.notifyHandlers('user-left', message);
    });
    
    this.socket.on('session-state', (message: WebSocketMessage) => {
      this.notifyHandlers('session-state', message);
    });
    
    this.socket.on('error', (message: WebSocketMessage) => {
      console.error('WebSocket error:', message);
      this.notifyHandlers('error', message);
    });
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (!this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
    this.sessionId = null;
    this.userId = null;
    this.vectorClock = {};
  }

  // Join a session
  joinSession(sessionId: string, user: User) {
    if (!this.socket) {
      this.connect();
    }
    
    this.sessionId = sessionId;
    this.userId = user.id;
    
    // Reset vector clock
    this.vectorClock = { [user.id]: 0 };
    
    this.socket?.emit('join-session', { sessionId, user });
  }

  // Send an operation
  sendOperation(operation: Operation) {
    if (!this.socket || !this.sessionId || !this.userId) {
      console.warn('Cannot send operation: not connected to a session');
      return;
    }
    
    // Increment vector clock for current user
    this.vectorClock[this.userId] = (this.vectorClock[this.userId] || 0) + 1;
    
    const message: WebSocketMessage = {
      type: 'operation',
      payload: operation,
      sender: this.userId,
      vectorClock: { ...this.vectorClock }
    };
    
    this.socket.emit('operation', message);
  }

  // Send cursor position
  sendCursorPosition(position: { x: number; y: number }) {
    if (!this.socket || !this.sessionId || !this.userId) return;
    
    const message: WebSocketMessage = {
      type: 'cursor',
      payload: { position },
      sender: this.userId
    };
    
    this.socket.emit('cursor', message);
  }

  // Register a message handler
  on(type: string, handler: (message: WebSocketMessage) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    this.messageHandlers.get(type)?.push(handler);
  }

  // Remove a message handler
  off(type: string, handler: (message: WebSocketMessage) => void) {
    const handlers = this.messageHandlers.get(type);
    
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Check if connected to WebSocket server and session
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected && this.sessionId !== null;
  }

  // Update the vector clock based on received message
  private updateVectorClock(remoteVectorClock?: VectorClock) {
    if (!remoteVectorClock) return;
    
    // Merge vector clocks by taking the max value for each user
    Object.entries(remoteVectorClock).forEach(([userId, clock]) => {
      this.vectorClock[userId] = Math.max(this.vectorClock[userId] || 0, clock);
    });
  }

  // Notify all registered handlers for a message type
  private notifyHandlers(type: string, message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(type) || [];
    handlers.forEach(handler => handler(message));
  }

  // Get current vector clock
  getVectorClock(): VectorClock {
    return { ...this.vectorClock };
  }
}

// Create singleton instance
const socketClient = new WebSocketClient();

export default socketClient;