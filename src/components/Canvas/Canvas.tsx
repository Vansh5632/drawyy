import React, { useEffect, useState, forwardRef } from 'react';
import { useStore } from '@/store';
import { Point } from '@/types/types';
import useDraw from '@/hooks/useDraw';
import useCollaboration from '@/hooks/useCollaboration';

interface CanvasProps {
  width: number;
  height: number;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(({ width, height }, forwardedRef) => {
  const [internalCanvasNode, setInternalCanvasNode] = useState<HTMLCanvasElement | null>(null); // Added useState for internal node reference

  const tool = useStore(state => state.tool);
  const viewport = useStore(state => state.viewport);
  const [pointerPosition, setPointerPosition] = useState<Point | null>(null);

  const { handleMouseDown, handleMouseMove, handleMouseUp, isDrawing } = useDraw();
  const { updateCursor } = useCollaboration();

  // Transform mouse coordinates based on viewport
  const transformCoordinates = (clientX: number, clientY: number): Point => {
    if (!internalCanvasNode) return { x: 0, y: 0 }; // Use internalCanvasNode

    const rect = internalCanvasNode.getBoundingClientRect(); // Use internalCanvasNode
    const x = (clientX - rect.left - viewport.translateX) / viewport.scale;
    const y = (clientY - rect.top - viewport.translateY) / viewport.scale;

    return { x, y };
  };

  // Event handlers
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'pan') return;

    const point = transformCoordinates(e.clientX, e.clientY);
    setPointerPosition(point);
    handleMouseDown(point);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const point = transformCoordinates(e.clientX, e.clientY);
    setPointerPosition(point);

    updateCursor(point);

    if (isDrawing) {
      handleMouseMove(point);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const point = transformCoordinates(e.clientX, e.clientY);
    handleMouseUp(point);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Handle pan tool
  useEffect(() => {
    if (!internalCanvasNode || tool !== 'pan') return; // Use internalCanvasNode

    let isDragging = false;
    let lastPosition = { x: 0, y: 0 };
    const setViewport = useStore.getState().setViewport;

    const canvasElement = internalCanvasNode; // Use internalCanvasNode

    const handlePanStart = (e: PointerEvent) => {
      isDragging = true;
      lastPosition = { x: e.clientX, y: e.clientY };
      canvasElement?.setPointerCapture(e.pointerId);
    };

    const handlePanMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastPosition.x;
      const deltaY = e.clientY - lastPosition.y;

      setViewport({
        translateX: viewport.translateX + deltaX,
        translateY: viewport.translateY + deltaY
      });

      lastPosition = { x: e.clientX, y: e.clientY };
    };

    const handlePanEnd = () => {
      isDragging = false;
    };

    canvasElement.addEventListener('pointerdown', handlePanStart);
    canvasElement.addEventListener('pointermove', handlePanMove);
    canvasElement.addEventListener('pointerup', handlePanEnd);
    canvasElement.addEventListener('pointerleave', handlePanEnd);

    return () => {
      canvasElement.removeEventListener('pointerdown', handlePanStart);
      canvasElement.removeEventListener('pointermove', handlePanMove);
      canvasElement.removeEventListener('pointerup', handlePanEnd);
      canvasElement.removeEventListener('pointerleave', handlePanEnd);
    };
  }, [tool, viewport, internalCanvasNode]); // Updated dependency to internalCanvasNode

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        const { undo } = require('@/hooks/useUndoRedo').default();
        undo();
      } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        const { redo } = require('@/hooks/useUndoRedo').default();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <canvas
      ref={(instance) => {
        // Assign to internal state
        setInternalCanvasNode(instance); // Use setInternalCanvasNode

        // Assign to forwarded ref
        if (typeof forwardedRef === 'function') {
          forwardedRef(instance);
        } else if (forwardedRef) {
          forwardedRef.current = instance;
        }
      }}
      width={width}
      height={height}
      onPointerDown={tool !== 'pan' ? onPointerDown : undefined}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="cursor-crosshair touch-none"
      style={{
        backgroundColor: '#f9f9f9',
      }}
    />
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;