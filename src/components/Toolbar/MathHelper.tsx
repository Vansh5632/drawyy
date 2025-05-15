import React, { useState, useEffect } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { shapesState } from '@/state/atoms/shapes';
import { mathResultByIdSelector, mathResultsState } from '@/state/selectors/mathResults';
import { MathResult, MathShape } from '@/types/types';

interface MathHelperProps {
  selectedShapeId?: string;
}

export default function MathHelper({ selectedShapeId }: MathHelperProps) {
  const [shapes, setShapes] = useRecoilState(shapesState);
  const [mathResults, setMathResults] = useRecoilState(mathResultsState);
  const [showSteps, setShowSteps] = useState(false);
  
  // Get the math result for the selected shape
  const selectedMathResult = selectedShapeId 
    ? useRecoilValue(mathResultByIdSelector(selectedShapeId))
    : null;
  
  // Update math shape with result
  useEffect(() => {
    if (selectedMathResult && selectedShapeId) {
      setShapes(prevShapes => 
        prevShapes.map(shape => 
          shape.id === selectedShapeId 
            ? { ...shape, result: selectedMathResult.result } as MathShape
            : shape
        )
      );
      
      // Update math results cache
      setMathResults(prev => {
        const exists = prev.some(r => r.shapeId === selectedMathResult.shapeId);
        if (exists) {
          return prev.map(r => r.shapeId === selectedMathResult.shapeId ? selectedMathResult : r);
        } else {
          return [...prev, selectedMathResult];
        }
      });
    }
  }, [selectedMathResult, selectedShapeId, setShapes, setMathResults]);
  
  if (!selectedMathResult) {
    return null;
  }
  
  return (
    <div className="p-4 bg-white shadow-lg rounded-lg max-w-md">
      <h3 className="text-lg font-medium mb-2">Math Solution</h3>
      
      <div className="mb-4">
        <div className="font-medium">Expression:</div>
        <div className="bg-gray-100 p-2 rounded">{selectedMathResult.expression}</div>
      </div>
      
      <div className="mb-4">
        <div className="font-medium">Result:</div>
        <div className="bg-gray-100 p-2 rounded text-lg">{selectedMathResult.result}</div>
      </div>
      
      {selectedMathResult.steps && selectedMathResult.steps.length > 0 && (
        <div>
          <button 
            className="text-blue-500 underline mb-2"
            onClick={() => setShowSteps(!showSteps)}
          >
            {showSteps ? 'Hide Steps' : 'Show Steps'}
          </button>
          
          {showSteps && (
            <div className="border-t pt-2">
              <div className="font-medium mb-1">Solution Steps:</div>
              <ol className="list-decimal pl-5">
                {selectedMathResult.steps.map((step, index) => (
                  <li key={index} className="mb-1">{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
      
      {selectedMathResult.error && (
        <div className="text-red-500 mt-2">
          Error: {selectedMathResult.error}
        </div>
      )}
    </div>
  );
}