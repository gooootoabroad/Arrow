import { _decorator, Node, Vec3, tween, Vec2, Component, Graphics, Color } from 'cc';
import { Hole } from '../entity/Hole';
import { EArrowColor } from '../type/arrow';
import { GameConfig } from '../../global/GameConfig';
import { HoleSpawnConfig } from '../config/LevelConfig';
import { Prefab } from 'cc';
import { Tween } from 'cc';

const { ccclass, property } = _decorator;

const MAX_VISIBLE_HOLES = 2;

@ccclass('HoleGroup')
export class HoleGroup extends Component {
    private holes: Hole[] = [];
    private firstHolePos: Vec3 = null;
    private endHolePos: Vec3 = null;
    private _pendingConfigs: { gridPos: number[]; colorType: EArrowColor }[] = [];
    private _nextHoleIndex: number = 0;
    private _dashedCircleNode: Node = null;

    get activeHole(): Hole {
        if (this.holes.length > 0) {
            return this.holes[0];
        }
        return null;
    }

    init(config: HoleSpawnConfig) {
        this._nextHoleIndex = 0;

        for (let i = 0; i < config.positions.length; i++) {
            if (i === 0) {
                this.firstHolePos = new Vec3(config.positions[i][0] * GameConfig.UNIT_SIZE, config.positions[i][1] * GameConfig.UNIT_SIZE, 0);
            }
            if (i === MAX_VISIBLE_HOLES - 1) {
                this.endHolePos = new Vec3(config.positions[i][0] * GameConfig.UNIT_SIZE, config.positions[i][1] * GameConfig.UNIT_SIZE, 0);
            }

            if (i < MAX_VISIBLE_HOLES) {
                const holeNode = new Node(`Hole_${this._nextHoleIndex}`);
                this._nextHoleIndex += 1;
                this.node.addChild(holeNode);
                let pos = config.positions[i];
                holeNode.setPosition(new Vec3(pos[0] * GameConfig.UNIT_SIZE, pos[1] * GameConfig.UNIT_SIZE, 0));

                const holeComp = holeNode.addComponent(Hole);
                holeComp.init(config.colorTypes[i]);
                this.holes.push(holeComp);
            } else {
                this._pendingConfigs.push({
                    gridPos: config.positions[i],
                    colorType: config.colorTypes[i],
                });
            }
        }

        this._createDashedCircle();
    }

    private _createDashedCircle() {
        this._dashedCircleNode = new Node('DashedCircle');
        this.node.addChild(this._dashedCircleNode);
        this._dashedCircleNode.setSiblingIndex(0);
        this._dashedCircleNode.setPosition(this.firstHolePos);

        const g = this._dashedCircleNode.addComponent(Graphics);
        this._drawDashedCircle(g, GameConfig.UNIT_SIZE * 0.7);

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
                .to(0.2, { position: this.firstHolePos })
                .start();
        }

        this._spawnNextHole();

        if (this.holes.length === 0) {
            this._destoryDashedCircle();
        }
    }

    private _spawnNextHole() {
        if (this._pendingConfigs.length === 0) return;

        let pending = this._pendingConfigs.shift();
        const holeNode = new Node(`Hole_${this._nextHoleIndex}`);
        this.node.addChild(holeNode);
        this._nextHoleIndex += 1;
        holeNode.setPosition(this.endHolePos);
        holeNode.setScale(0, 0, 1);

        const holeComp = holeNode.addComponent(Hole);
        holeComp.init(pending.colorType);
        this.holes.push(holeComp);

        tween(holeNode)
            .to(0.2, { scale: new Vec3(1, 1, 1) })
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
}
