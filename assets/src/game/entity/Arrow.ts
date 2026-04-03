
import { _decorator, Color, Component, Graphics, Vec2 } from 'cc';
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
    private static readonly DIR_UP = new Vec2(0, 1);
    private static readonly DIR_DOWN = new Vec2(0, -1);
    private static readonly DIR_LEFT = new Vec2(-1, 0);
    private static readonly DIR_RIGHT = new Vec2(1, 0);

    private colorType: EArrowColor = EArrowColor.RED;
    private direction: ArrowDirection = ArrowDirection.RIGHT;

    private _state: ArrowState = ArrowState.IDLE;
    private _points: Vec2[] = [];
    private _originalPoints: Vec2[] = [];
    private _nextPathIndex: number = -1;
    private _targetHolePos: Vec2 = null;
    private _onDestroyed: () => void = null;
    private _arrowId: string = '';
    private _occupiedPathIndices: Set<number> = new Set();
    private _activeGroup: HoleGroup = null;
    private _isFirstEnterHole: boolean = false;

    private _tmpVec2A = new Vec2();
    private _tmpColor = new Color();

    public setOnDestroyed(callback: () => void) {
        this._onDestroyed = callback;
    }

    get displayColor(): Color {
        return this._tmpColor.fromHEX(this.colorType);
    }

    get state(): ArrowState {
        return this._state;
    }

    get points(): Vec2[] {
        return this._points;
    }

    public init(config: ArrowSpawnConfig) {
        this.colorType = config.colorType;
        this.direction = config.direction;
        this._state = ArrowState.IDLE;
        this._points = [];
        this._arrowId = `arrow_${config.id}`;
        this._targetHolePos = new Vec2();
        this._points.push(new Vec2(config.startPos[0], config.startPos[1]));
        for (let offset of config.offsetCoords) {
            this._points.push(new Vec2(offset[0], offset[1]));
        }

        this._originalPoints = this._points.map(p => p.clone());
        this._registerGrid();
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

    public hitTest(worldPos: Vec2, threshold: number = GameConfig.arrowLineWidth): boolean {
        let U = GameConfig.UNIT_SIZE;
        for (let i = 0; i < this._points.length - 1; i++) {
            let ax = this._points[i].x * U;
            let ay = this._points[i].y * U;
            let bx = this._points[i + 1].x * U;
            let by = this._points[i + 1].y * U;
            let dist = this.pointToSegmentDistance(worldPos.x, worldPos.y, ax, ay, bx, by);
            if (dist < threshold) return true;
        }
        return false;
    }

    private pointToSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
        let abx = bx - ax;
        let aby = by - ay;
        let apx = px - ax;
        let apy = py - ay;

        let abLenSq = abx * abx + aby * aby;
        if (abLenSq === 0) {
            let dx = px - ax;
            let dy = py - ay;
            return Math.sqrt(dx * dx + dy * dy);
        }

        let t = (apx * abx + apy * aby) / abLenSq;
        t = Math.max(0, Math.min(1, t));

        let closestX = ax + abx * t;
        let closestY = ay + aby * t;
        let dx = px - closestX;
        let dy = py - closestY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public drawTo(g: Graphics) {
        if (this._points.length < 2) return;

        let U = GameConfig.UNIT_SIZE;
        let color = this.displayColor;
        let p0x = this._points[0].x * U;
        let p0y = this._points[0].y * U;

        g.strokeColor = color;

        g.moveTo(p0x, p0y);
        for (let i = 1; i < this._points.length; i++) {
            g.lineTo(this._points[i].x * U, this._points[i].y * U);
        }
        g.stroke();

        let headX = p0x;
        let headY = p0y;
        let nextX = this._points[1].x * U;
        let nextY = this._points[1].y * U;

        let dirX = headX - nextX;
        let dirY = headY - nextY;
        let dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
        if (dirLen === 0) return;
        dirX /= dirLen;
        dirY /= dirLen;

        let perpX = -dirY;
        let perpY = dirX;

        let p1x = headX + dirX * GameConfig.arrowHeadSize;
        let p1y = headY + dirY * GameConfig.arrowHeadSize;
        let hs = GameConfig.arrowLineWidth * 0.6;
        let p2x = headX + perpX * (-hs);
        let p2y = headY + perpY * (-hs);
        let p3x = headX + perpX * hs;
        let p3y = headY + perpY * hs;

        g.fillColor = color;
        g.moveTo(p1x, p1y);
        g.lineTo(p2x, p2y);
        g.lineTo(p3x, p3y);
        g.close();
        g.fill();
    }

    public startMoving() {
        if (this._state !== ArrowState.IDLE) return;

        if (this.canMoveToPath()) {
            this._unregisterGrid();
        }

        this._state = ArrowState.MOVING;
    }

    public tick() {
        if (this._state === ArrowState.ENTERING_HOLE) {
            this._moveIntoHole();
            return true;
        }

        if (this._state !== ArrowState.MOVING) return false;

        if (this._nextPathIndex < 0) {
            this._checkPathReach();
        }

        if (this._nextPathIndex >= 0) {
            this._moveAlongPath();
        } else {
            this._moveStraight();
        }

        return true;
    }

    private _checkPathReach() {
        let headPos = this._points[0];
        let dir = this.getDirectionVector(this.direction);
        let nextX = headPos.x + dir.x;
        let nextY = headPos.y + dir.y;
        let idx = PathManager.instance.getIndexAt(nextX, nextY);
        if (idx >= 0) {
            this._nextPathIndex = idx;
        }
    }

    private _moveStraight() {
        let dir = this.getDirectionVector(this.direction);
        let prevX = this._points[0].x;
        let prevY = this._points[0].y;

        this._points[0].x = prevX + dir.x;
        this._points[0].y = prevY + dir.y;

        for (let i = 1; i < this._points.length; i++) {
            let tmpX = this._points[i].x;
            let tmpY = this._points[i].y;
            this._points[i].x = prevX;
            this._points[i].y = prevY;
            prevX = tmpX;
            prevY = tmpY;
        }

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
        this._nextPathIndex = -1;
        PathManager.instance.freeAll(this._arrowId);
        this._registerGrid();
    }

    private _moveAlongPath() {
        if (PathManager.instance.pathPoints.length < 2) return;

        let newOccupied = this._pointsToPathIndices();
        for (let idx of newOccupied) {
            if (!this._occupiedPathIndices.has(idx)) {
                if (PathManager.instance.isOccupied(idx)) return;
                PathManager.instance.occupy(idx, this._arrowId);
            }
        }

        let prevX = this._points[0].x;
        let prevY = this._points[0].y;

        let nextPt = PathManager.instance.pathPoints[this._nextPathIndex];
        this._tmpVec2A.x = nextPt.x - prevX;
        this._tmpVec2A.y = nextPt.y - prevY;
        this._tmpVec2A.normalize();

        this._points[0].x = prevX + this._tmpVec2A.x;
        this._points[0].y = prevY + this._tmpVec2A.y;

        for (let i = 1; i < this._points.length; i++) {
            let tmpX = this._points[i].x;
            let tmpY = this._points[i].y;
            this._points[i].x = prevX;
            this._points[i].y = prevY;
            prevX = tmpX;
            prevY = tmpY;
        }

        this._nextPathIndex = (this._nextPathIndex + 1) % PathManager.instance.pathPoints.length;
        let oldOccupied = this._occupiedPathIndices;

        for (let idx of oldOccupied) {
            if (!newOccupied.has(idx)) {
                PathManager.instance.free(idx);
            }
        }

        this._occupiedPathIndices = newOccupied;

        this._checkHoleEnter();
    }

    private _pointsToPathIndices(): Set<number> {
        let indices = new Set(this._occupiedPathIndices);
        indices.add(this._nextPathIndex);

        if (indices.size > this.points.length) {
            const first = indices.values().next().value;
            indices.delete(first);
        }
        return indices;
    }

    private _checkHoleEnter() {
        if (GameRuntime.holeGroups.length === 0) return;

        let headPos = this._points[0];
        let headWorldX = headPos.x * GameConfig.UNIT_SIZE;
        let headWorldY = headPos.y * GameConfig.UNIT_SIZE;

        for (let group of GameRuntime.holeGroups) {
            const hole = group.checkHoleMatch(headWorldX, headWorldY, GameConfig.enterThreshold);
            if (hole && hole.checkMatch(this.colorType)) {
                this._enterHole(hole, group);
                return;
            }
        }
    }

    private _enterHole(hole: Hole, group: HoleGroup) {
        hole.occupied = true;
        this._isFirstEnterHole = true;
        this._state = ArrowState.ENTERING_HOLE;
        let holeWorldPos = hole.node.position;
        this._targetHolePos.x = holeWorldPos.x / GameConfig.UNIT_SIZE;
        this._targetHolePos.y = holeWorldPos.y / GameConfig.UNIT_SIZE;
        this._activeGroup = group;
        PathManager.instance.freeAll(this._arrowId);
    }

    private _moveIntoHole() {
        if (!this._isFirstEnterHole) {
            this._points.shift();
        }
        this._isFirstEnterHole = false;

        if (this._points.length <= 1) {
            this._state = ArrowState.FINISHED;

            if (this._activeGroup) {
                this._activeGroup.onHoleEnter();
            }

            if (this._onDestroyed) {
                this._onDestroyed();
            }

            this.node.destroy();
            return;
        }

        let prevX = this._points[0].x;
        let prevY = this._points[0].y;
        this._points[0].x = this._targetHolePos.x;
        this._points[0].y = this._targetHolePos.y;

        for (let i = 1; i < this._points.length; i++) {
            let tmpX = this._points[i].x;
            let tmpY = this._points[i].y;
            this._points[i].x = prevX;
            this._points[i].y = prevY;
            prevX = tmpX;
            prevY = tmpY;
        }
    }

    public stopMoving() {
        this._state = ArrowState.IDLE;
    }

    private getDirectionVector(dir: ArrowDirection): Vec2 {
        switch (dir) {
            case ArrowDirection.UP: return Arrow.DIR_UP;
            case ArrowDirection.DOWN: return Arrow.DIR_DOWN;
            case ArrowDirection.LEFT: return Arrow.DIR_LEFT;
            case ArrowDirection.RIGHT: return Arrow.DIR_RIGHT;
            default: return Arrow.DIR_RIGHT;
        }
    }
}
