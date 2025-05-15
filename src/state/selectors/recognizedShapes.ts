import { selector, selectorFamily } from 'recoil';
import { shapesState } from '@/state/atoms/shapes';
import { batchRecognizeShapes, recognizeShape } from '@/lib/ai/shapeRecognition';
import { Shape, RecognizedShapeResult } from '@/types/types';

// Selector to get all recognized shapes
export const recognizedShapesSelector = selector<RecognizedShapeResult[]>({
  key: 'recognizedShapesSelector',
  get: ({get}) => {
    const shapes = get(shapesState);
    // Only process freedraw shapes
    return batchRecognizeShapes(shapes, true);
  }
});

// Selector to get a specific recognized shape by ID
export const recognizedShapeByIdSelector = selectorFamily<RecognizedShapeResult | null, string>({
  key: 'recognizedShapeByIdSelector',
  get: (shapeId) => ({get}) => {
    const allRecognized = get(recognizedShapesSelector);
    return allRecognized.find(result => 
      result.originalShape.id === shapeId || 
      result.recognizedShape.id === shapeId
    ) || null;
  }
});

// Selector to check if a shape should be replaced with recognized version
export const shouldReplaceWithRecognizedSelector = selectorFamily<boolean, string>({
  key: 'shouldReplaceWithRecognizedSelector',
  get: (shapeId) => ({get}) => {
    const recognized = get(recognizedShapeByIdSelector(shapeId));
    // Consider replacing if confidence is high enough
    return !!recognized && recognized.confidence > 0.8;
  }
});