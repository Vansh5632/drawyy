import { atom } from 'recoil';
import { HistoryEntry } from '@/types/types';

export const historyState = atom<HistoryEntry[]>({
  key: 'historyState',
  default: [],
});

export const historyIndexState = atom<number>({
  key: 'historyIndexState',
  default: -1,
});