import React, { useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { Shape, Point, User } from '@/types/types';
import Canvas from './Canvas';
import { useShapeRecognition } from '@/hooks/useShapeRecognition';
import { useMathOperations } from '@/hooks/useMathOperations';

interface RendererProps {
  width: number;
  height: number;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

const Renderer: React.FC<RendererProps> = ({ width, height, canvasRef: externalCanvasRef }) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null); // Renamed original canvasRef to internalCanvasRef
  const refToUse = externalCanvasRef || internalCanvasRef; // Determine which ref to use

  const shapes = useStore(state => state.shapes);
  const selectedShapeId = useStore(state => state.selectedShapeId);
  const viewport = useStore(state => state.viewport);
  const session = useStore(state => state.session);
  
  // Get shape recognition results
  const { recognizedShapes } = useShapeRecognition();
  const { mathResults } = useMathOperations();

  // Draw on the canvas whenever shapes or viewport changes
  useEffect(() => {
    const canvas = refToUse.current; // Use the determined ref
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply viewport transformations
    ctx.save();
    ctx.translate(viewport.translateX, viewport.translateY);
    ctx.scale(viewport.scale, viewport.scale);
    
    // Draw grid
    drawGrid(ctx, canvas.width / viewport.scale, canvas.height / viewport.scale);
    
    // Ensure shapes is an array before iteration
    const shapesToRender = Array.isArray(shapes) ? shapes : [];
    if (!Array.isArray(shapes)) {
      console.error('Renderer received non-array shapes', shapes);
    }
    
    // Draw all shapes
    shapesToRender.forEach((shape) => {
      if (shape && typeof shape === 'object') {
        drawShape(ctx, shape, shape.id === selectedShapeId);
      }
    });
    
    // Draw math results
    drawMathResults(ctx, shapesToRender);
    
    // Draw collaborator cursors
    drawCollaboratorCursors(ctx);

    ctx.restore();
  }, [shapes, selectedShapeId, viewport, session, recognizedShapes, mathResults, refToUse]); // Added refToUse to dependency array

  // Helper function to draw a grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };
  
  // Helper function to draw collaborator cursors
  const drawCollaboratorCursors = (ctx: CanvasRenderingContext2D) => {
    const currentUserId = useStore.getState().currentUser?.id;
    const users = Array.isArray(session.users) ? session.users : [];
    
    users.forEach((user: User) => {
      // Don't draw current user's cursor
      if (user.id === currentUserId || !user.cursor || !user.isActive) return;
      
      const { x, y } = user.cursor;
      
      // Draw cursor
      ctx.fillStyle = user.color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 15, y + 5);
      ctx.lineTo(x + 5, y + 15);
      ctx.closePath();
      ctx.fill();
      
      // Draw name tag
      ctx.font = '12px Arial';
      ctx.fillStyle = 'white';
      ctx.fillRect(x + 10, y - 20, user.name.length * 7 + 10, 20);
      ctx.fillStyle = user.color;
      ctx.fillText(user.name, x + 15, y - 5);
    });
  };
  
  // Helper function to draw math results
  const drawMathResults = (ctx: CanvasRenderingContext2D, shapesToRender: Shape[]) => {
    // Ensure mathResults is an array before iteration
    const mathResultsToRender = Array.isArray(mathResults) ? mathResults : [];
    
    if (!Array.isArray(mathResults)) {
      console.error('mathResults is not an array', mathResults);
    }

    mathResultsToRender.forEach((result) => {
      const mathShape = shapesToRender.find(s => s.id === result.shapeId);
      if (!mathShape || mathShape.type !== 'math') return;
      
      const { position } = mathShape;
      
      // Draw result box
      ctx.fillStyle = 'rgba(240, 249, 255, 0.9)';
      ctx.fillRect(position.x, position.y + 30, result.result.length * 10 + 20, 30);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(position.x, position.y + 30, result.result.length * 10 + 20, 30);
      
      // Draw result text
      ctx.font = '16px Arial';
      ctx.fillStyle = '#2563eb';
      ctx.fillText(result.result, position.x + 10, position.y + 50);
    });
  };

  // Helper function to draw a shape
  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape, isSelected: boolean) => {
    // Set style
    ctx.strokeStyle = shape.style.color;
    ctx.lineWidth = shape.style.width;
    ctx.globalAlpha = shape.style.opacity;
    
    // Add selection styling
    if (isSelected) {
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    
    switch (shape.type) {
      case 'freedraw':
        drawFreedraw(ctx, shape.points);
        break;
      case 'line':
        drawLine(ctx, shape.points[0], shape.points[1]);
        break;
      case 'rectangle':
        drawRectangle(ctx, shape.topLeft, shape.width, shape.height);
        break;
      case 'ellipse':
        drawEllipse(ctx, shape.center, shape.radiusX, shape.radiusY);
        break;
      case 'arrow':
        drawArrow(ctx, shape.startPoint, shape.endPoint);
        break;
      case 'text':
        drawText(ctx, shape.content, shape.position, shape.fontSize, shape.fontFamily);
        break;
      case 'math':
        drawMath(ctx, shape.content, shape.position);
        break;
    }
    
    // Reset opacity
    ctx.globalAlpha = 1;
  };
  
  // Draw a freehand line
  const drawFreedraw = (ctx: CanvasRenderingContext2D, points: Point[]) => {
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
  };
  
  // Draw a straight line
  const drawLine = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };
  
  // Draw a rectangle
  const drawRectangle = (ctx: CanvasRenderingContext2D, topLeft: Point, width: number, height: number) => {
    ctx.beginPath();
    ctx.rect(topLeft.x, topLeft.y, width, height);
    ctx.stroke();
  };
  
  // Draw an ellipse
  const drawEllipse = (ctx: CanvasRenderingContext2D, center: Point, radiusX: number, radiusY: number) => {
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, Math.abs(radiusX), Math.abs(radiusY), 0, 0, 2 * Math.PI);
    ctx.stroke();
  };
  
  // Draw an arrow
  const drawArrow = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    const headLength = 15;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };
  
  // Draw text
  const drawText = (ctx: CanvasRenderingContext2D, content: string, position: Point, fontSize: number, fontFamily: string) => {
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(content, position.x, position.y);
  };
  
  // Draw math
  const drawMath = (ctx: CanvasRenderingContext2D, content: string, position: Point) => {
    ctx.font = '18px Arial';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(content, position.x, position.y);
  };

  return (
    <div className="relative">
      <Canvas
        width={width}
        height={height}
        ref={refToUse} // Pass the determined ref to the Canvas component
      />
    </div>
  );
};

export default Renderer;