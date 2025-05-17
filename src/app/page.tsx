'use client'
import React, { useRef, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Toolbar from '@/components/Toolbar/Toolbar';
import Renderer from '@/components/Canvas/Renderer';
import Navigation from '@/components/Canvas/Navigation';
import Chat from '@/components/Chat';
import MathHelper from '@/components/Toolbar/MathHelper';
import { useStore } from '@/store';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tool = useStore(state => state.tool);
  const [showMathHelper, setShowMathHelper] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Resize canvas based on window size
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        setCanvasSize({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };
    
    handleResize(); // Initial size
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Show math helper when math tool is selected
  useEffect(() => {
    if (tool === 'math') {
      setShowMathHelper(true);
    }
  }, [tool]);

  return (
    <div className="flex flex-col h-screen">
      <Header canvasRef={canvasRef} />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 p-4 border-r">
          <Toolbar />
          
          {/* Show math helper when math tool is selected */}
          {showMathHelper && (
            <div className="mt-4">
              <MathHelper onClose={() => setShowMathHelper(false)} />
            </div>
          )}
        </div>
        
        <div id="canvas-container" className="flex-1 relative">
          <Renderer 
            width={canvasSize.width} 
            height={canvasSize.height} 
            canvasRef={canvasRef}
          />
          <Navigation />
          
          {/* Show toggle button for math helper when not visible */}
          {!showMathHelper && tool === 'math' && (
            <button
              className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-md shadow-md"
              onClick={() => setShowMathHelper(true)}
            >
              Open Math Helper
            </button>
          )}
        </div>
      </div>
      
      {/* Chat component for real-time collaboration */}
      <Chat />
    </div>
  );
}