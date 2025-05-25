import { SnapData } from '../snapStrategy.js';

export class Canvas2DView {
    canvas;
    snapStrategy;
    snapData;

    render2D (model) {
        console.log('render2D');
        this.clear();   
        if (!this.canvas) {
            console.log('Canvas not initialized render2D()');
            return;
        }

        this.model = model;

        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = '#1d1e23';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = '#797a7e22';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += 10) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(this.canvas.width, i);
            ctx.stroke();
        }


        ctx.strokeStyle = '#75bae9';
        ctx.lineWidth = 2;

        const paths = model.paths;
        console.log('render2D paths', paths);
        console.log('Length of paths', paths.length);
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            ctx.beginPath();
            ctx.moveTo(path.x1, path.y1);
            ctx.lineTo(path.x2, path.y2);
            ctx.stroke();
        }

    }

    setTool (t /* DrawingTool */) {
        return "Not implemented"
    }

    setSnapStrategy (s /* SnapStrategy */) {
        this.snapStrategy = s;
    }

    clear () {
        console.log('clear');
        if (!this.canvas) {
            console.log('Canvas not initialized clear()');
            return;
        }
        this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    show () {
        return "Not implemented"
    }

    updateSnapData (data /* SnapData */) {
        console.log('updateSnapData canvas2DView.js', data);
        this.snapData = data;
    }

    getCanvasCoordinates (e) {
        if (!this.canvas) {
            console.error('Canvas not initialized');
            return null;
        }
        console.log('getCanvasCoordinates');
        let x = e.clientX - this.canvas.getBoundingClientRect().left;
        let y = e.clientY - this.canvas.getBoundingClientRect().top;

        if (this.snapStrategy) {
            const snapped = this.snapStrategy.checkSnap(x, y, this.snapData);
            x = snapped.x;
            y = snapped.y;
        }
        return { x, y };
    }

    resize() {
        console.log('resize canvas2DView.js');
        if (!this.canvas) {
            console.log('Canvas not initialized resize()');
            return;
        }
        // Set the canvas internal dimensions to match its CSS dimensions
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        
        // Re-render if there's a model
        if (this.model) {
            console.log('resize canvas2DView.js re-render');
            this.render2D(this.model);
        }
    }
}