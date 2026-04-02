
import { _decorator, Color, Component, Graphics, Vec3, Enum, Vec2, Node } from 'cc';
import { ArrowDirection, ArrowState, EArrowColor } from '../type/arrow';
import { GameConfig } from '../../global/GameConfig';
import { ArrowSpawnConfig } from '../config/LevelConfig';
import { GameRuntime } from '../runtime/gameRuntime';
import { HoleGroup } from './HoleGroup';
import { Hole } from './Hole';
import { GridManager } from '../manager/GridManager';
import { PathManager } from '../manager/PathManager';
let { ccclass, property } = _decorator;

@ccclass('Arrow')
export class Arrow extends Component {
    private colorType: EArrowColor = EArrowColor.RED;
    private direction: ArrowDirection = ArrowDirection.RIGHT;

    private lineWidth: number = GameConfig.UNIT_SIZE * 0.5;
    private headSize: number = GameConfig.UNIT_SIZE * 0.7;

    private _graphics: Graphics = null;
    private _state: ArrowState = ArrowState.IDLE;
    private _points: Vec2[] = [];
    private _originalPoints: Vec2[] = [];
    private _currentPathIndex: number = -1;
    private _targetHolePos: Vec2 = null;
    private _onDestroyed: () => void = null;
    private _arrowId: string = '';
    private _occupiedPathIndices: Set<number> = new Set();

    public setOnDestroyed(callback: () => void) {
        this._onDestroyed = callback;
    }

    get displayColor(): Color {
        return new Color().fromHEX(this.colorType);
    }

    get state(): ArrowState {
        return this._state;
    }

    get points(): Vec2[] {
        return this._points;
    }

    private _gridToWorld(p: Vec2): Vec2 {
        return new Vec2(p.x * GameConfig.UNIT_SIZE, p.y * GameConfig.UNIT_SIZE);
    }

    private _pointsToPathIndices(points: Vec2[]): Set<number> {
        let indices = new Set<number>();
        for (let p of points) {
            let idx = PathManager.instance.findNearestIndex(p);
            if (idx >= 0) {
                let pt = PathManager.instance.pathPoints[idx];
                if (Vec2.distance(p, pt) < 0.5) {
                    indices.add(idx);
                }
            }
        }
        return indices;
    }

    public init(config: ArrowSpawnConfig) {
        this._graphics = this.getComponent(Graphics);
        this.colorType = config.colorType;
        this.direction = config.direction;
        this._state = ArrowState.IDLE;
        this._points = [];
        this._arrowId = `arrow_${config.id}`;
        this._points.push(new Vec2(config.startPos[0], config.startPos[1]));
        for (let offset of config.offsetCoords) {
            this._points.push(new Vec2(offset[0], offset[1]));
        }

        this._originalPoints = this._points.map(p => p.clone());
        this._registerGrid();
        this.draw();
    }

    private _registerGrid() {
        for (let p of this._points) {
            GridManager.instance.register(p.x, p.y);
        }
    }

    private _unregisterGrid() {
        for (let p of this._points) {
            GridManager.instance.unregister(p.x, p.y);
        }
    }

    public canMoveToPath(): boolean {
        let headPos = this._points[0];
        let dir = this.getDirectionVector(this.direction);
        return GridManager.instance.checkAheadClear(headPos.x, headPos.y, dir.x, dir.y);
    }

    public hitTest(worldPos: Vec2, threshold: number = this.lineWidth): boolean {
        for (let i = 0; i < this._points.length - 1; i++) {
            let a = this._gridToWorld(this._points[i]);
            let b = this._gridToWorld(this._points[i + 1]);
            let dist = this.pointToSegmentDistance(worldPos, a, b);
            if (dist < threshold) return true;
        }
        return false;
    }

    private pointToSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
        let ab = new Vec2();
        Vec2.subtract(ab, b, a);
        let ap = new Vec2();
        Vec2.subtract(ap, p, a);

        let abLenSq = Vec2.dot(ab, ab);
        if (abLenSq === 0) return Vec2.distance(p, a);

        let t = Vec2.dot(ap, ab) / abLenSq;
        t = Math.max(0, Math.min(1, t));

        let closest = new Vec2();
        Vec2.scaleAndAdd(closest, a, ab, t);
        return Vec2.distance(p, closest);
    }

    draw() {
        if (!this._graphics || this._points.length < 2) return;

        let g = this._graphics;
        g.clear();
        g.lineWidth = this.lineWidth;
        g.lineJoin = Graphics.LineJoin.ROUND;
        g.lineCap = Graphics.LineCap.ROUND;
        g.strokeColor = this.displayColor;

        if (this._points.length >= 2) {
            let p0 = this._gridToWorld(this._points[0]);
            g.moveTo(p0.x, p0.y);
            for (let i = 1; i < this._points.length; i++) {
                let pi = this._gridToWorld(this._points[i]);
                g.lineTo(pi.x, pi.y);
            }
            g.stroke();
        }

        this.drawHead();
    }

    private drawHead() {
        if (this._points.length < 2) return;

        let g = this._graphics;
        let headPos = this._gridToWorld(this._points[0]);
        let nextPos = this._gridToWorld(this._points[1]);

        let dir = new Vec2();
        Vec2.subtract(dir, headPos, nextPos);
        dir.normalize();

        let perp = new Vec2(-dir.y, dir.x);

        let p1 = new Vec2();
        Vec2.add(p1, headPos, dir.clone().multiplyScalar(this.headSize));

        let p2 = new Vec2();
        Vec2.add(p2, headPos, perp.clone().multiplyScalar(-this.lineWidth * 0.6));

        let p3 = new Vec2();
        Vec2.add(p3, headPos, perp.clone().multiplyScalar(this.lineWidth * 0.6));

        g.fillColor = this.displayColor;
        g.moveTo(p1.x, p1.y);
        g.lineTo(p2.x, p2.y);
        g.lineTo(p3.x, p3.y);
        g.close();
        g.fill();
    }

    startMoving() {
        if (this._state !== ArrowState.IDLE) return;

        if (!this.canMoveToPath()) {
        } else {
            this._unregisterGrid();
        }

        this._state = ArrowState.MOVING;

        let moveDir = this.getDirectionVector(this.direction);
        let threshold = 1.1;

        let moveStep = () => {
            if (this._state === ArrowState.ENTERING_HOLE) {
                this._moveIntoHole();
                this.draw();
                return;
            }

            if (this._state !== ArrowState.MOVING) {
                this.unschedule(moveStep);
                return;
            }

            if (this._currentPathIndex < 0) {
                this._checkPathReach(threshold);
            }

            if (this._currentPathIndex >= 0) {
                this._moveAlongPath();
            } else {
                this._moveStraight(moveDir);
            }

            this.draw();
        };

        this.schedule(moveStep, 0.5);
    }

    private _checkPathReach(threshold: number) {
        if (PathManager.instance.pathPoints.length < 2) return;

        let headPos = this._points[0];
        let nearestIndex = PathManager.instance.findNearestIndex(headPos);
        let minDist = Vec2.distance(headPos, PathManager.instance.pathPoints[nearestIndex]);

        if (minDist < threshold) {
            this._currentPathIndex = nearestIndex;
            //this._points[0] = PathManager.instance.pathPoints[nearestIndex].clone();
        }
    }

    private _moveStraight(moveDir: Vec2) {
        let oldPoints = this._points.map(p => p.clone());
        let newPoints: Vec2[] = [];
        let headNewPos = new Vec2();
        Vec2.add(headNewPos, oldPoints[0], moveDir);
        newPoints.push(headNewPos);

        for (let i = 1; i < oldPoints.length; i++) {
            newPoints.push(oldPoints[i - 1].clone());
        }

        this._points = newPoints;

        if (this._checkCollision()) {
            this._resetToOriginal();
        }
    }

    private _checkCollision(): boolean {
        let headPos = this._points[0];
        const row = GridManager.instance.getRow(headPos.y);
        if (row) {
            for (let x of row) {
                if (x === headPos.x) return true;
            }
        }

        const col = GridManager.instance.getCol(headPos.x);
        if (col) {
            for (let y of col) {
                if (y === headPos.y) return true;
            }
        }
        return false;
    }

    private _resetToOriginal() {
        this._state = ArrowState.IDLE;
        this._points = this._originalPoints.map(p => p.clone());
        this._occupiedPathIndices.clear();
        this._currentPathIndex = -1;
        PathManager.instance.freeAll(this._arrowId);
        this._registerGrid();
        this.unscheduleAllCallbacks();
        this.draw();
    }

    private _moveAlongPath() {
        if (PathManager.instance.pathPoints.length < 2) return;

        let oldPoints = this._points.map(p => p.clone());
        let newPoints: Vec2[] = [];

        let headPos = oldPoints[0];
        let nextIndex = this._currentPathIndex;
        //let nextIndex = (this._currentPathIndex + 1) % PathManager.instance.pathPoints.length;
        let nextPt = PathManager.instance.pathPoints[nextIndex];

        let dir = new Vec2();
        Vec2.subtract(dir, nextPt, headPos);
        dir.normalize();

        newPoints.push(new Vec2(oldPoints[0].x + dir.x, oldPoints[0].y + dir.y));

        for (let i = 1; i < oldPoints.length; i++) {
            newPoints.push(oldPoints[i - 1].clone());
        }

        let newOccupied = this._pointsToPathIndices(newPoints);
        let needOccupy = new Set<number>();
        for (let idx of newOccupied) {
            if (!this._occupiedPathIndices.has(idx)) {
                needOccupy.add(idx);
            }
        }

        for (let idx of needOccupy) {
            if (PathManager.instance.isOccupied(idx)) return;
            // 需要直接占位，因为可能有其他箭头正在移动，等到下一帧再占位可能就被占了
            PathManager.instance.occupy(idx, this._arrowId);
        }

        this._points = newPoints;
        //this._currentPathIndex = nextIndex;
        this._currentPathIndex = (this._currentPathIndex + 1) % PathManager.instance.pathPoints.length;
        let oldOccupied = new Set(this._occupiedPathIndices);
        this._occupiedPathIndices = newOccupied;

        for (let idx of oldOccupied) {
            if (!this._occupiedPathIndices.has(idx)) {
                PathManager.instance.free(idx);
            }
        }
        // for (let idx of needOccupy) {
        //     PathManager.instance.occupy(idx, this._arrowId);
        // }

        this._checkHoleEnter();
    }

    private _checkHoleEnter() {
        if (GameRuntime.holeGroups.length === 0) return;

        let headWorldPos = this._gridToWorld(this._points[0]);
        let enterThreshold = GameConfig.UNIT_SIZE * 1.5;

        for (let group of GameRuntime.holeGroups) {
            const hole = group.checkHoleMatch(headWorldPos, enterThreshold);
            if (hole && hole.checkMatch(this.colorType)) {
                this._enterHole(hole, group);
                return;
            }
        }
    }

    private _enterHole(hole: Hole, group: HoleGroup) {
        hole.occupied = true;
        this._state = ArrowState.ENTERING_HOLE;
        let holeWorldPos = hole.node.position;
        this._targetHolePos = new Vec2(holeWorldPos.x / GameConfig.UNIT_SIZE, holeWorldPos.y / GameConfig.UNIT_SIZE);
        this._activeGroup = group;
        PathManager.instance.freeAll(this._arrowId);
    }

    private _activeGroup: HoleGroup = null;

    private _moveIntoHole() {
        if (this._points.length <= 1) {
            this._state = ArrowState.FINISHED;
            this.unscheduleAllCallbacks();

            if (this._activeGroup) {
                this._activeGroup.onHoleEnter();
            }

            if (this._onDestroyed) {
                this._onDestroyed();
            }

            this.node.destroy();
            return;
        }

        let oldPoints = this._points.map(p => p.clone());
        let newPoints: Vec2[] = [];

        let headDir = new Vec2();
        Vec2.subtract(headDir, this._targetHolePos, oldPoints[0]);
        let distToHole = headDir.length();
        headDir.normalize();

        let stepDist = 1.0;
        let headNewPos = new Vec2();
        Vec2.add(headNewPos, oldPoints[0], headDir.clone().multiplyScalar(stepDist));
        newPoints.push(headNewPos);

        for (let i = 1; i < oldPoints.length; i++) {
            newPoints.push(oldPoints[i - 1].clone());
        }

        this._points = newPoints;

        if (distToHole < stepDist) {
            this._points.shift();
        }
    }

    stopMoving() {
        this.unscheduleAllCallbacks();
        this._state = ArrowState.IDLE;
    }

    private getDirectionVector(dir: ArrowDirection): Vec2 {
        switch (dir) {
            case ArrowDirection.UP: return new Vec2(0, 1);
            case ArrowDirection.DOWN: return new Vec2(0, -1);
            case ArrowDirection.LEFT: return new Vec2(-1, 0);
            case ArrowDirection.RIGHT: return new Vec2(1, 0);
            default: return new Vec2(1, 0);
        }
    }
}
