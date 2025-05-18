import { useState, useRef, useCallback, useEffect } from "react";
import { useStore } from "@/store";
import { recognizeShape } from "@/lib/ai/shapeRecognition";
import { Point, Shape, Tool, StrokeStyle } from "@/types/types";
import useCollaboration from "./useCollaboration";
import useUndoRedo from "./useUndoRedo";

export default function useDraw() {
  const shapes = useStore((state) => state.shapes);
  const setShapes = useStore((state) => state.setShapes);
  const tool = useStore((state) => state.tool);
  const strokeStyle = useStore((state) => state.strokeStyle);
  const currentUser = useStore((state) => state.currentUser);
  const { processDrawOperation } = useCollaboration();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const currentShapeId = useRef<string>("");

  // Debug current tool and stroke style
  useEffect(() => {
    console.log("useDraw - Current tool:", tool);
    console.log("useDraw - Current stroke style:", strokeStyle);
  }, [tool, strokeStyle]);

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
      if (!currentUser) {
        console.warn("No current user, cannot draw");
        return;
      }

      console.log("Starting to draw with tool:", tool);

      setIsDrawing(true);
      setCurrentPath([point]);
      currentShapeId.current = generateId();

      // Create initial shape
      let newShape: Shape;
      const baseShape = {
        id: currentShapeId.current,
        points: [point],
        style: { ...strokeStyle }, // Clone to avoid reference issues
        createdAt: Date.now(),
        createdBy: currentUser?.id || "unknown",
      };

      switch (tool) {
        case "freedraw":
          newShape = {
            ...baseShape,
            type: "freedraw",
          };
          break;
        case "line":
          newShape = {
            ...baseShape,
            type: "line",
            startPoint: point,
            endPoint: point,
          };
          break;
        case "rectangle":
          newShape = {
            ...baseShape,
            type: "rectangle",
            topLeft: point,
            width: 0,
            height: 0,
          };
          break;
        case "ellipse":
          newShape = {
            ...baseShape,
            type: "ellipse",
            center: point,
            radiusX: 0,
            radiusY: 0,
          };
          break;
        case "arrow":
          newShape = {
            ...baseShape,
            type: "arrow",
            startPoint: point,
            endPoint: point,
          };
          break;
        default:
          return; // For non-drawing tools like select, pan, etc.
      }

      // Send operation to collaborators
      processDrawOperation({
        type: "mousedown",
        point,
        shapeId: currentShapeId.current,
        style: strokeStyle,
        tool: tool,
      });

      setShapes([...shapes, newShape]);
    },
    [shapes, setShapes, tool, strokeStyle, currentUser, generateId, processDrawOperation]
  );

  // Handle mouse move event
  const handleMouseMove = useCallback(
    (point: Point) => {
      if (!isDrawing) return;

      setCurrentPath((prev) => [...prev, point]);

      // Update shape based on tool
      setShapes((prevShapes) => {
        const shapeIndex = prevShapes.findIndex(
          (s) => s.id === currentShapeId.current
        );
        if (shapeIndex === -1) return prevShapes;

        const shape = prevShapes[shapeIndex];
        let updatedShape: Shape;

        switch (tool) {
          case "freedraw":
            updatedShape = {
              ...shape,
              points: [...shape.points, point],
            };
            break;
          case "line":
            updatedShape = {
              ...shape,
              endPoint: point,
              points: [shape.points[0], point],
            };
            break;
          case "rectangle": {
            const startPoint = shape.points[0];
            updatedShape = {
              ...shape,
              width: point.x - startPoint.x,
              height: point.y - startPoint.y,
              points: [
                startPoint,
                { x: point.x, y: startPoint.y },
                point,
                { x: startPoint.x, y: point.y },
              ],
            };
            break;
          }
          case "ellipse": {
            const centerPoint = shape.points[0];
            updatedShape = {
              ...shape,
              radiusX: Math.abs(point.x - centerPoint.x),
              radiusY: Math.abs(point.y - centerPoint.y),
              points: [centerPoint, point],
            };
            break;
          }
          case "arrow":
            updatedShape = {
              ...shape,
              endPoint: point,
              points: [shape.points[0], point],
            };
            break;
          default:
            return prevShapes;
        }

        // Send operation to collaborators
        processDrawOperation({
          type: "mousemove",
          point,
          shapeId: currentShapeId.current,
        });

        const newShapes = [...prevShapes];
        newShapes[shapeIndex] = updatedShape;
        return newShapes;
      });
    },
    [isDrawing, setShapes, tool, processDrawOperation, strokeStyle]
  );

  // Handle mouse up event
  const handleMouseUp = useCallback(
    (point: Point) => {
      if (!isDrawing) return;

      setIsDrawing(false);

      // Finalize shape
      setShapes((prevShapes) => {
        const shapeIndex = prevShapes.findIndex(
          (s) => s.id === currentShapeId.current
        );
        if (shapeIndex === -1) return prevShapes;

        const shape = prevShapes[shapeIndex];
        let finalShape = shape;

        // For freedraw, try to recognize shape if it's a simple geometry
        if (
          tool === "freedraw" &&
          shape.points.length > 2 &&
          shape.points.length < 50
        ) {
          const recognizedShape = recognizeShape(shape);
          if (recognizedShape && recognizedShape.confidence > 0.85) {
            finalShape = {
              ...recognizedShape.recognizedShape,
              id: shape.id,
              createdAt: shape.createdAt,
              createdBy: shape.createdBy,
              style: shape.style,
            };
          }
        }

        // Create new array with updated shape
        const newShapes = [...prevShapes];
        newShapes[shapeIndex] = finalShape;

        // Send operation to collaborators
        processDrawOperation({
          type: "mouseup",
          point,
          shapeId: currentShapeId.current,
        });

        // Save to history after a small delay to ensure state is settled
        setTimeout(() => {
          const { saveToHistory } = useUndoRedo();
          saveToHistory(newShapes);
        }, 0);

        return newShapes;
      });

      // Clear current path
      setCurrentPath([]);
      currentShapeId.current = "";
    },
    [isDrawing, setShapes, tool, processDrawOperation, useUndoRedo, strokeStyle]
  );

  return {
    isDrawing,
    currentPath,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
