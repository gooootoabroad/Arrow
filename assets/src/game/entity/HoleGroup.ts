import { _decorator, Node, Vec3, tween, Vec2, Component, Graphics, Color } from 'cc';
import { GameRuntime } from '../runtime/gameRuntime';
import { Hole } from '../entity/Hole';
import { GameConfig } from '../../global/GameConfig';
import { HoleSpawnConfig } from '../config/LevelConfig';
import { Tween } from 'cc';
import { ColorPoolManager } from '../manager/ColorPoolManager';
import { v3 } from 'cc';
import { ParticleSystem2D } from 'cc';
import { SpriteFrame } from 'cc';
import { Bundle } from '../../global/bundle';
import { Sprite } from 'cc';
import { LoadMgr } from '../../manager/LoadMgr';
import { GPlatform } from '../../platform/platform';

const { ccclass, property } = _decorator;

const MAX_VISIBLE_HOLES = 2;

@ccclass('HoleGroup')
export class HoleGroup extends Component {
    private holes: Hole[] = [];
    private firstHolePos: Vec3 = null;
    private endHolePos: Vec3 = null;
    private _totalHoles: number = 0;
    private _spawnedCount: number = 0;
    private _positions: number[][] = [];
    private _nextHoleIndex: number = 0;
    private _dashedCircleNode: Node = null;

    // 随机特效节点
    private _ripplePool: Node[] = [];
    private _rippleSpriteFrame: SpriteFrame = null;
    private _rippleCount: number = 5;

    get activeHole(): Hole {
        return this.holes.length > 0 ? this.holes[0] : null;
    }

    isExhausted(): boolean {
        return this._spawnedCount >= this._totalHoles && this.holes.length === 0;
    }

    async init(config: HoleSpawnConfig) {
        this._totalHoles = config.totalHoles;
        this._spawnedCount = 0;
        this._positions = config.positions;
        this._nextHoleIndex = 0;
        this.holes = [];

        for (let i = 0; i < Math.min(MAX_VISIBLE_HOLES, config.positions.length); i++) {
            this._createHole(i);
        }

        this._createDashedCircle();

        this._initRipplePool();
    }

    private async _initRipplePool() {
        this._rippleSpriteFrame = await LoadMgr.loadSpriteFrame(Bundle.game, 'texture/white2');
        //this._rippleSpriteFrame = await Bundle.get(Bundle.game, 'texture/white2', SpriteFrame);

        for (let i = 0; i < this._rippleCount; i++) {
            const rippleNode = new Node(`Ripple_${i}`);
            rippleNode.active = false;
            this.node.addChild(rippleNode);
            rippleNode.setPosition(this.firstHolePos);

            const sprite = rippleNode.addComponent(Sprite);
            sprite.spriteFrame = this._rippleSpriteFrame;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            rippleNode.uiTransfrom.setContentSize(GameConfig.holeSize, GameConfig.holeSize);
            this._ripplePool.push(rippleNode);
        }
    }

    private _playRipple(color: Color) {
        const spreadDist = GameConfig.holeSize * 3;
        for (let i = 0; i < this._rippleCount; i++) {
            const rippleNode = this._ripplePool[i];
            rippleNode.active = true;
            Tween.stopAllByTarget(rippleNode);
            rippleNode.setPosition(this.firstHolePos);
            rippleNode.getComponent(Sprite).color = color;
            rippleNode.opacity = 255;

            const angle = (i / this._rippleCount) * Math.PI * 2;
            const targetX = this.firstHolePos.x + Math.cos(angle) * spreadDist;
            const targetY = this.firstHolePos.y + Math.sin(angle) * spreadDist;

            tween(rippleNode)
                .delay(i * 0.06)
                .parallel(
                    tween().to(0.5, { position: new Vec3(targetX, targetY, 0) }),
                    tween().to(0.5, { opacity: 0 })
                )
                .call(() => {
                    rippleNode.active = false;
                })
                .start();
        }
    }

    private _createHole(index: number) {
        if (index >= this._positions.length) return;

        const color = ColorPoolManager.getNextHoleColor();
        const holeNode = new Node(`Hole_${this._nextHoleIndex}`);
        this._nextHoleIndex += 1;
        this.node.addChild(holeNode);

        const pos = this._positions[index];
        const worldX = pos[0] * GameConfig.UNIT_SIZE;
        const worldY = pos[1] * GameConfig.UNIT_SIZE;

        if (index === 0) {
            this.firstHolePos = new Vec3(worldX, worldY, 0);
        } else {
            holeNode.scale = v3(0.7, 0.7, 1);
        }
        if (index === MAX_VISIBLE_HOLES - 1) {
            this.endHolePos = new Vec3(worldX, worldY, 0);
        }

        holeNode.setPosition(new Vec3(worldX, worldY, 0));

        const holeComp = holeNode.addComponent(Hole);
        holeComp.init(color);
        this.holes.push(holeComp);
        this._spawnedCount++;
    }

    private _createDashedCircle() {
        this._dashedCircleNode = new Node('DashedCircle');
        this.node.addChild(this._dashedCircleNode);
        this._dashedCircleNode.setSiblingIndex(0);
        this._dashedCircleNode.setPosition(this.firstHolePos);

        const g = this._dashedCircleNode.addComponent(Graphics);
        this._drawDashedCircle(g, GameConfig.holeSize * 1.1);

        tween(this._dashedCircleNode)
            .by(2, { angle: 360 })
            .call(() => { this._dashedCircleNode.angle = 0; })
            .union()
            .repeatForever()
            .start();
    }

    private _drawDashedCircle(g: Graphics, radius: number) {
        const dashes = 7;
        const stepsPerDash = 1;
        g.clear();
        g.lineWidth = 5;
        g.strokeColor = new Color(100, 100, 100, 255);

        for (let i = 0; i < dashes; i++) {
            const startAngle = (i / dashes) * Math.PI * 2;
            const endAngle = ((i + 0.7) / dashes) * Math.PI * 2;

            g.moveTo(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius);
            for (let j = 1; j <= stepsPerDash; j++) {
                const angle = startAngle + (endAngle - startAngle) * (j / stepsPerDash);
                g.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
            g.stroke();
        }
    }

    private _destoryDashedCircle() {
        if (this._dashedCircleNode) {
            Tween.stopAllByTarget(this._dashedCircleNode);
            this._dashedCircleNode.destroy();
            this._dashedCircleNode = null;
        }
    }

    onHoleEnter() {
        let currentHole = this.holes.shift();
        if (!currentHole) {
            this._destoryDashedCircle();
            return;
        }

        currentHole.node.destroy();
        if (this.holes.length > 0) {
            for (let i = this.holes.length - 1; i > 0; i--) {
                let targetPos = this.holes[i - 1].node.position.clone();
                tween(this.holes[i].node)
                    .to(0.2, { position: targetPos })
                    .start();
            }

            tween(this.holes[0].node)
                .to(0.2, { position: this.firstHolePos, scale: v3(1, 1, 1) })
                .start();

            // 如果本次头节点就是彩球了，就不生成了
            if (!this.holes[0].isRainbow) {
                this._spawnNextHole();
            }
        }

        if (this.holes.length === 0) {
            this._destoryDashedCircle();
        }
    }

    private _spawnNextHole() {
        if (this._spawnedCount >= this._totalHoles) return;

        const holeNode = new Node(`Hole_${this._nextHoleIndex}`);
        this.node.addChild(holeNode);
        this._nextHoleIndex += 1;
        holeNode.setPosition(this.endHolePos);
        holeNode.setScale(0, 0, 1);

        const holeComp = holeNode.addComponent(Hole);
        const color = ColorPoolManager.getNextHoleColor();
        holeComp.init(color);
        this.holes.push(holeComp);
        this._spawnedCount++;

        tween(holeNode)
            .to(0.2, { scale: new Vec3(0.7, 0.7, 1) })
            .start();
    }

    checkHoleMatch(headWorldX: number, headWorldY: number, enterThreshold: number): Hole | null {
        const activeHole = this.activeHole;
        if (!activeHole) return null;

        const holeWorldPos = activeHole.node.position;
        let dx = headWorldX - holeWorldPos.x;
        let dy = headWorldY - holeWorldPos.y;
        let dist = dx * dx + dy * dy;

        if (dist <= enterThreshold * enterThreshold) {
            return activeHole;
        }
        return null;
    }

    startEntryHole(color: Color) {
        GPlatform.vibrateLong();
        this._playRipple(color);
    }
}
