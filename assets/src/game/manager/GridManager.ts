export class GridManager {
    private static _instance: GridManager = null;

    public static get instance(): GridManager {
        if (!this._instance) this._instance = new GridManager();
        return this._instance;
    }

    private rowOccupied: Map<number, Set<number>> = new Map();
    private colOccupied: Map<number, Set<number>> = new Map();

    public register(x: number, y: number) {
        if (!this.rowOccupied.has(y)) this.rowOccupied.set(y, new Set());
        this.rowOccupied.get(y).add(x);

        if (!this.colOccupied.has(x)) this.colOccupied.set(x, new Set());
        this.colOccupied.get(x).add(y);
    }

    public unregister(x: number, y: number) {
        this.rowOccupied.get(y)?.delete(x);
        this.colOccupied.get(x)?.delete(y);
    }

    public clearArrow(points: {x: number, y: number}[]) {
        for (let p of points) {
            this.unregister(p.x, p.y);
        }
    }

    public checkRowClear(y: number, startX: number, endX: number): boolean {
        const row = this.rowOccupied.get(y);
        if (!row) return true;
        const min = Math.min(startX, endX);
        const max = Math.max(startX, endX);
        for (let x of row) {
            if (x > min && x < max) return false;
        }
        return true;
    }

    public checkColClear(x: number, startY: number, endY: number): boolean {
        const col = this.colOccupied.get(x);
        if (!col) return true;
        const min = Math.min(startY, endY);
        const max = Math.max(startY, endY);
        for (let y of col) {
            if (y > min && y < max) return false;
        }
        return true;
    }

    public checkAheadClear(x: number, y: number, dirX: number, dirY: number): boolean {
        if (dirX !== 0) {
            const row = this.rowOccupied.get(y);
            if (!row) return true;
            const sorted = Array.from(row).sort((a, b) => a - b);
            if (dirX > 0) {
                return !sorted.some(v => v > x);
            } else {
                return !sorted.some(v => v < x);
            }
        }
        if (dirY !== 0) {
            const col = this.colOccupied.get(x);
            if (!col) return true;
            const sorted = Array.from(col).sort((a, b) => a - b);
            if (dirY > 0) {
                return !sorted.some(v => v > y);
            } else {
                return !sorted.some(v => v < y);
            }
        }
        return true;
    }

    public getRow(y: number): Set<number> | undefined {
        return this.rowOccupied.get(y);
    }

    public getCol(x: number): Set<number> | undefined {
        return this.colOccupied.get(x);
    }

    public reset() {
        this.rowOccupied.clear();
        this.colOccupied.clear();
    }
}
