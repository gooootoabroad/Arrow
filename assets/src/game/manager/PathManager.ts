import { Vec2 } from "cc";

export class PathManager {
    private static _instance: PathManager = null;

    public static get instance(): PathManager {
        if (!this._instance) this._instance = new PathManager();
        return this._instance;
    }

    private _pathPoints: Vec2[] = [];
    private _occupiedIndices: Map<number, string> = new Map();

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

    findNearestIndex(headPos: Vec2): number {
        let minDist = Infinity;
        let nearestIndex = -1;
        for (let i = 0; i < this._pathPoints.length; i++) {
            let dist = Vec2.distance(headPos, this._pathPoints[i]);
            if (dist < minDist) {
                minDist = dist;
                nearestIndex = i;
            }
        }
        return nearestIndex;
    }

    reset() {
        this._pathPoints = [];
        this._occupiedIndices.clear();
    }
}
