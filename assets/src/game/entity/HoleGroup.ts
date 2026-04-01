import { _decorator, Node, Vec2, Vec3, tween } from 'cc';
import { Hole } from '../entity/Hole';
import { EArrowColor } from '../type/arrow';
import { GameConfig } from '../../global/GameConfig';
import { HoleSpawnConfig } from '../config/LevelConfig';

const { ccclass } = _decorator;

@ccclass('HoleGroup')
export class HoleGroup {
    private holes: Hole[] = [];
    private firstHolePos: Vec3 = null;

    get activeHole(): Hole {
        if (this.holes.length > 0) {
            return this.holes[0];
        }
        return null;
    }

    get allHoles(): Hole[] {
        return this.holes;
    }

    init(config: HoleSpawnConfig, parent: Node) {
        for (let i = 0; i < config.positions.length; i++) {
            const holeNode = new Node(`Group${config.id}Hole_${i}`);
            parent.addChild(holeNode);
            let pos = config.positions[i];
            holeNode.setPosition(new Vec3(pos[0] * GameConfig.UNIT_SIZE, pos[1] * GameConfig.UNIT_SIZE, 0));

            const holeComp = holeNode.addComponent(Hole);
            holeComp.init(config.colorTypes[i]);

            if (i === 0) {
                this.holes.push(holeComp);
                this.firstHolePos = holeNode.position.clone();
            } else {
                this.holes.push(holeComp);
            }
        }
    }

    onHoleEnter() {
        const currentHole = this.holes.shift();
        if (!currentHole) return;
        currentHole.node.destroy();
        if (this.holes.length > 0) {
            for (let i = this.holes.length - 1; i > 0; i--) {
                let targetPos = this.holes[i - 1].node.position.clone();
                tween(this.holes[i].node)
                    .to(0.2, { position: targetPos })
                    .start();
            }

            // 最后一个移动到第一个位置
            tween(this.holes[0].node)
                .to(0.2, { position: this.firstHolePos })
                .start();
        }
    }

    checkHoleMatch(headPos: Vec2, enterThreshold: number): Hole | null {
        const activeHole = this.activeHole;
        if (!activeHole) return null;

        const holeWorldPos = activeHole.node.position;
        const dist = Vec2.distance(headPos, new Vec2(holeWorldPos.x, holeWorldPos.y));

        if (dist < enterThreshold) {
            return activeHole;
        }
        return null;
    }
}
