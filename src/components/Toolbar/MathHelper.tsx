import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { MathResult, MathShape } from '@/types/types';
import { useMathOperations } from '@/hooks/useMathOperations';

interface MathHelperProps {
  onClose?: () => void;
}

const MathHelper: React.FC<MathHelperProps> = ({ onClose }) => {
  const shapes = useStore(state => state.shapes);
  const [selectedMathShape, setSelectedMathShape] = useState<MathShape | null>(null);
  const { mathResults, processMath, loading } = useMathOperations();
  const [currentResult, setCurrentResult] = useState<MathResult | null>(null);
  const [manualEquation, setManualEquation] = useState('');
  
  // Find all math shapes in the canvas
  useEffect(() => {
    const mathShapes = shapes.filter(shape => shape.type === 'math') as MathShape[];
    if (mathShapes.length > 0 && !selectedMathShape) {
      setSelectedMathShape(mathShapes[0]);
    }
  }, [shapes, selectedMathShape]);

  // Get result for selected shape
  useEffect(() => {
    if (selectedMathShape) {
      const result = mathResults.find(r => r.shapeId === selectedMathShape.id);
      setCurrentResult(result || null);
    }
  }, [selectedMathShape, mathResults]);

  // Handle processing the equation
  const handleProcessEquation = async () => {
    if (selectedMathShape) {
      // Update shape content if manual equation was entered
      if (manualEquation) {
        const updatedShape: MathShape = {
          ...selectedMathShape,
          content: manualEquation
        };
        
        // Update the shape in the store
        useStore.getState().updateShape(updatedShape);
        
        // Process the math
        const result = await processMath(updatedShape);
        setCurrentResult(result);
      } else {
        // Process the math as is
        const result = await processMath(selectedMathShape);
        setCurrentResult(result);
      }
    }
  };

  // Handle changing the selected math shape
  const handleChangeShape = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shapeId = e.target.value;
    const shape = shapes.find(s => s.id === shapeId) as MathShape | undefined;
    if (shape) {
      setSelectedMathShape(shape);
      setManualEquation('');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Math Helper</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✖
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Math Shape
          </label>
          <select 
            className="w-full border border-gray-300 rounded-md p-2"
            value={selectedMathShape?.id || ''}
            onChange={handleChangeShape}
            disabled={shapes.filter(s => s.type === 'math').length === 0}
          >
            {shapes.filter(s => s.type === 'math').length === 0 ? (
              <option value="">No math shapes available</option>
            ) : (
              shapes
                .filter(s => s.type === 'math')
                .map(shape => (
                  <option key={shape.id} value={shape.id}>
                    {(shape as MathShape).content || `Math ${shape.id.substring(0, 5)}...`}
                  </option>
                ))
            )}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equation
          </label>
          <input 
            type="text"
            className="w-full border border-gray-300 rounded-md p-2"
            value={manualEquation || selectedMathShape?.content || ''}
            onChange={(e) => setManualEquation(e.target.value)}
            placeholder="Edit or enter equation, e.g. 2x + 5 = 15"
          />
          <div className="text-xs text-gray-500 mt-1">
            Edit the equation if the recognition wasn't accurate
          </div>
        </div>
        
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          onClick={handleProcessEquation}
          disabled={!selectedMathShape || loading}
        >
          {loading ? 'Processing...' : 'Solve Equation'}
        </button>
        
        {currentResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Result:</h4>
            <div className="text-lg font-semibold text-blue-700 mb-2">
              {currentResult.result}
            </div>
            
            {currentResult.steps && currentResult.steps.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Steps:</h5>
                <ol className="list-decimal list-inside text-sm text-gray-600">
                  {currentResult.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            
            {currentResult.error && (
              <div className="text-red-600 text-sm mt-2">
                Error: {currentResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MathHelper;