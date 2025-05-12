import {atom} from 'recoil';
import { Shape } from '@/types/types';

export const shapesState = atom<Shape[]>({
    key: 'shapesState',
    default: [],
});