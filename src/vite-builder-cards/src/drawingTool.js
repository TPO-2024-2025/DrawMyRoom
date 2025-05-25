import { Path } from "./path.js";

class DrawingTool {
    firstPoint = null;
    lastPoint = null;

    onClick(x, y){ throw new Error("onClick method not implemented"); }
    onHover(x, y, paths){ throw new Error("onHover method not implemented"); }
    onRelease(x, y){ throw new Error("onRelease method not implemented"); }
    draw(ctx){ throw new Error("draw method not implemented"); }
    getFirstPoint(){ return this.firstPoint; }
}

export class LineTool extends DrawingTool {
    onClick(x, y) {
        this.firstPoint = { x, y };
    }
    onHover(x, y, paths) {
        this.lastPoint = { x, y };
    }
    onRelease(x, y) {
        this.lastPoint = { x, y };
        const path = new Path(this.firstPoint.x, this.firstPoint.y,
            this.lastPoint.x, this.lastPoint.y);
        return [path];
    }
    draw(ctx) {
        if (this.firstPoint && this.lastPoint) {
            ctx.beginPath();
            ctx.moveTo(this.firstPoint.x, this.firstPoint.y);
            ctx.lineTo(this.lastPoint.x, this.lastPoint.y);
            ctx.stroke();
        }
    }
}

export class RectangleTool extends DrawingTool {
    onClick(x, y) {
        this.firstPoint = { x, y };
    }
    onHover(x, y, paths) {
        this.lastPoint = { x, y };
    }
    onRelease(x, y) {
        this.lastPoint = { x, y };
        
        let paths = [];

        paths.push(new Path(
            this.firstPoint.x, this.firstPoint.y,
            this.lastPoint.x, this.firstPoint.y
        ));
        paths.push(new Path(
            this.lastPoint.x, this.firstPoint.y,
            this.lastPoint.x, this.lastPoint.y
        ));
        paths.push(new Path(
            this.lastPoint.x, this.lastPoint.y,
            this.firstPoint.x, this.lastPoint.y
        ));
        paths.push(new Path(
            this.firstPoint.x, this.lastPoint.y,
            this.firstPoint.x, this.firstPoint.y
        ));

        return paths;
    }
    draw(ctx) {
        if (this.firstPoint && this.lastPoint) {
            ctx.beginPath();
            ctx.rect(this.firstPoint.x, this.firstPoint.y,
                this.lastPoint.x - this.firstPoint.x,
                this.lastPoint.y - this.firstPoint.y);
            ctx.stroke();
        }
    }
}

export class CircleTool extends DrawingTool {
    onClick(x, y) {
        this.firstPoint = { x, y };
    }
    onHover(x, y, paths) {
        this.lastPoint = { x, y };
    }
    onRelease(x, y) {
        const currentX = x;
        const currentY = y;
        const startX = this.firstPoint.x;
        const startY = this.firstPoint.y;
        const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
        const polygonQuality = 24; // Number of sides
        const paths = [];
        for (let i = 0; i < polygonQuality; i++) {
            const angle1 = (i / polygonQuality) * Math.PI * 2;
            const angle2 = ((i + 1) / polygonQuality) * Math.PI * 2;
            const x1 = startX + Math.cos(angle1) * radius;
            const y1 = startY + Math.sin(angle1) * radius;
            const x2 = startX + Math.cos(angle2) * radius;
            const y2 = startY + Math.sin(angle2) * radius;
            paths.push(new Path(x1, y1, x2, y2));
        }
        
        return paths;
    }
    draw(ctx) {
        if (this.firstPoint && this.lastPoint) {
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(this.lastPoint.x - this.firstPoint.x, 2) +
                Math.pow(this.lastPoint.y - this.firstPoint.y, 2));
            ctx.arc(this.firstPoint.x, this.firstPoint.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

export class EraserTool extends DrawingTool {
    onClick(x, y) {
        this.firstPoint = { x, y };
    }
    onHover(x, y, paths) {
        this.lastPoint = { x, y };

        const currentX = x;
        const currentY = y;
        const snapTolerance = 10; // pixels
        // Erase paths
        for (let i = paths.length - 1; i >= 0; i--) {
            const path = paths[i];
            const x1 = path.x1;
            const y1 = path.y1;
            const x2 = path.x2;
            const y2 = path.y2;
            const distance = Math.abs((y2 - y1) * currentX - (x2 - x1) * currentY + x2 * y1 - y2 * x1) / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
            if (distance < snapTolerance && (currentX > Math.min(x1, x2)-snapTolerance && currentX < Math.max(x1, x2)+snapTolerance) && (currentY > Math.min(y1, y2)-snapTolerance && currentY < Math.max(y1, y2)+snapTolerance)) {
                console.log("Removing path:", path);
                paths.splice(i, 1); // Remove the path
            }
        }
    }
    onRelease(x, y) {
        return null;
    }
    draw(ctx) {
        if (this.firstPoint && this.lastPoint) {
            ctx.strokeStyle = "red"; // Eraser color
            ctx.lineWidth = 10; // Eraser size
            ctx.lineCap = "round"; // Round eraser
            ctx.beginPath();
            ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
            ctx.lineTo(this.lastPoint.x, this.lastPoint.y);
            ctx.stroke();
        }
    }
}