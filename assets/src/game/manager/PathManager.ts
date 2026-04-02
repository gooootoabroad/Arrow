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
        this._pathPoints = points;
        this._occupiedIndices.clear();
        this._coordIndexMap.clear();
        for (let i = 0; i < points.length; i++) {
            let key = points[i].x + "," + points[i].y;
            this._coordIndexMap.set(key, i);
        }
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
