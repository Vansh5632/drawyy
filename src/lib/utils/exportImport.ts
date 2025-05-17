import { Shape } from '@/types/types';

// File format type
type DrawboardFile = {
  version: string;
  shapes: Shape[];
  metadata: {
    createdAt: number;
    name?: string;
  };
};

/**
 * Export shapes to a file
 */
export function exportToFile(shapes: Shape[], fileName: string = 'drawboard'): void {
  const data: DrawboardFile = {
    version: '1.0',
    shapes,
    metadata: {
      createdAt: Date.now(),
      name: fileName
    }
  };
  
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create download link and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.drawboard.json`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import shapes from file
 */
export function importFromFile(file: File): Promise<Shape[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json) as DrawboardFile;
        
        // Verify file format
        if (!data.version || !data.shapes || !Array.isArray(data.shapes)) {
          reject(new Error('Invalid file format'));
          return;
        }
        
        resolve(data.shapes);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Export canvas as PNG image
 */
export function exportToPNG(canvas: HTMLCanvasElement, fileName: string = 'drawboard'): void {
  // Create a new canvas with white background
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return;
  
  // Fill with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  
  // Draw the original canvas content
  ctx.drawImage(canvas, 0, 0);
  
  // Convert to PNG and download
  const dataUrl = exportCanvas.toDataURL('image/png');
  
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${fileName}.png`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  document.body.removeChild(a);
}