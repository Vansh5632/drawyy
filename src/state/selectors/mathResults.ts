import { selector, selectorFamily } from 'recoil';
import { shapesState } from '@/state/atoms/shapes';
import { findAndProcessMathShapes, processMathShape } from '@/lib/ai/mathProcessor';
import { MathResult, MathShape } from '@/types/types';

// Atom to store math processing results
import { atom } from 'recoil';
export const mathResultsState = atom<MathResult[]>({
  key: 'mathResultsState',
  default: [],
});

// Selector to get all math results
export const mathResultsSelector = selector<MathResult[]>({
  key: 'mathResultsSelector',
  get: async ({get}) => {
    const shapes = get(shapesState);
    return await findAndProcessMathShapes(shapes);
  }
});

// Selector to get math result for a specific shape by ID
export const mathResultByIdSelector = selectorFamily<MathResult | null, string>({
  key: 'mathResultByIdSelector',
  get: (shapeId) => async ({get}) => {
    const shapes = get(shapesState);
    const mathShape = shapes.find(s => s.id === shapeId && s.type === 'math') as MathShape | undefined;
    
    if (!mathShape) return null;
    
    return await processMathShape(mathShape);
  }
});

// Selector to check if a shape has a math solution
export const hasMathSolutionSelector = selectorFamily<boolean, string>({
  key: 'hasMathSolutionSelector',
  get: (shapeId) => ({get}) => {
    const mathResult = get(mathResultByIdSelector(shapeId));
    return mathResult !== null && !mathResult.error;
  }
});