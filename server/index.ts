import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { WebSocketMessage, Operation, VectorClock } from "../src/types/types";

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://your-production-domain.com"
        : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// In-memory store for session data
const sessions = new Map<
  string,
  {
    users: Map<
      string,
      {
        id: string;
        name: string;
        color: string;
        cursor?: { x: number; y: number };
      }
    >;
    operations: Operation[];
    vectorClocks: Map<string, VectorClock>;
  }
>();

// Apply middleware
app.use(cors());
app.use(express.json());

// Track active connections
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  let currentSessionId: string | null = null;
  let currentUserId: string | null = null;

  // Handle joining a session
  socket.on("join-session", ({ sessionId, user }) => {
    try {
      currentSessionId = sessionId;
      currentUserId = user.id;

      // Create session if it doesn't exist
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          users: new Map(),
          operations: [],
          vectorClocks: new Map(),
        });
      }

      const session = sessions.get(sessionId)!;

      // Add user to session
      session.users.set(user.id, user);

      // Initialize vector clock for the user
      if (!session.vectorClocks.has(user.id)) {
        const initialClock: VectorClock = {};
        Array.from(session.users.keys()).forEach((id) => {
          initialClock[id] = 0;
        });
        session.vectorClocks.set(user.id, initialClock);
      }

      // Join the socket room for this session
      socket.join(sessionId);

      // Notify others that user has joined
      socket.to(sessionId).emit("user-joined", { user });

      // Send current session state to the new user
      const sessionUsers = Array.from(session.users.values());
      const sessionOperations = session.operations;

      socket.emit("session-state", {
        users: sessionUsers,
        operations: sessionOperations,
      });
    } catch (error) {
      console.error("Error joining session:", error);
      socket.emit("error", { message: "Failed to join session" });
    }
  });

  // Handle drawing operations
  socket.on("operation", (message: WebSocketMessage) => {
    if (!currentSessionId || !currentUserId) return;

    try {
      const session = sessions.get(currentSessionId);
      if (!session) return;

      const { payload, vectorClock } = message;
      const operation = payload as Operation;

      // Update vector clock
      if (vectorClock) {
        const userClock = session.vectorClocks.get(currentUserId) || {};

        // Increment current user's clock
        userClock[currentUserId] = (userClock[currentUserId] || 0) + 1;

        // Merge incoming vector clock
        Object.entries(vectorClock).forEach(([userId, clock]) => {
          userClock[userId] = Math.max(userClock[userId] || 0, clock);
        });

        session.vectorClocks.set(currentUserId, userClock);

        // Attach updated vector clock to the operation
        operation.vectorClock = { ...userClock };
      }

      // Add operation to history
      session.operations.push(operation);

      // Broadcast operation to other clients in the session
      socket.to(currentSessionId).emit("operation", {
        type: "operation",
        payload: operation,
        sender: currentUserId,
        vectorClock: operation.vectorClock,
      });
    } catch (error) {
      console.error("Error processing operation:", error);
      socket.emit("error", { message: "Failed to process operation" });
    }
  });

  // Handle cursor position updates
  socket.on("cursor", (message: WebSocketMessage) => {
    if (!currentSessionId || !currentUserId) return;

    const session = sessions.get(currentSessionId);
    if (!session) return;

    const { payload } = message;
    const userInfo = session.users.get(currentUserId);

    if (userInfo) {
      userInfo.cursor = payload.position;
      session.users.set(currentUserId, userInfo);

      // Broadcast cursor position to other clients
      socket.to(currentSessionId).emit("cursor", {
        type: "cursor",
        payload: {
          userId: currentUserId,
          position: payload.position,
        },
        sender: currentUserId,
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (currentSessionId && currentUserId) {
      const session = sessions.get(currentSessionId);

      if (session) {
        // Remove user from session
        session.users.delete(currentUserId);

        // Notify others that user has left
        socket
          .to(currentSessionId)
          .emit("user-left", { userId: currentUserId });

        // Clean up empty sessions
        if (session.users.size === 0) {
          sessions.delete(currentSessionId);
        }
      }
    }

    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
