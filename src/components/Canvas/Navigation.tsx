import React from 'react';
import { useStore } from '@/store';

const Navigation: React.FC = () => {
  const viewport = useStore(state => state.viewport);
  const setViewport = useStore(state => state.setViewport);
  
  // Zoom in function
  const zoomIn = () => {
    setViewport({
      scale: Math.min(viewport.scale * 1.2, 5) // Max zoom 5x
    });
  };
  
  // Zoom out function
  const zoomOut = () => {
    setViewport({
      scale: Math.max(viewport.scale / 1.2, 0.2) // Min zoom 0.2x
    });
  };
  
  // Reset view function
  const resetView = () => {
    setViewport({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
  };

  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-md shadow-md flex flex-col p-2">
      {/* Zoom controls */}
      <div className="flex flex-col gap-2">
        <button 
          onClick={zoomIn}
          title="Zoom In"
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded"
        >
          <span className="text-xl">+</span>
        </button>
        
        <div className="bg-gray-100 px-2 py-1 rounded text-center text-xs">
          {Math.round(viewport.scale * 100)}%
        </div>
        
        <button 
          onClick={zoomOut}
          title="Zoom Out"
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded"
        >
          <span className="text-xl">-</span>
        </button>
        
        <button 
          onClick={resetView}
          title="Reset View"
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded mt-2"
        >
          <span className="text-sm">↺</span>
        </button>
      </div>
      
      {/* Mini-map (simplified) */}
      <div className="mt-4 border border-gray-300 w-24 h-24 relative">
        <div className="absolute inset-0 bg-gray-50">
          {/* This would be a simplified view of your canvas */}
          <div 
            className="absolute border-2 border-blue-500"
            style={{
              left: `${Math.max(0, 50 - viewport.translateX / 20)}%`,
              top: `${Math.max(0, 50 - viewport.translateY / 20)}%`,
              width: `${Math.min(100, 100 / viewport.scale)}%`,
              height: `${Math.min(100, 100 / viewport.scale)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;