export class SnapData {
    paths = [];
    lastPoint = null;
}

export class SnapStrategy {
    checkSnap(x, y, data) { throw new Error('Snap strategy not implemented'); }
}

export class AxisSnap extends SnapStrategy {
    checkSnap(x, y, data) {
        console.log('AxisSnap', data);
        let startPoint = data.lastPoint;
        if (!startPoint) {
            return { x, y };
        }

        let dx = Math.abs(x - startPoint.x);
        let dy = Math.abs(y - startPoint.y);

        if (dx > dy) {
            y = startPoint.y;
        } else {
            x = startPoint.x;
        }

        return { x, y };
    }
}

export class ProximitySnap extends SnapStrategy {
    checkSnap(x, y, data) {
        console.log('ProximitySnap');
        const snapThreshold = 10; // pixels
        let paths = data.paths;

        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            let x1 = path.x1;
            let y1 = path.y1;
            let x2 = path.x2;
            let y2 = path.y2;

            let distance1 = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
            let distance2 = Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2));
            if (distance1 < snapThreshold) {
                return { x: x1, y: y1 };
            } else if (distance2 < snapThreshold) {
                return { x: x2, y: y2 };
            }
        }

        return { x, y };
    }
}