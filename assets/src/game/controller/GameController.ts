import { _decorator, Color, Component, Node, Vec3, Graphics, Vec2, Sprite, Prefab, EventTouch, UITransform, instantiate } from 'cc';
import { LevelMapConfig, ArrowSpawnConfig } from '../config/LevelConfig';
import { Level1 } from '../levels/Level1';
import { Arrow } from '../entity/Arrow';
import { HoleGroup } from '../entity/HoleGroup';
import { GameConfig } from '../../global/GameConfig';
import { LoadMgr } from '../../manager/LoadMgr';
import { Bundle } from '../../global/bundle';
import { GameRuntime } from '../runtime/gameRuntime';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Node)
    pathVisual: Node = null;

    @property(Node)
    arrowRoot: Node = null;

    @property(Node)
    holeRoot: Node = null;

    @property(Prefab)
    private arrowPrefab: Prefab = null;

    private _levelConfig: LevelMapConfig = null;
    private _arrows: Arrow[] = [];
    private _pathGraphics: Graphics = null;
    private _mapRoot: Node = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }

    protected start(): void {
        this._levelConfig = Level1;
        this.initRuntime();
        this._initMap();
        this._initPath();
        this._initHolesFromConfig();
        this._initArrowsFromConfig();
    }

    private initRuntime() {
        GameRuntime.holeGroups = [];
        GameRuntime.initLevelPathPoints(this._levelConfig.path.pathPoints);
    }

    private _initMap() {
        this._mapRoot = new Node('MapRoot');
        this._mapRoot.setParent(this.node);

        const gridSize = GameConfig.UNIT_SIZE;
        const mapSize = 720;
        const halfMap = mapSize / 2;
        const cols = Math.floor(mapSize / gridSize);
        const rows = Math.floor(mapSize / gridSize);

        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                const dotNode = new Node(`Dot_${i}_${j}`);
                dotNode.setParent(this._mapRoot);

                const x = -halfMap + i * gridSize;
                const y = -halfMap + j * gridSize;
                dotNode.setPosition(new Vec3(x, y, 0));

                const sprite = dotNode.addComponent(Sprite);
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;

                const uiTransform = dotNode.getComponent(UITransform);
                uiTransform.setContentSize(8, 8);

                LoadMgr.loadSprite(Bundle.game, 'texture/white1', sprite);
                if (x == 0 || y == 0) {
                    sprite.color = new Color().fromHEX('#FF0000');
                }
            }
        }
    }

    private _initPath(): void {
        if (this.pathVisual) {
            this._pathGraphics = this.pathVisual.getComponent(Graphics);
            if (!this._pathGraphics) {
                this._pathGraphics = this.pathVisual.addComponent(Graphics);
            }
        }

        this._drawPath();
    }

    private _drawPath(): void {
        if (!this._pathGraphics || GameRuntime.levelPathPoints.length < 2) return;

        const g = this._pathGraphics;
        g.clear();
        g.lineWidth = this._levelConfig.path.pathWidth;
        g.strokeColor = new Color(80, 80, 80, 255);
        g.lineCap = Graphics.LineCap.ROUND;
        g.lineJoin = Graphics.LineJoin.ROUND;

        g.moveTo(GameRuntime.levelPathPoints[0].x, GameRuntime.levelPathPoints[0].y);
        for (let i = 1; i < GameRuntime.levelPathPoints.length; i++) {
            g.lineTo(GameRuntime.levelPathPoints[i].x, GameRuntime.levelPathPoints[i].y);
        }
        g.lineTo(GameRuntime.levelPathPoints[0].x, GameRuntime.levelPathPoints[0].y);
        g.stroke();
    }

    private _initHolesFromConfig(): void {
        if (!this.holeRoot || !this._levelConfig.holes) return;

        for (const config of this._levelConfig.holes) {
            const group = new HoleGroup();
            group.init(config, this.holeRoot);
            GameRuntime.holeGroups.push(group);
        }
    }

    private _initArrowsFromConfig(): void {
        if (!this.arrowRoot || !this._levelConfig.arrows) return;

        for (const config of this._levelConfig.arrows) {
            this._createArrowFromConfig(config);
        }
    }

    private _createArrowFromConfig(config: ArrowSpawnConfig): void {
        const arrowNode = instantiate(this.arrowPrefab);
        this.arrowRoot.addChild(arrowNode);
        arrowNode.name = `Arrow_${config.id}`;
        arrowNode.setPosition(Vec3.ZERO);
        const arrowComp = arrowNode.getComponent(Arrow);
        arrowComp.init(config);
        arrowComp.setOnDestroyed(() => {
            const index = this._arrows.indexOf(arrowComp);
            if (index >= 0) this._arrows.splice(index, 1);
        });
        this._arrows.push(arrowComp);
    }

    private onClick(e: EventTouch) {
        let worldPos = e.getUILocation();
        let localPos = this.arrowRoot.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));
        for (const arrow of this._arrows) {
            if (arrow.hitTest(new Vec2(localPos.x, localPos.y))) {
                arrow.startMoving();
                break;
            }
        }
    }
}
