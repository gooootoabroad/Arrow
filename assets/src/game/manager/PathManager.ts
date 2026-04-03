import { Vec2 } from "cc";

export class PathManager {
    private static _instance: PathManager = null;

    public static get instance(): PathManager {
        if (!this._instance) this._instance = new PathManager();
        return this._instance;
    }

    private _pathPoints: Vec2[] = [];
    private _occupiedIndices: Map<number, string> = new Map();
    private _coordIndexMap: Map<string, number> = new Map();

    get pathPoints(): readonly Vec2[] {
        return this._pathPoints;
    }

    get occupiedCount(): number {
        return this._occupiedIndices.size;
    }

    get freeCount(): number {
        return this._pathPoints.length - this._occupiedIndices.size;
    }

    init(points: Vec2[]) {
        this._pathPoints = this._expandPath(points);
        this._occupiedIndices.clear();
        this._coordIndexMap.clear();
        for (let i = 0; i < this._pathPoints.length; i++) {
            let key = this._pathPoints[i].x + "," + this._pathPoints[i].y;
            this._coordIndexMap.set(key, i);
        }
    }

    private _expandPath(corners: Vec2[]): Vec2[] {
        if (corners.length < 2) return [...corners];

        const result: Vec2[] = [];

        for (let i = 0; i < corners.length; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % corners.length];

            const dx = Math.sign(p2.x - p1.x);
            const dy = Math.sign(p2.y - p1.y);

            let cx = p1.x, cy = p1.y;
            while (cx !== p2.x || cy !== p2.y) {
                result.push(new Vec2(cx, cy));
                cx += dx;
                cy += dy;
            }
        }

        return result;
    }

    getIndexAt(x: number, y: number): number {
        return this._coordIndexMap.get(x + "," + y) ?? -1;
    }

    isOccupied(index: number): boolean {
        return this._occupiedIndices.has(index);
    }

    occupy(index: number, arrowId: string) {
        this._occupiedIndices.set(index, arrowId);
    }

    free(index: number) {
        this._occupiedIndices.delete(index);
    }

    freeAll(arrowId: string) {
        for (let [index, id] of this._occupiedIndices) {
            if (id === arrowId) {
                this._occupiedIndices.delete(index);
            }
        }
    }

    isFull(): boolean {
        return this._occupiedIndices.size >= this._pathPoints.length;
    }

    reset() {
        this._pathPoints = [];
        this._occupiedIndices.clear();
    }
}
