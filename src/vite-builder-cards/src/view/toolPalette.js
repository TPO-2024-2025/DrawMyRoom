import { LineTool } from '../drawingTool.js';
import { RectangleTool } from '../drawingTool.js';
import { CircleTool } from '../drawingTool.js';
import { EraserTool } from '../drawingTool.js';

export class ToolPalette {
  
  currentTool = null;

  selectTool(name) {
    if (name === 'line') {
      this.currentTool = new LineTool();
    } else if (name === 'rectangle') {
      this.currentTool = new RectangleTool();
    } else if (name === 'circle') {
      this.currentTool = new CircleTool();
    } else if (name === 'eraser') {
        this.currentTool = new EraserTool();
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  }

  getTool() {
    return this.currentTool;
  }
}