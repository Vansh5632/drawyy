import React from 'react';
import { useStore } from '@/store';
import { Tool, StrokeStyle } from '@/types/types';

const Toolbar: React.FC = () => {
  const tool = useStore(state => state.tool);
  const setTool = useStore(state => state.setTool);
  const strokeStyle = useStore(state => state.strokeStyle);
  const setStrokeStyle = useStore(state => state.setStrokeStyle);

  const tools: { id: Tool; name: string; icon: string }[] = [
    { id: 'select', name: 'Select', icon: '🔍' },
    { id: 'pan', name: 'Pan', icon: '✋' },
    { id: 'freedraw', name: 'Pencil', icon: '✏️' },
    { id: 'line', name: 'Line', icon: '➖' },
    { id: 'rectangle', name: 'Rectangle', icon: '🔲' },
    { id: 'ellipse', name: 'Circle', icon: '⭕' },
    { id: 'arrow', name: 'Arrow', icon: '➡️' },
    { id: 'text', name: 'Text', icon: 'T' },
    { id: 'math', name: 'Math', icon: '∑' },
    { id: 'eraser', name: 'Eraser', icon: '🧹' },
  ];

  const colors = [
    { color: '#000000', name: 'Black' },
    { color: '#FF0000', name: 'Red' },
    { color: '#0000FF', name: 'Blue' },
    { color: '#00FF00', name: 'Green' },
    { color: '#FFFF00', name: 'Yellow' },
    { color: '#FF00FF', name: 'Magenta' },
    { color: '#00FFFF', name: 'Cyan' },
  ];

  const strokeWidths = [1, 2, 4, 6, 8, 12];

  const handleToolChange = (newTool: Tool) => {
    setTool(newTool);
  };

  const handleColorChange = (color: string) => {
    setStrokeStyle({ color });
  };

  const handleWidthChange = (width: number) => {
    setStrokeStyle({ width });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const opacity = parseFloat(e.target.value);
    setStrokeStyle({ opacity });
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Tools</h3>
        <div className="grid grid-cols-5 gap-2">
          {tools.map((t) => (
            <button
              key={t.id}
              className={`p-2 rounded ${
                tool === t.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleToolChange(t.id)}
              title={t.name}
            >
              <span className="text-xl">{t.icon}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Colors</h3>
        <div className="grid grid-cols-7 gap-2">
          {colors.map((c) => (
            <button
              key={c.color}
              className={`w-6 h-6 rounded-full ${
                strokeStyle.color === c.color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: c.color }}
              onClick={() => handleColorChange(c.color)}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Stroke Width</h3>
        <div className="flex space-x-2">
          {strokeWidths.map((width) => (
            <button
              key={width}
              className={`p-2 rounded ${
                strokeStyle.width === width ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleWidthChange(width)}
              title={`${width}px`}
            >
              <div 
                className="rounded-full bg-black" 
                style={{ 
                  width: Math.min(24, Math.max(8, width * 2)), 
                  height: Math.min(24, Math.max(8, width * 2)) 
                }} 
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Opacity</h3>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={strokeStyle.opacity}
          onChange={handleOpacityChange}
          className="w-full"
        />
      </div>

      <div className="mt-auto">
        <div className="p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-700 mb-2">Tips</h3>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>Use the 'Math' tool to write and solve equations</li>
            <li>Draw a shape and it will be automatically recognized</li>
            <li>Press Ctrl+Z to undo, Ctrl+Y to redo</li>
            <li>Use the select tool to move and resize shapes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;