import { StateCreator, StoreApi } from 'zustand';
import { DrawboardSessionInfo, User } from '@/types/types';
import { DrawboardStore } from '.';

export interface SessionSlice {
  // State
  session: DrawboardSessionInfo;
  currentUser: User | null;
  
  // Actions
  setSession: (session: DrawboardSessionInfo) => void;
  setCurrentUser: (user: User | null) => void;
  updateSessionUsers: (users: User[]) => void;
}

export const createSessionSlice: StateCreator<
  DrawboardStore, 
  [], 
  [], 
  SessionSlice
> = (set, get, store) => ({
  session: {
    sessionId: '',
    users: [],
    activeUser: undefined,
  },
  currentUser: null,
  
  setSession: (session) => set({ session }),
  
  setCurrentUser: (currentUser) => set({ currentUser }),
  
  updateSessionUsers: (users) => set((state) => ({
    session: {
      ...state.session,
      users
    }
  })),
});