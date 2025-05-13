import { Shape, Operation, VectorClock } from '@/types/types';

// Create a diff between two shapes arrays
export function createDiff(oldShapes: Shape[], newShapes: Shape[]): Operation[] {
  const operations: Operation[] = [];
  
  // Map old shapes by id for quick lookup
  const oldShapesMap = new Map(oldShapes.map(shape => [shape.id, shape]));
  const newShapesMap = new Map(newShapes.map(shape => [shape.id, shape]));
  
  // Find created shapes
  for (const shape of newShapes) {
    if (!oldShapesMap.has(shape.id)) {
      operations.push({
        id: generateId(),
        type: 'create',
        data: shape,
        timestamp: Date.now(),
        userId: shape.createdBy,
        vectorClock: {} // Will be filled by socket client
      });
    }
  }
  
  // Find updated shapes
  for (const shape of newShapes) {
    const oldShape = oldShapesMap.get(shape.id);
    if (oldShape && !shapeEquals(oldShape, shape)) {
      operations.push({
        id: generateId(),
        type: 'update',
        data: shape,
        timestamp: Date.now(),
        userId: shape.createdBy,
        vectorClock: {} // Will be filled by socket client
      });
    }
  }
  
  // Find deleted shapes
  for (const oldShape of oldShapes) {
    if (!newShapesMap.has(oldShape.id)) {
      operations.push({
        id: generateId(),
        type: 'delete',
        data: { id: oldShape.id },
        timestamp: Date.now(),
        userId: oldShape.createdBy,
        vectorClock: {} // Will be filled by socket client
      });
    }
  }
  
  return operations;
}

// Apply operations to shapes array
export function applyOperations(shapes: Shape[], operations: Operation[]): Shape[] {
  let result = [...shapes];
  
  // Sort operations by timestamp then by vector clock
  const sortedOps = sortOperationsByVectorClock(operations);
  
  for (const operation of sortedOps) {
    switch (operation.type) {
      case 'create':
        result = [...result, operation.data as Shape];
        break;
        
      case 'update':
        const updatedShape = operation.data as Shape;
        result = result.map(shape => 
          shape.id === updatedShape.id ? updatedShape : shape
        );
        break;
        
      case 'delete':
        const { id } = operation.data;
        result = result.filter(shape => shape.id !== id);
        break;
        
      case 'batch':
        const batchOps = operation.data as Operation[];
        result = applyOperations(result, batchOps);
        break;
    }
  }
  
  return result;
}

// Sort operations based on vector clocks (partial ordering)
function sortOperationsByVectorClock(operations: Operation[]): Operation[] {
  return operations.sort((a, b) => {
    // First sort by timestamp as a fallback
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    
    // Check for happens-before relationship using vector clocks
    const aBeforeB = vectorClockLessThan(a.vectorClock, b.vectorClock);
    const bBeforeA = vectorClockLessThan(b.vectorClock, a.vectorClock);
    
    if (aBeforeB && !bBeforeA) return -1;
    if (!aBeforeB && bBeforeA) return 1;
    
    // If concurrent, use a deterministic approach (e.g., compare IDs)
    return a.id.localeCompare(b.id);
  });
}

// Check if vector clock v1 happens before vector clock v2
function vectorClockLessThan(v1: VectorClock, v2: VectorClock): boolean {
  // Check if at least one component is less
  let lessThanExists = false;
  
  // Get all userIds from both clocks
  const allUsers = new Set([
    ...Object.keys(v1),
    ...Object.keys(v2)
  ]);
  
  for (const userId of allUsers) {
    const time1 = v1[userId] || 0;
    const time2 = v2[userId] || 0;
    
    // If any component is greater, then v1 is not less than v2
    if (time1 > time2) {
      return false;
    }
    
    // Check if at least one component is less
    if (time1 < time2) {
      lessThanExists = true;
    }
  }
  
  return lessThanExists;
}

// Compare shapes for equality
function shapeEquals(shape1: Shape, shape2: Shape): boolean {
  // Simple deep equality check
  return JSON.stringify(shape1) === JSON.stringify(shape2);
}

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}