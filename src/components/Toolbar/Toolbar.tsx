import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Tool, StrokeStyle } from '@/types/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Pencil,
  Hand,
  Search,
  Square,
  Circle,
  Type,
  Calculator,
  Eraser,
  Minus,
  Moon,
  Sun,
} from 'lucide-react';

const Toolbar: React.FC = () => {
  const tool = useStore((state) => state.tool);
  const setTool = useStore((state) => state.setTool);
  const strokeStyle = useStore((state) => state.strokeStyle);
  const setStrokeStyle = useStore((state) => state.setStrokeStyle);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Debug logger for current state
  useEffect(() => {
    console.log('Current tool:', tool);
    console.log('Current stroke style:', strokeStyle);
  }, [tool, strokeStyle]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const tools: { id: Tool; name: string; icon: React.ReactNode }[] = [
    { id: 'select', name: 'Select', icon: <Search className="w-6 h-6" /> },
    { id: 'pan', name: 'Pan', icon: <Hand className="w-6 h-6" /> },
    { id: 'freedraw', name: 'Pencil', icon: <Pencil className="w-6 h-6" /> },
    { id: 'line', name: 'Line', icon: <Minus className="w-6 h-6" /> },
    { id: 'rectangle', name: 'Rectangle', icon: <Square className="w-6 h-6" /> },
    { id: 'ellipse', name: 'Circle', icon: <Circle className="w-6 h-6" /> },
    { id: 'arrow', name: 'Arrow', icon: <ArrowRight className="w-6 h-6" /> },
    { id: 'text', name: 'Text', icon: <Type className="w-6 h-6" /> },
    { id: 'math', name: 'Math', icon: <Calculator className="w-6 h-6" /> },
    { id: 'eraser', name: 'Eraser', icon: <Eraser className="w-6 h-6" /> },
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
    console.log('Tool clicked:', newTool);
    setTool(newTool);
  };

  const handleColorChange = (color: string) => {
    console.log('Color clicked:', color);
    setStrokeStyle({ color });
  };

  const handleWidthChange = (width: number) => {
    console.log('Width clicked:', width);
    setStrokeStyle({ width });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const opacity = parseFloat(e.target.value);
    console.log('Opacity changed:', opacity);
    setStrokeStyle({ opacity });
  };

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col h-full w-80 p-6 space-y-6 rounded-lg shadow-lg ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-gradient-to-b from-white to-gray-100 text-gray-900'
      }`}
    >
      {/* Dark Mode Toggle */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Tools Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Tools</h3>
        <div className="grid grid-cols-4 gap-2">
          {tools.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-3 rounded-lg transition-colors ${
                tool === t.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleToolChange(t.id)}
              title={t.name}
            >
              {t.icon}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Colors Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Colors</h3>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((c) => (
            <motion.button
              key={c.color}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`w-8 h-8 rounded-full relative ${
                strokeStyle.color === c.color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
              }`}
              style={{ backgroundColor: c.color }}
              onClick={() => handleColorChange(c.color)}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Stroke Width</h3>
        <div className="flex flex-wrap gap-2">
          {strokeWidths.map((width) => (
            <motion.button
              key={width}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg transition-colors ${
              strokeStyle.width === width
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleWidthChange(width)}
              title={`${width}px`}
            >
              <div
              className={`rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`}
              style={{
              width: Math.min(24, Math.max(8, width * 2)),
              height: Math.min(24, Math.max(8, width * 2)),
              }}
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Opacity Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Opacity</h3>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={strokeStyle.opacity}
          onChange={handleOpacityChange}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Tips Section */}
      <div className="mt-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900"
        >
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Tips</h3>
          <ul className="text-xs text-blue-600 dark:text-blue-200 space-y-1">
            <li>Use the 'Math' tool to write and solve equations</li>
            <li>Draw a shape and it will be automatically recognized</li>
            <li>Press Ctrl+Z to undo, Ctrl+Y to redo</li>
            <li>Use the select tool to move and resize shapes</li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Toolbar;