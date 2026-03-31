
import { _decorator, Color, Component, Graphics, Vec3, Enum, Vec2, Node } from 'cc';
import { ArrowDirection, ArrowState, EArrowColor } from '../type/arrow';
import { GameConfig } from '../../global/GameConfig';
import { ArrowSpawnConfig } from '../config/LevelConfig';
import { GameRuntime } from '../runtime/gameRuntime';
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

    get displayColor(): Color {
        return new Color().fromHEX(this.colorType);
    }

    get state(): ArrowState {
        return this._state;
    }

    get points(): Vec2[] {
        return this._points;
    }

    public init(config: ArrowSpawnConfig) {
        this._graphics = this.getComponent(Graphics);
        this.colorType = config.colorType;
        this.direction = config.direction;
        this._state = ArrowState.IDLE;
        this._points = [];
        let startPos = new Vec2(config.startPos[0], config.startPos[1]);
        this._points.push(startPos.clone());
        for (let offset of config.offsetCoords) {
            let bodyPos = new Vec2();
            Vec2.add(bodyPos, startPos, new Vec2(offset[0] * GameConfig.UNIT_SIZE, offset[1] * GameConfig.UNIT_SIZE));
            this._points.push(bodyPos);
        }

        this._originalPoints = this._points.map(p => p.clone());
        this.draw();
    }

    public hitTest(worldPos: Vec2, threshold: number = this.lineWidth): boolean {
        for (let i = 0; i < this._points.length - 1; i++) {
            let dist = this.pointToSegmentDistance(worldPos, this._points[i], this._points[i + 1]);
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
            g.moveTo(this._points[0].x, this._points[0].y);
            for (let i = 1; i < this._points.length; i++) {
                g.lineTo(this._points[i].x, this._points[i].y);
            }
            g.stroke();
        }

        this.drawHead();
    }

    private drawHead() {
        if (this._points.length < 2) return;

        let g = this._graphics;
        let headPos = this._points[0];
        let nextPos = this._points[1];

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
        this._state = ArrowState.MOVING;

        let moveDir = this.getDirectionVector(this.direction);
        let threshold = GameConfig.UNIT_SIZE * 0.6;

        let moveStep = () => {
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

        this.schedule(moveStep, 0.04);
    }

    private _checkPathReach(threshold: number) {
        if (GameRuntime.levelPathPoints.length < 2) return;

        let headPos = this._points[0];
        let minDist = Infinity;
        let nearestIndex = -1;

        for (let i = 0; i < GameRuntime.levelPathPoints.length; i++) {
            let dist = Vec2.distance(headPos, GameRuntime.levelPathPoints[i]);
            if (dist < minDist) {
                minDist = dist;
                nearestIndex = i;
            }
        }

        if (minDist < threshold) {
            this._currentPathIndex = nearestIndex;
            this._points[0] = GameRuntime.levelPathPoints[nearestIndex].clone();
        }
    }

    private _moveStraight(moveDir: Vec2) {
        let oldPoints = this._points.map(p => p.clone());
        let newPoints: Vec2[] = [];
        let headNewPos = new Vec2();
        Vec2.add(headNewPos, oldPoints[0], moveDir.clone());
        newPoints.push(headNewPos);

        for (let i = 1; i < oldPoints.length; i++) {
            newPoints.push(oldPoints[i - 1].clone());
        }

        this._points = newPoints;
    }

    private _moveAlongPath() {
        if (GameRuntime.levelPathPoints.length < 2) return;

        let oldPoints = this._points.map(p => p.clone());
        let newPoints: Vec2[] = [];

        let currentIndex = this._currentPathIndex;
        let nextIndex = (currentIndex + 1) % GameRuntime.levelPathPoints.length;
        let currentPt = GameRuntime.levelPathPoints[currentIndex];
        let nextPt = GameRuntime.levelPathPoints[nextIndex];

        let dir = new Vec2();
        Vec2.subtract(dir, nextPt, currentPt);
        dir.length();
        dir.normalize();

        let stepDist = GameConfig.UNIT_SIZE;
        let headNewPos = new Vec2();
        Vec2.add(headNewPos, oldPoints[0], dir.clone().multiplyScalar(stepDist));
        newPoints.push(headNewPos);

        for (let i = 1; i < oldPoints.length; i++) {
            newPoints.push(oldPoints[i - 1].clone());
        }

        this._points = newPoints;

        let distToNext = Vec2.distance(this._points[0], nextPt);
        if (distToNext < stepDist) {
            this._currentPathIndex = nextIndex;
            this._points[0] = GameRuntime.levelPathPoints[nextIndex].clone();
        }
    }

    stopMoving() {
        this.unscheduleAllCallbacks();
        this._state = ArrowState.IDLE;
    }

    resetToOriginal() {
        this._points = this._originalPoints.map(p => p.clone());
        this._state = ArrowState.IDLE;
        this.draw();
    }

    private getDirectionVector(dir: ArrowDirection): Vec2 {
        switch (dir) {
            case ArrowDirection.UP: return new Vec2(0, 1 * GameConfig.UNIT_SIZE);
            case ArrowDirection.DOWN: return new Vec2(0, -1 * GameConfig.UNIT_SIZE);
            case ArrowDirection.LEFT: return new Vec2(-1 * GameConfig.UNIT_SIZE, 0);
            case ArrowDirection.RIGHT: return new Vec2(1 * GameConfig.UNIT_SIZE, 0);
            default: return new Vec2(1 * GameConfig.UNIT_SIZE, 0);
        }
    }
}