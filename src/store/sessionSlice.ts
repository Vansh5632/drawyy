import { StateCreator } from 'zustand';
import { DrawboardStore } from '.';
import { User, Session } from '@/types/types';

export interface SessionSlice {
  // State
  currentUser: User | null;
  session: Session;
  
  // Actions
  setCurrentUser: (user: User) => void;
  setUserCursor: (userId: string, x: number, y: number) => void;
  setUserActive: (userId: string, isActive: boolean) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
}

// Generate a random color for new users
const getRandomColor = () => {
  const colors = [
    '#2563eb', // Blue
    '#dc2626', // Red
    '#16a34a', // Green
    '#9333ea', // Purple
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#4f46e5', // Indigo
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate default user if none exists
const createDefaultUser = (): User => {
  const userId = `user_${Math.random().toString(36).substring(2, 9)}`;
  const userName = `User ${Math.floor(Math.random() * 1000)}`;
  
  return {
    id: userId,
    name: userName,
    color: getRandomColor(),
    isActive: true,
    cursor: null
  };
};

export const createSessionSlice: StateCreator<
  DrawboardStore, 
  [], 
  [], 
  SessionSlice
> = (set, get) => ({
  currentUser: createDefaultUser(), // Start with a default user
  
  session: {
    id: 'default-session',
    users: []
  },
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  addUser: (user) => set((state) => ({
    session: {
      ...state.session,
      users: [...state.session.users.filter(u => u.id !== user.id), user]
    }
  })),
  
  removeUser: (userId) => set((state) => ({
    session: {
      ...state.session,
      users: state.session.users.filter(user => user.id !== userId)
    }
  })),
  
  setUserCursor: (userId, x, y) => set((state) => {
    const userIndex = state.session.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) return state;
    
    const updatedUsers = [...state.session.users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      cursor: { x, y }
    };
    
    return {
      session: {
        ...state.session,
        users: updatedUsers
      }
    };
  }),
  
  setUserActive: (userId, isActive) => set((state) => {
    const userIndex = state.session.users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) return state;
    
    const updatedUsers = [...state.session.users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      isActive
    };
    
    return {
      session: {
        ...state.session,
        users: updatedUsers
      }
    };
  })
});