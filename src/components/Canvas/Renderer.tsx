// Add to your Canvas/Renderer.tsx file
// This is a partial implementation that should be integrated with your existing renderer
import { MathShape } from "@/types/types";
const renderMathShape = (ctx: CanvasRenderingContext2D, shape: MathShape) => {
  const { position, content, result } = shape;
  
  // Draw the math expression
  ctx.font = '16px Arial';
  ctx.fillStyle = shape.style.color;
  ctx.fillText(content || '', position.x, position.y);
  
  // If there's a result, draw it below
  if (result) {
    ctx.fillStyle = 'green';
    ctx.fillText(`= ${result}`, position.x, position.y + 24);
  }
};