import { useState, useRef, useCallback } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { shapesState } from "@/state/atoms/shapes";
import { toolState, strokeStyleState } from "@/state/atoms/tool";
import { historyState } from "@/state/atoms/history";
import { currentUserState } from "@/state/atoms/session";
import { recognizeShape } from "@/lib/ai/shapeRecognition";
import { Point, Shape, Tool, StrokeStyle } from "@/types/types";
import useCollaboration from "./useCollaboration";

export default function useDraw() {
  const [shapes, setShapes] = useRecoilState(shapesState);
  const tool = useRecoilValue(toolState);
  const strokeStyle = useRecoilValue(strokeStyleState);
  const currentUser = useRecoilValue(currentUserState);
  const setHistory = useSetRecoilState(historyState);
  const { processDrawOperation } = useCollaboration();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const currentShapeId = useRef<string>("");

  // Generate a unique ID
  const generateId = useCallback(() => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }, []);

  // Handle mouse down event
  const handleMouseDown = useCallback(
    (point: Point) => {
      if (!currentUser) return;

      setIsDrawing(true);
      setCurrentPath([point]);
      currentShapeId.current = generateId();

      // Create initial shape
      let newShape: Shape;

      // Add additional properties based on shape type
      if (tool === "line" || tool === "arrow") {
        newShape = {
          id: currentShapeId.current,
          type: tool as "line" | "arrow",
          points: [point],
          startPoint: point,
          endPoint: point,
          style: strokeStyle,
          createdAt: Date.now(),
          createdBy: currentUser.id,
        };
      } else if (tool === "rectangle") {
        newShape = {
          id: currentShapeId.current,
          type: "rectangle",
          points: [point],
          topLeft: point,
          width: 0,
          height: 0,
          style: strokeStyle,
          createdAt: Date.now(),
          createdBy: currentUser.id,
        };
      } else if (tool === "ellipse") {
        newShape = {
          id: currentShapeId.current,
          type: "ellipse",
          points: [point],
          center: point,
          radiusX: 0,
          radiusY: 0,
          style: strokeStyle,
          createdAt: Date.now(),
          createdBy: currentUser.id,
        };
      } else if (tool === "text") {
        newShape = {
          id: currentShapeId.current,
          type: "text",
          points: [point],
          content: "",
          position: point,
          fontSize: 16,
          fontFamily: "Arial",
          style: strokeStyle,
          createdAt: Date.now(),
          createdBy: currentUser.id,
        };
      } else if (tool === "math") {
        newShape = {
          id: currentShapeId.current,
          type: "math",
          points: [point],
          content: "",
          position: point,
          style: strokeStyle,
          createdAt: Date.now(),
          createdBy: currentUser.id,
        };
      } else {
        // For freedraw or any other tool
        newShape = {
          id: currentShapeId.current,
          type: "freedraw",
          points: [point],
          style: strokeStyle,
          createdAt: Date.now(),
          createdBy: currentUser.id,
        };
      }

      setShapes((prev) => [...prev, newShape]);

      // Send collaborative drawing operation
      processDrawOperation({
        type: "mousedown",
        point,
        shapeId: currentShapeId.current,
        style: strokeStyle,
        tool,
      });
    },
    [
      currentUser,
      tool,
      strokeStyle,
      setShapes,
      generateId,
      processDrawOperation,
    ]
  );

  // Handle mouse move event
  const handleMouseMove = useCallback(
    (point: Point) => {
      if (!isDrawing || !currentUser) return;

      setCurrentPath((prev) => [...prev, point]);

      // Update the current shape
      setShapes((prev) => {
        return prev.map((shape) => {
          if (shape.id === currentShapeId.current) {
            const updatedShape = {
              ...shape,
              points: [...shape.points, point],
            };

            // Update type-specific properties
            if (shape.type === "line" || shape.type === "arrow") {
              (updatedShape as any).endPoint = point;
            } else if (shape.type === "rectangle") {
              const startPoint = shape.points[0];
              (updatedShape as any).width = point.x - startPoint.x;
              (updatedShape as any).height = point.y - startPoint.y;
            } else if (shape.type === "ellipse") {
              const startPoint = shape.points[0];
              (updatedShape as any).radiusX = Math.abs(point.x - startPoint.x);
              (updatedShape as any).radiusY = Math.abs(point.y - startPoint.y);
            }

            return updatedShape;
          }
          return shape;
        });
      });

      // Send collaborative drawing operation
      processDrawOperation({
        type: "mousemove",
        point,
        shapeId: currentShapeId.current,
      });
    },
    [isDrawing, currentUser, setShapes, processDrawOperation]
  );

  // Handle mouse up event
  const handleMouseUp = useCallback(
    (point: Point) => {
      if (!isDrawing || !currentUser) return;

      setIsDrawing(false);

      // Finalize the shape
      setShapes((prev) => {
        const shapeToUpdate = prev.find((s) => s.id === currentShapeId.current);

        if (!shapeToUpdate) return prev;

        // Only attempt shape recognition for freedraw
        if (shapeToUpdate.type === "freedraw" && currentPath.length > 5) {
          const recognized = recognizeShape(
            currentPath,
            shapeToUpdate.style,
            currentUser.id
          );

          if (recognized && recognized.confidence > 0.7) {
            // Replace with recognized shape
            return prev.map((s) =>
              s.id === currentShapeId.current ? recognized.recognizedShape : s
            );
          }
        }

        return prev;
      });

      // Add to history
      setHistory((prev) => [
        ...prev,
        {
          shapes: [...shapes],
          timestamp: Date.now(),
        },
      ]);

      // Clear current path
      setCurrentPath([]);

      // Send collaborative drawing operation
      processDrawOperation({
        type: "mouseup",
        point,
        shapeId: currentShapeId.current,
      });
    },
    [
      isDrawing,
      currentUser,
      shapes,
      currentPath,
      setShapes,
      setHistory,
      processDrawOperation,
    ]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDrawing,
    currentPath,
  };
}
