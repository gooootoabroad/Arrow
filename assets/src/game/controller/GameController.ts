import { _decorator, Color, Component, Node, Vec3, Graphics, Vec2, Sprite, Prefab, EventTouch, UITransform, instantiate, resources, JsonAsset } from 'cc';
import { LevelMapConfig, ArrowSpawnConfig } from '../config/LevelConfig';
import { Arrow } from '../entity/Arrow';
import { HoleGroup } from '../entity/HoleGroup';
import { GameConfig } from '../../global/GameConfig';
import { LoadMgr } from '../../manager/LoadMgr';
import { Bundle } from '../../global/bundle';
import { GameRuntime } from '../runtime/gameRuntime';
import { PathManager } from '../manager/PathManager';
import { ColorPoolManager } from '../manager/ColorPoolManager';
import { GPlatform } from '../../platform/platform';
import { getLevelInfo, getLevelJsonFileName } from '../levels/levelInfo';
import { Core } from '../../global/Core';
import { GameMenuMgr } from '../manager/GameMenuMgr';
import { LevelManager } from '../manager/LevelManager';
import { BlockInputEvents } from 'cc';

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

    @property(Prefab)
    private holeGroupPrefab: Prefab = null;

    @property(Prefab)
    private topViewPrefab: Prefab = null;

    @property(Node)
    private inputBlockNode: Node = null;

    private levelJsonPath: string = 'levels/level_2';

    private _levelConfig: LevelMapConfig = null;
    private _arrows: Arrow[] = [];
    private _pathGraphics: Graphics = null;
    private _arrowGraphics: Graphics = null;
    private _mapRoot: Node = null;

    private _topNode: Node = null;
    private _topNodeScript: LevelManager = null;

    protected onLoad(): void {
        if (this.pathVisual) {
            this._pathGraphics = this.pathVisual.getComponent(Graphics);
            if (!this._pathGraphics) {
                this._pathGraphics = this.pathVisual.addComponent(Graphics);
            }
        }

        this.node.on(Node.EventType.TOUCH_START, this.onClick, this);
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onClick, this);
    }

    public startGame() {
        console.log("core level ", Core.userInfo.level);
        let levelJsonFile = `levels/${getLevelJsonFileName(2)}`;
        this.loadLevel(levelJsonFile);
    }

    public clear() {
        // 清空路径图案
        this._pathGraphics.clear();
        // 清空所有洞组
        const holeChildrens = this.holeRoot.children.slice();
        holeChildrens.forEach(child => {
            child.removeFromParent(); // 立即从父节点断开
            child.destroy();          // 标记销毁
        });
        // 清空所有箭头
        const arrowChildrens = this.arrowRoot.children.slice();
        arrowChildrens.forEach(child => {
            child.removeFromParent(); // 立即从父节点断开
            child.destroy();          // 标记销毁
        });

        this._topNode?.destroy();
        this._topNodeScript = null;
    }

    public revive() {
        GameRuntime.pause = false;
        this._topNodeScript.init(10);
        this.schedule(this._arrowTick, 0.05);
        this.inputBlockNode.getComponent(BlockInputEvents).enabled = false;
    }

    private loadLevel(path: string) {
        resources.load(path, JsonAsset, (err, asset) => {
            if (err) {
                console.error(`Failed to load level: ${path}`, err);
                return;
            }
            this.inputBlockNode.getComponent(BlockInputEvents).enabled = true;
            this._levelConfig = asset.json as LevelMapConfig;
            this.initRuntime();
            this._initPath();
            //this._randomizeArrowDirections();
            //this._initMap();
            this._initHolesFromConfig();
            this._initArrowGraphics();
            this._initArrowsFromConfig();
            GameMenuMgr.init();
            //this._arrowTick();
            this.schedule(this._arrowTick, 0.05);
            this.generateTopView();
            this.inputBlockNode.getComponent(BlockInputEvents).enabled = false;
        });
    }

    private generateTopView() {
        this._topNode = instantiate(this.topViewPrefab);
        this.node.addChild(this._topNode);
        this._topNodeScript = this._topNode.getComponent(LevelManager);
        this._topNodeScript.init(this._levelConfig.maxMoves);
    }

    private initRuntime() {
        GameRuntime.holeGroups = [];
        GameRuntime.totalArrow = this._levelConfig.arrows.length;
        GameRuntime.finishedArrow = 0;
        GameRuntime.levelInfo = getLevelInfo(this._levelConfig.levelId);
        GameRuntime.pause = false;
        // let info: Map<string, number> = new Map();
        // for (const arrow of this._levelConfig.arrows) {
        //     if (info.get(arrow.colorType)) {
        //         let count = info.get(arrow.colorType);
        //         info.set(arrow.colorType, count + 1);
        //     } else {
        //         info.set(arrow.colorType, 1);
        //     }
        // }

        // console.log("arrow info ", info);
        ColorPoolManager.initColorPool(this._levelConfig.colorPool || {}, this._levelConfig.enableRainbow ?? false);
    }

    // private _randomizeArrowDirections() {
    //     if (!this._levelConfig.arrows) return;
    //     for (const arrow of this._levelConfig.arrows) {
    //         if (Math.random() < 0.5) {
    //             const { startPos, offsetCoords } = arrow;
    //             const newStart = offsetCoords[offsetCoords.length - 1];
    //             const newOffsets = [...offsetCoords.slice(0, -1).reverse(), startPos];
    //             arrow.startPos = newStart;
    //             arrow.offsetCoords = newOffsets;
    //         }
    //         const sx = arrow.startPos[0], sy = arrow.startPos[1];
    //         const ox = arrow.offsetCoords[0][0], oy = arrow.offsetCoords[0][1];
    //         if (sx === ox) {
    //             arrow.direction = sy > oy ? ArrowDirection.UP : ArrowDirection.DOWN;
    //         } else {
    //             arrow.direction = sx > ox ? ArrowDirection.RIGHT : ArrowDirection.LEFT;
    //         }
    //     }
    // }

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
        const points = this._levelConfig.path.pathPoints.map(p => new Vec2(p[0], p[1]));
        PathManager.instance.reset();
        PathManager.instance.init(points);

        this._drawPath();
    }

    private _drawPath(): void {
        if (!this._pathGraphics || PathManager.instance.pathPoints.length < 2) return;

        const g = this._pathGraphics;
        g.clear();
        g.lineWidth = GameConfig.pathWidth;
        g.strokeColor = new Color().fromHEX('#ADADAD');
        g.lineCap = Graphics.LineCap.ROUND;
        g.lineJoin = Graphics.LineJoin.ROUND;

        const gapRatio = 0.3;
        const pts = PathManager.instance.pathPoints;

        for (let i = 0; i < pts.length; i++) {
            const p1 = pts[i];
            const p2 = pts[(i + 1) % pts.length];

            const x1 = p1.x * GameConfig.UNIT_SIZE;
            const y1 = p1.y * GameConfig.UNIT_SIZE;
            const x2 = p2.x * GameConfig.UNIT_SIZE;
            const y2 = p2.y * GameConfig.UNIT_SIZE;

            const dx = x2 - x1;
            const dy = y2 - y1;

            g.moveTo(x1 + dx * gapRatio, y1 + dy * gapRatio);
            g.lineTo(x2 - dx * gapRatio, y2 - dy * gapRatio);
            g.stroke();
        }
    }

    private _initArrowGraphics() {
        this._arrowGraphics = this.arrowRoot.getComponent(Graphics);
        if (!this._arrowGraphics) {
            this._arrowGraphics = this.arrowRoot.addComponent(Graphics);
        }

        this._arrowGraphics.lineWidth = GameConfig.arrowLineWidth;
        this._arrowGraphics.lineJoin = Graphics.LineJoin.ROUND;
        this._arrowGraphics.lineCap = Graphics.LineCap.ROUND;
    }

    private _initHolesFromConfig(): void {
        if (!this.holeRoot || !this._levelConfig.holes) return;

        for (const config of this._levelConfig.holes) {
            const group = instantiate(this.holeGroupPrefab);
            group.name = `HoleGroup_${config.id}`;
            this.holeRoot.addChild(group);
            const script = group.getComponent(HoleGroup);
            script.init(config);
            GameRuntime.holeGroups.push(script);
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

    private _arrowTick() {
        if (GameRuntime.pause) {
            this.unschedule(this._arrowTick);
            this.inputBlockNode.getComponent(BlockInputEvents).enabled = true;
            return;
        }

        for (let arrow of this._arrows) {
            arrow.tick();
        }

        this._arrowGraphics.clear();
        for (let arrow of this._arrows) {
            arrow.drawTo(this._arrowGraphics);
        }

        if (GameRuntime.finishedArrow == GameRuntime.totalArrow) {
            GameMenuMgr.showSuccessMenu();
            this.inputBlockNode.getComponent(BlockInputEvents).enabled = true;
            this.unschedule(this._arrowTick);
        }

        if (PathManager.instance.isPathNearlyFull()) {
            GameMenuMgr.showFailedMenu();
            this.inputBlockNode.getComponent(BlockInputEvents).enabled = true;
            this.unschedule(this._arrowTick);
        }
    }

    private onClick(e: EventTouch) {
        let worldPos = e.getUILocation();
        let localPos = this.arrowRoot.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));
        for (const arrow of this._arrows) {
            if (arrow.hitTest(new Vec2(localPos.x, localPos.y))) {
                GPlatform.vibrateShort();
                this._topNodeScript.costOneStep();
                arrow.startMoving();
                break;
            }
        }
    }
}
