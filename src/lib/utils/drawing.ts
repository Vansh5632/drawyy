import { Point, Shape, StrokeStyle } from '@/types/types';

/**
 * Smooth a series of points using Gaussian smoothing
 */
export function smoothPoints(points: Point[], sigma: number = 2): Point[] {
  if (points.length <= 2) return points;
  
  const smoothed: Point[] = [];
  const windowSize = Math.max(5, Math.ceil(sigma * 3) * 2 + 1);
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < points.length; i++) {
    let sumX = 0;
    let sumY = 0;
    let sumWeight = 0;
    
    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = Math.min(Math.max(0, i + j), points.length - 1);
      const weight = Math.exp(-(j * j) / (2 * sigma * sigma));
      
      sumX += points[idx].x * weight;
      sumY += points[idx].y * weight;
      sumWeight += weight;
    }
    
    smoothed.push({
      x: sumX / sumWeight,
      y: sumY / sumWeight
    });
  }
  
  return smoothed;
}

/**
 * Normalize points to a standard scale (0-1 range)
 */
export function normalizePoints(points: Point[]): Point[] {
  if (points.length === 0) return [];
  
  // Find bounds
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  const width = maxX - minX || 1; // Avoid division by zero
  const height = maxY - minY || 1;
  
  // Normalize points to 0-1 range
  return points.map(point => ({
    x: (point.x - minX) / width,
    y: (point.y - minY) / height
  }));
}

/**
 * Create a perfect rectangle shape from imperfect points
 */
export function createPerfectRectangle(corners: Point[], style: StrokeStyle, createdBy: string): Shape {
  // Find the bounding box
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const point of corners) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  // Create rectangle shape
  return {
    id: generateId(),
    type: 'rectangle',
    points: [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ],
    topLeft: { x: minX, y: minY },
    width: maxX - minX,
    height: maxY - minY,
    style,
    createdAt: Date.now(),
    createdBy
  };
}

/**
 * Create a perfect circle shape from imperfect points
 */
export function createPerfectCircle(center: Point, radius: number, style: StrokeStyle, createdBy: string): Shape {
  // Generate points around the circle
  const numPoints = 36; // Number of points to generate
  const points: Point[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  }
  
  // Create circle shape
  return {
    id: generateId(),
    type: 'ellipse',
    points,
    center,
    radiusX: radius,
    radiusY: radius,
    style,
    createdAt: Date.now(),
    createdBy
  };
}

/**
 * Create a perfect line shape from imperfect points
 */
export function createPerfectLine(start: Point, end: Point, style: StrokeStyle, createdBy: string): Shape {
  return {
    id: generateId(),
    type: 'line',
    points: [start, end],
    startPoint: start,
    endPoint: end,
    style,
    createdAt: Date.now(),
    createdBy
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}