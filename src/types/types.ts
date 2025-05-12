export type Point = {
    x: number;
    y: number;
  };
  
  export type Color = string;
  
  export type StrokeStyle = {
    color: Color;
    width: number;
    opacity: number;
  };
  
  export type ShapeType = 'line' | 'rectangle' | 'ellipse' | 'arrow' | 'freedraw' | 'text' | 'math';
  
  export type BaseShape = {
    id: string;
    type: ShapeType;
    points: Point[];
    style: StrokeStyle;
    createdAt: number;
    createdBy: string;
  };
  
  export type FreeDrawShape = BaseShape & {
    type: 'freedraw';
  };
  
  export type LineShape = BaseShape & {
    type: 'line';
    startPoint: Point;
    endPoint: Point;
  };
  
  export type RectangleShape = BaseShape & {
    type: 'rectangle';
    topLeft: Point;
    width: number;
    height: number;
  };
  
  export type EllipseShape = BaseShape & {
    type: 'ellipse';
    center: Point;
    radiusX: number;
    radiusY: number;
  };
  
  export type ArrowShape = BaseShape & {
    type: 'arrow';
    startPoint: Point;
    endPoint: Point;
  };
  
  export type TextShape = BaseShape & {
    type: 'text';
    content: string;
    position: Point;
    fontSize: number;
    fontFamily: string;
  };
  
  export type MathShape = BaseShape & {
    type: 'math';
    content: string;
    position: Point;
    result?: string;
  };
  
  export type Shape = 
    | FreeDrawShape 
    | LineShape 
    | RectangleShape 
    | EllipseShape 
    | ArrowShape 
    | TextShape
    | MathShape;
  
  export type Tool = ShapeType | 'select' | 'pan' | 'eraser';
  
  export type User = {
    id: string;
    name: string;
    color: Color;
    cursor?: Point;
    isActive: boolean;
    lastActive: number;
  };
  
  export type HistoryEntry = {
    shapes: Shape[];
    timestamp: number;
  };
  
  export type RecognizedShapeResult = {
    originalShape: Shape;
    recognizedShape: Shape;
    confidence: number;
  };
  
  export type MathResult = {
    shapeId: string;
    expression: string;
    result: string;
    steps?: string[];
    error?: string;
  };
  
  export type DrawboardSessionInfo = {
    sessionId: string;
    users: User[];
    activeUser?: string;
  };