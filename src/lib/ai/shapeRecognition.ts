import { Point, Shape, StrokeStyle, RecognizedShapeResult } from '@/types/types';
import {
  isLine,
  isRectangle,
  isCircle,
  isTriangle,
  ransacLineDetection,
  ramerDouglasPeucker
} from '../utils/geometry';
import {
  smoothPoints,
  createPerfectRectangle,
  createPerfectCircle,
  createPerfectLine
} from '../utils/drawing';

// Minimum confidence threshold for shape recognition
const CONFIDENCE_THRESHOLD = 0.65;

/**
 * Analyze points to recognize a shape
 */
export function recognizeShape(
  points: Point[],
  style: StrokeStyle,
  createdBy: string
): RecognizedShapeResult | null {
  if (!Array.isArray(points) || points.length < 3) return null;
  
  // Step 1: Preprocess the points
  const smoothedPoints = smoothPoints(points);
  const simplifiedPoints = ramerDouglasPeucker(smoothedPoints, 2);
  
  // Step 2: Check for various shapes
  
  // Check for a line
  if (isLine(simplifiedPoints, 0.1)) {
    // Use RANSAC for better line estimation
    const { line, confidence } = ransacLineDetection(smoothedPoints);
    
    if (confidence > CONFIDENCE_THRESHOLD) {
      const perfectLine = createPerfectLine(line[0], line[1], style, createdBy);
      
      return {
        originalShape: {
          id: perfectLine.id,
          type: 'freedraw',
          points: [...points],
          style,
          createdAt: Date.now(),
          createdBy
        },
        recognizedShape: perfectLine,
        confidence
      };
    }
  }
  
  // Check for a rectangle
  const rectangleResult = isRectangle(simplifiedPoints);
  if (rectangleResult.isRect && rectangleResult.confidence > CONFIDENCE_THRESHOLD && rectangleResult.corners) {
    const perfectRectangle = createPerfectRectangle(rectangleResult.corners, style, createdBy);
    
    return {
      originalShape: {
        id: perfectRectangle.id,
        type: 'freedraw',
        points: [...points],
        style,
        createdAt: Date.now(),
        createdBy
      },
      recognizedShape: perfectRectangle,
      confidence: rectangleResult.confidence
    };
  }
  
  // Check for a circle
  const circleResult = isCircle(simplifiedPoints);
  if (circleResult.isCircle && circleResult.confidence > CONFIDENCE_THRESHOLD && 
      circleResult.center && circleResult.radius) {
    
    const perfectCircle = createPerfectCircle(
      circleResult.center,
      circleResult.radius,
      style,
      createdBy
    );
    
    return {
      originalShape: {
        id: perfectCircle.id,
        type: 'freedraw',
        points: [...points],
        style,
        createdAt: Date.now(),
        createdBy
      },
      recognizedShape: perfectCircle,
      confidence: circleResult.confidence
    };
  }
  
  // Check for a triangle
  const triangleResult = isTriangle(simplifiedPoints);
  if (triangleResult.isTriangle && triangleResult.confidence > CONFIDENCE_THRESHOLD && 
      triangleResult.corners) {
    
    // Create perfect triangle (simplified as a freedraw for now)
    const perfectTriangle = {
      id: Math.random().toString(36).substring(2, 15),
      type: 'freedraw',
      points: triangleResult.corners,
      style,
      createdAt: Date.now(),
      createdBy
    } as Shape;
    
    return {
      originalShape: {
        id: perfectTriangle.id,
        type: 'freedraw',
        points: [...points],
        style,
        createdAt: Date.now(),
        createdBy
      },
      recognizedShape: perfectTriangle,
      confidence: triangleResult.confidence
    };
  }
  
  // No shape recognized with sufficient confidence
  return null;
}

/**
 * Process a batch of shapes for recognition
 */
export function batchRecognizeShapes(
  prevShapes: Shape[] | any, 
  onlyFreedraws: boolean = true
): RecognizedShapeResult[] {
  const results: RecognizedShapeResult[] = [];
  
  // Ensure shapes is an array before iteration
  const shapes = Array.isArray(prevShapes) ? prevShapes : [];
  if (!Array.isArray(prevShapes)) {
    console.error('batchRecognizeShapes received non-array shapes', prevShapes);
    return results;
  }
  
  for (const shape of shapes) {
    // Skip if shape is invalid or not properly formed
    if (!shape || !shape.points || !Array.isArray(shape.points)) {
      console.warn('Invalid shape found in batchRecognizeShapes', shape);
      continue;
    }
    
    // Only process freedraw shapes if flag is set
    if (onlyFreedraws && shape.type !== 'freedraw') continue;
    
    try {
      const result = recognizeShape(shape.points, shape.style, shape.createdBy);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error('Error recognizing shape:', error, shape);
    }
  }
  
  return results;
}

export function isMathExpression(points: Point[], tolerance: number = 0.3): {
  isMath: boolean;
  confidence: number;
} {
  // Ensure points is an array
  if (!Array.isArray(points)) {
    console.error('isMathExpression received non-array points', points);
    return { isMath: false, confidence: 0 };
  }
  
  // This would use heuristics to determine if the drawing looks like math
  // For example, checking for patterns like horizontal lines (equals signs),
  // vertical alignment, and symbol spacing that's common in equations
  
  // This is a placeholder implementation
  const horizontalLines = detectHorizontalLines(points);
  const hasSymbols = hasSymbolLikeStructures(points);
  
  const isMath = horizontalLines > 0 && hasSymbols;
  const confidence = isMath ? 0.7 : 0.1;
  
  return { isMath, confidence };
}

function detectHorizontalLines(points: Point[]): number {
  // Implementation to detect horizontal lines that could be equals signs
  return 1; // Placeholder
}

function hasSymbolLikeStructures(points: Point[]): boolean {
  // Implementation to detect patterns that resemble mathematical symbols
  return true; // Placeholder
}