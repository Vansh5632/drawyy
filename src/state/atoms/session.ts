import { atom } from 'recoil';
import { DrawboardSessionInfo, User } from '@/types/types';

export const sessionState = atom<DrawboardSessionInfo>({
  key: 'sessionState',
  default: {
    sessionId: '',
    users: [],
    activeUser: undefined,
  },
});

export const currentUserState = atom<User | null>({
  key: 'currentUserState',
  default: null,
});