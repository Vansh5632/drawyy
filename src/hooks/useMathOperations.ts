import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Shape, MathShape, MathResult } from '@/types/types';
import { findAndProcessMathShapes, processMathShape } from '@/lib/ai/mathProcessor';

export function useMathOperations() {
  const shapes = useStore(state => state.shapes);
  const [mathResults, setMathResults] = useState<MathResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Process all math shapes when shapes change
  useEffect(() => {
    async function processMathShapes() {
      setLoading(true);
      try {
        const results = await findAndProcessMathShapes(shapes);
        setMathResults(results);
      } catch (error) {
        console.error('Error processing math shapes:', error);
      } finally {
        setLoading(false);
      }
    }

    processMathShapes();
  }, [shapes]);

  // Get result for a specific shape
  const getMathResultById = (shapeId: string): MathResult | null => {
    return mathResults.find(result => result.shapeId === shapeId) || null;
  };

  // Process a single math shape
  const processMath = async (shape: MathShape): Promise<MathResult> => {
    const result = await processMathShape(shape);
    
    // Update results state with new result
    setMathResults(prev => {
      const index = prev.findIndex(r => r.shapeId === shape.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = result;
        return updated;
      }
      return [...prev, result];
    });
    
    return result;
  };

  return {
    mathResults,
    getMathResultById,
    processMath,
    loading
  };
}