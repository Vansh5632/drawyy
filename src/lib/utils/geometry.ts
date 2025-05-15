import { Point } from '@/types/types';

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle between three points (in radians)
 */
export function angle(p1: Point, p2: Point, p3: Point): number {
  const a = distance(p2, p3);
  const b = distance(p1, p3);
  const c = distance(p1, p2);
  
  // Law of cosines
  return Math.acos((a * a + c * c - b * b) / (2 * a * c));
}

/**
 * Check if points form a straight line within tolerance
 */
export function isLine(points: Point[], tolerance: number = 0.15): boolean {
  if (points.length < 3) return true;
  
  // Get the first and last point to define a line
  const start = points[0];
  const end = points[points.length - 1];
  
  // Calculate the maximum distance from any point to the line
  let maxDistance = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const dist = pointToLineDistance(points[i], start, end);
    maxDistance = Math.max(maxDistance, dist);
  }
  
  // Calculate the line length
  const lineLength = distance(start, end);
  
  // Return true if the maximum distance is within tolerance relative to line length
  return maxDistance / lineLength < tolerance;
}

/**
 * Calculate distance from point to line defined by two points
 */
export function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const numerator = Math.abs(
    (lineEnd.y - lineStart.y) * point.x -
    (lineEnd.x - lineStart.x) * point.y +
    lineEnd.x * lineStart.y -
    lineEnd.y * lineStart.x
  );
  
  const denominator = Math.sqrt(
    Math.pow(lineEnd.y - lineStart.y, 2) +
    Math.pow(lineEnd.x - lineStart.x, 2)
  );
  
  return numerator / denominator;
}

/**
 * Check if points form a rectangle within tolerance
 */
export function isRectangle(points: Point[], tolerance: number = 0.2): {
  isRect: boolean;
  confidence: number;
  corners?: Point[];
} {
  if (points.length < 4) {
    return { isRect: false, confidence: 0 };
  }
  
  // Simplify to fewer points (potential corners)
  const simplified = ramerDouglasPeucker(points, 5);
  
  if (simplified.length < 4 || simplified.length > 6) {
    return { isRect: false, confidence: 0 };
  }
  
  // Identify potential corners
  let corners: Point[] = [];
  if (simplified.length === 4) {
    corners = simplified;
  } else {
    // Use the 4 points that form the best rectangle
    // This is a simplified approach - just take first, last and two middle points
    corners = [
      simplified[0],
      simplified[Math.floor(simplified.length / 3)],
      simplified[Math.floor(2 * simplified.length / 3)],
      simplified[simplified.length - 1]
    ];
  }
  
  // Check for roughly 90-degree angles
  let angleSum = 0;
  let confidence = 1.0;
  
  for (let i = 0; i < 4; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % 4];
    const p3 = corners[(i + 2) % 4];
    
    const ang = angle(p1, p2, p3);
    angleSum += ang;
    
    // Check how close to 90 degrees (π/2)
    const angleDiff = Math.abs(ang - Math.PI / 2);
    confidence *= (1 - angleDiff / (Math.PI / 2));
  }
  
  // Check if angles sum to approximately 2π (360 degrees)
  const isRect = Math.abs(angleSum - 2 * Math.PI) < tolerance * Math.PI;
  
  return {
    isRect,
    confidence: isRect ? confidence : 0,
    corners: isRect ? corners : undefined
  };
}

/**
 * Check if points form a circle using least squares fitting
 */
export function isCircle(points: Point[], tolerance: number = 0.2): {
  isCircle: boolean;
  confidence: number;
  center?: Point;
  radius?: number;
} {
  if (points.length < 5) {
    return { isCircle: false, confidence: 0 };
  }
  
  // Calculate centroid
  let sumX = 0, sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  
  const center: Point = {
    x: sumX / points.length,
    y: sumY / points.length
  };
  
  // Calculate average distance from centroid (radius)
  let sumRadius = 0;
  for (const point of points) {
    sumRadius += distance(center, point);
  }
  const radius = sumRadius / points.length;
  
  // Calculate standard deviation of distances from average radius
  let sumVariance = 0;
  for (const point of points) {
    const dist = distance(center, point);
    sumVariance += Math.pow(dist - radius, 2);
  }
  const stdDev = Math.sqrt(sumVariance / points.length);
  
  // Calculate relative standard deviation
  const relativeStdDev = stdDev / radius;
  
  // Check if variance is within tolerance
  const isCircle = relativeStdDev < tolerance;
  
  // Calculate confidence (1.0 = perfect circle, 0.0 = not a circle)
  const confidence = Math.max(0, 1 - relativeStdDev / tolerance);
  
  return {
    isCircle,
    confidence: isCircle ? confidence : 0,
    center: isCircle ? center : undefined,
    radius: isCircle ? radius : undefined
  };
}

/**
 * Ramer-Douglas-Peucker algorithm for point simplification
 */
export function ramerDouglasPeucker(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;
  
  // Find the point with the maximum distance
  let maxDistance = 0;
  let index = 0;
  
  const start = points[0];
  const end = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = pointToLineDistance(points[i], start, end);
    
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    // Recursive call
    const firstPart = ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
    const secondPart = ramerDouglasPeucker(points.slice(index), epsilon);
    
    // Concat the two parts (removing duplicated point)
    return [...firstPart.slice(0, -1), ...secondPart];
  } else {
    // Return just the end points
    return [start, end];
  }
}

/**
 * Check if points form a triangle
 */
export function isTriangle(points: Point[], tolerance: number = 0.2): {
  isTriangle: boolean;
  confidence: number;
  corners?: Point[];
} {
  // Simplify points to get potential corners
  const simplified = ramerDouglasPeucker(points, 5);
  
  if (simplified.length < 3 || simplified.length > 5) {
    return { isTriangle: false, confidence: 0 };
  }
  
  // For a triangle, select 3 points that are most distant from each other
  let corners: Point[] = [];
  
  if (simplified.length === 3) {
    corners = simplified;
  } else {
    // Use first, middle, and last as a simple approach
    corners = [
      simplified[0],
      simplified[Math.floor(simplified.length / 2)],
      simplified[simplified.length - 1]
    ];
  }
  
  // Sum of angles in a triangle should be π (180 degrees)
  let angleSum = 0;
  
  for (let i = 0; i < 3; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % 3];
    const p3 = corners[(i + 2) % 3];
    
    angleSum += angle(p1, p2, p3);
  }
  
  // Check if angles sum to approximately π (180 degrees)
  const isTriangle = Math.abs(angleSum - Math.PI) < tolerance * Math.PI;
  
  // Calculate confidence based on how close the sum is to π
  const confidence = isTriangle ? 
    (1 - Math.abs(angleSum - Math.PI) / (tolerance * Math.PI)) : 0;
  
  return {
    isTriangle,
    confidence,
    corners: isTriangle ? corners : undefined
  };
}

/**
 * RANSAC algorithm for line detection
 */
export function ransacLineDetection(points: Point[], iterations: number = 100, threshold: number = 5): {
  inliers: Point[];
  line: [Point, Point];
  confidence: number;
} {
  if (points.length < 2) {
    return {
      inliers: [],
      line: [points[0] || {x: 0, y: 0}, points[0] || {x: 0, y: 0}],
      confidence: 0
    };
  }
  
  let bestInliers: Point[] = [];
  let bestLine: [Point, Point] = [points[0], points[0]];
  
  for (let i = 0; i < iterations; i++) {
    // Randomly select two points to form a line
    const idx1 = Math.floor(Math.random() * points.length);
    let idx2 = Math.floor(Math.random() * points.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * points.length);
    }
    
    const p1 = points[idx1];
    const p2 = points[idx2];
    
    // Count inliers (points close to the line)
    const inliers: Point[] = [];
    for (const point of points) {
      if (pointToLineDistance(point, p1, p2) < threshold) {
        inliers.push(point);
      }
    }
    
    // Update if we found more inliers
    if (inliers.length > bestInliers.length) {
      bestInliers = inliers;
      bestLine = [p1, p2];
    }
    
    // Early termination if we found most points
    if (bestInliers.length > points.length * 0.9) {
      break;
    }
  }
  
  return {
    inliers: bestInliers,
    line: bestLine,
    confidence: bestInliers.length / points.length
  };
}