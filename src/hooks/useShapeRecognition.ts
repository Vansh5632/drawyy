import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Shape, RecognizedShapeResult } from '@/types/types';
import { batchRecognizeShapes, recognizeShape } from '@/lib/ai/shapeRecognition';

export function useShapeRecognition() {
  const shapes = useStore(state => state.shapes);
  const [recognizedShapes, setRecognizedShapes] = useState<RecognizedShapeResult[]>([]);

  // Process all shapes when shapes change
  useEffect(() => {
    // Only process freedraw shapes
    const results = batchRecognizeShapes(shapes, true);
    setRecognizedShapes(results);
  }, [shapes]);

  // Get recognized shape by ID
  const getRecognizedShapeById = (shapeId: string): RecognizedShapeResult | null => {
    return recognizedShapes.find(result => 
      result.originalShape.id === shapeId || 
      result.recognizedShape.id === shapeId
    ) || null;
  };

  // Recognize a single shape and update state
  const recognizeSingleShape = (shape: Shape): RecognizedShapeResult | null => {
    if (shape.type !== 'freedraw') return null;
    
    const result = recognizeShape(shape);
    if (result) {
      setRecognizedShapes(prev => {
        // Remove any existing results for this shape
        const filtered = prev.filter(r => 
          r.originalShape.id !== shape.id && 
          r.recognizedShape.id !== shape.id
        );
        
        return [...filtered, result];
      });
      
      return result;
    }
    
    return null;
  };

  return {
    recognizedShapes,
    getRecognizedShapeById,
    recognizeSingleShape
  };
}