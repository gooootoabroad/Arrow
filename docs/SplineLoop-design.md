# Spline Loop 技术设计文档

> 游戏类型：颜色路径解谜游戏
> 引擎：Cocos Creator 3.8.8
> 目标平台：微信/抖音/支付宝小游戏

---

## 1. 游戏概述

### 1.1 核心玩法

玩家通过绘制路径，引导彩色箭头穿过扭曲的 Spline 回路，将箭头匹配到正确颜色的终点点孔。

- **Easy to learn, hard to master**
- **目标**：所有箭头进入对应颜色的终孔
- **操作**：拖拽/绘制路径，箭头自动沿线移动

### 1.2 词汇表

| 术语 | 定义 |
|------|------|
| Arrow (箭头) | 带颜色的可移动实体 |
| Spline Path (样条路径) | 贝塞尔曲线路径 |
| Hole (终孔) | 终点的颜色匹配洞口 |
| Portal (传送门) | 中转点或机关 |
| Color Match (颜色匹配) | 箭头颜色 = 终孔颜色 |

---

## 2. 系统架构

### 2.1 模块划分

```
assets/src/
├── game/                   # 游戏核心逻辑
│   ├── entity/
│   │   ├── Arrow.ts        # 箭头实体
│   │   ├── Hole.ts         # 终孔实体
│   │   └── Portal.ts       # 传送门实体
│   ├── path/
│   │   ├── SplinePath.ts   # 样条路径
│   │   ├── PathPoint.ts    # 路径节点
│   │   └── PathRenderer.ts # 路径渲染
│   ├── level/
│   │   ├── Level.ts        # 关卡控制器
│   │   └── LevelData.ts    # 关卡数据
│   ├── controller/
│   │   ├── GameController.ts    # 游戏主控
│   │   ├── InputController.ts   # 输入控制器
│   │   └── LevelSelect.ts       # 关卡选择
│   └── core/
│       ├── GameManager.ts       # 游戏管理器
│       └── LevelManager.ts      # 关卡管理器
│
├── ui/                     # 界面
│   ├── menu/
│   │   └── MainMenu.ts     # 主菜单
│   ├── game/
│   │   ├── GameHUD.ts      # 游戏HUD
│   │   └── LevelTip.ts     # 关卡提示
│   └── level/
│       └── LevelSelect.ts  # 关卡选择
│
├── data/                   # 数据层
│   ├── LevelData.ts        # 关卡配置格式
│   └── GameData.ts         # 游戏进度数据
│
└── effect/                 # 特效
    ├── ParticleEffect.ts   # 粒子特效
    └── TrailEffect.ts      # 拖尾特效
```

### 2.2 类图

```
┌─────────────────────────────────────────────────────────────┐
│                        GameManager                           │
│  (Singleton - 游戏整体状态管理)                                │
├─────────────────────────────────────────────────────────────┤
│  - currentState: GameState                                   │
│  - score: number                                             │
│  + init(), startGame(), pause(), resume(), gameOver()       │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ LevelManager  │   │GameController │   │ InputController│
│ (关卡管理)     │   │  (游戏逻辑)    │   │   (输入处理)   │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ - levels: []  │   │ - arrows: []  │   │ - touchX/Y    │
│ + loadLevel() │   │ + checkWin()  │   │ + onTouchBegan│
│ + nextLevel() │   │ + moveArrows()│   │ + onTouchMove │
└───────────────┘   └───────┬───────┘   └───────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │  Arrow   │    │   Hole   │    │ SplinePath│
     │ (箭头)   │    │  (终孔)  │    │ (样条路径)│
     ├──────────┤    ├──────────┤    ├──────────┤
     │- color   │    │- color   │    │- points[]│
     │- speed   │    │- position│    │+ getPoint│
     │+ move()  │    │+ match() │    │+ render()│
     └──────────┘    └──────────┘    └──────────┘
```

---

## 3. 核心系统设计

### 3.1 箭头系统 (Arrow)

```typescript
import { _decorator, Component, Color, Sprite, tween, Vec3 } from 'cc';

export enum ArrowColor {
    RED = '#FF4444',
    BLUE = '#4444FF',
    GREEN = '#44FF44',
    YELLOW = '#FFFF44',
    PURPLE = '#FF44FF',
}

@ccclass('Arrow')
export class Arrow extends Component {
    @property(Color)
    color: Color = Color.RED;

    @property(Number)
    speed: number = 200; // 像素/秒

    private _pathIndex: number = 0;
    private _running: boolean = false;
    private _pathPoints: Vec3[] = [];

    /** 开始沿路径移动 */
    startMove(pathPoints: Vec3[], onComplete?: () => void) {
        this._pathPoints = pathPoints;
        this._running = true;
        this._pathIndex = 0;

        this._runPath(onComplete);
    }

    private _runPath(onComplete?: () => void) {
        if (!this._running || this._pathIndex >= this._pathPoints.length) {
            onComplete?.();
            return;
        }

        const targetPos = this._pathPoints[this._pathIndex];
        const distance = Vec3.distance(this.node.position, targetPos);
        const duration = distance / this.speed;

        tween(this.node)
            .to(duration, { position: targetPos }, { easing: 'linear' })
            .call(() => {
                this._pathIndex++;
                this._runPath(onComplete);
            })
            .start();
    }

    /** 停止移动 */
    stopMove() {
        this._running = false;
        tween(this.node).stop();
    }

    /** 获取当前位置在路径上的百分比 */
    getProgress(): number {
        return this._pathIndex / this._pathPoints.length;
    }
}
```

### 3.2 终孔系统 (Hole)

```typescript
import { _decorator, Component, Color, CircleCollider2D, Sprite } from 'cc';
import { ArrowColor } from './Arrow';

@ccclass('Hole')
export class Hole extends Component {
    @property(Color)
    expectColor: Color = Color.RED;

    @property(Number)
    radius: number = 30;

    /** 箭头是否进入终孔 */
    isArrowInside(arrowNode: Node): boolean {
        const pos1 = this.node.position;
        const pos2 = arrowNode.position;
        const distance = Vec3.distance(pos1, pos2);
        return distance < this.radius;
    }

    /** 检查颜色是否匹配 */
    checkColorMatch(arrowColor: Color): boolean {
        return arrowColor.equals(this.expectColor);
    }
}
```

### 3.3 样条路径系统 (SplinePath)

```typescript
import { _decorator, Component, Graphics, Vec3 } from 'cc';

/**
 * 三次贝塞尔曲线工具类
 */
export class BezierUtils {
    /**
     * 获取三次贝塞尔曲线上的点
     * @param t 0-1 之间的值
     * @param p0 起点
     * @param p1 控制点1
     * @param p2 控制点2
     * @param p3 终点
     */
    static getCubicBezierPoint(t: number, p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3): Vec3 {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;

        const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
        const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
        const z = uuu * p0.z + 3 * uu * t * p1.z + 3 * u * tt * p2.z + ttt * p3.z;

        return new Vec3(x, y, z);
    }
}

@ccclass('SplinePath')
export class SplinePath extends Component {
    @property(Graphics)
    graphics: Graphics = null;

    /** 路径控制点 */
    private _controlPoints: Vec3[] = [];

    /** 采样点数量 */
    private _sampleCount: number = 50;

    /** 缓存的采样点 */
    private _cachedPoints: Vec3[] = [];

    setControlPoints(points: Vec3[]) {
        this._controlPoints = points;
        this._updateCache();
        this.render();
    }

    addControlPoint(point: Vec3) {
        this._controlPoints.push(point);
        this._updateCache();
        this.render();
    }

    clear() {
        this._controlPoints = [];
        this._cachedPoints = [];
        this.graphics?.clear();
    }

    /** 获取采样点 */
    getSamplePoints(): Vec3[] {
        return this._cachedPoints;
    }

    /** 根据获取最近的采样点 */
    getNearestPoint(position: Vec3): Vec3 | null {
        let nearest: Vec3 = null;
        let minDist = Infinity;

        for (const point of this._cachedPoints) {
            const dist = Vec3.distance(position, point);
            if (dist < minDist) {
                minDist = dist;
                nearest = point;
            }
        }

        return nearest;
    }

    /** 预计算所有采样点 */
    private _updateCache() {
        this._cachedPoints = [];

        if (this._controlPoints.length < 2) return;

        // 分段处理，每段用贝塞尔曲线
        for (let i = 0; i < this._controlPoints.length - 1; i += 3) {
            if (i + 3 > this._controlPoints.length) {
                // 不足4个点，用线性插值
                const remaining = this._controlPoints.length - i;
                for (let j = 0; j < remaining; j++) {
                    this._cachedPoints.push(this._controlPoints[i + j].clone());
                }
                break;
            }

            const p0 = this._controlPoints[i];
            const p1 = this._controlPoints[i + 1];
            const p2 = this._controlPoints[i + 2];
            const p3 = this._controlPoints[i + 3];

            // 每段采样
            const segmentCount = Math.floor(this._sampleCount / 3);
            for (let t = 0; t <= 1; t += 1 / segmentCount) {
                this._cachedPoints.push(BezierUtils.getCubicBezierPoint(t, p0, p1, p2, p3));
            }
        }
    }

    /** 渲染路径 */
    render() {
        if (!this.graphics) return;
        this.graphics.clear();

        if (this._controlPoints.length < 2) return;

        this.graphics.moveTo(this._controlPoints[0].x, this._controlPoints[0].y);

        for (let i = 0; i < this._controlPoints.length - 1; i += 3) {
            if (i + 3 > this._controlPoints.length) {
                for (let j = 1; j < this._controlPoints.length - i; j++) {
                    this.graphics.lineTo(
                        this._controlPoints[i + j].x,
                        this._controlPoints[i + j].y
                    );
                }
                break;
            }

            this.graphics.bezierCurveTo(
                this._controlPoints[i + 1].x, this._controlPoints[i + 1].y,
                this._controlPoints[i + 2].x, this._controlPoints[i + 2].y,
                this._controlPoints[i + 3].x, this._controlPoints[i + 3].y
            );
        }

        this.graphics.stroke();
    }
}
```

### 3.4 输入控制器 (InputController)

```typescript
import { _decorator, Component, Node, Touch, EventTouch, Vec3, graphics } from 'cc';
import { SplinePath } from '../path/SplinePath';

@ccclass('InputController')
export class InputController extends Component {
    @property(Node)
    pathNode: Node = null;

    private _splinePath: SplinePath = null;
    private _isDrawing: boolean = false;
    private _lastPoint: Vec3 = null;

    protected onLoad(): void {
        this._splinePath = this.pathNode.getComponent(SplinePath);
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this._onTouchBegan, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        this.node.on(Node.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.on(Node.EventType.TOUCH_CANCELLED, this._onTouchCancelled, this);
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this._onTouchBegan, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        this.node.off(Node.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.off(Node.EventType.TOUCH_CANCELLED, this._onTouchCancelled, this);
    }

    private _onTouchBegan(event: EventTouch) {
        this._isDrawing = true;
        this._splinePath.clear();

        const pos = this._getWorldPosition(event);
        this._splinePath.addControlPoint(pos);
        this._lastPoint = pos;
    }

    private _onTouchMoved(event: EventTouch) {
        if (!this._isDrawing) return;

        const pos = this._getWorldPosition(event);

        // 距离太近不记录
        if (this._lastPoint && Vec3.distance(pos, this._lastPoint) < 20) return;

        this._splinePath.addControlPoint(pos);
        this._lastPoint = pos;
    }

    private _onTouchEnded(event: EventTouch) {
        this._isDrawing = false;
        // 通知 GameController 路径绘制完成
        this.node.emit('PathDrawn', this._splinePath.getSamplePoints());
    }

    private _onTouchCancelled(event: EventTouch) {
        this._isDrawing = false;
    }

    private _getWorldPosition(event: EventTouch): Vec3 {
        const touch = event.touch;
        return touch.getLocation().toVec3();
    }
}
```

---

## 4. 关卡数据结构

### 4.0 步数系统 (Moves)

#### 公式

```
maxMoves = arrowCount + tolerance
tolerance = max(5, ceil(arrowCount × 0.15))
```

- 每次点击箭头启动 → 消耗 1 步
- 箭头进洞 → 不返还步数
- 步数归零 → 游戏失败
- 剩余步数 = maxMoves - 已点击次数

#### 数值参考

| 箭头数 | 容错值 | 总步数 | 允许错误率 |
|-------|-------|-------|----------|
| 10    | 5     | 15    | 33%      |
| 20    | 5     | 25    | 20%      |
| 30    | 5     | 35    | 14%      |
| 50    | 8     | 58    | 14%      |
| 100   | 15    | 115   | 13%      |

#### 设计原则

- 保底 5 次容错：短关卡不至于开局即死
- 15% 错误率：思考型游戏甜点，既给压力又不焦虑
- 关卡 JSON 中直接存 `maxMoves`，编辑器按公式自动生成，支持手动微调

### 4.1 关卡 JSON 格式

```json
{
    "id": 1,
    "name": "Level 1 - Introduction",
    "difficulty": "easy",
    "arrows": [
        {
            "id": "arrow_1",
            "color": "RED",
            "startPosition": { "x": 100, "y": 300 }
        },
        {
            "id": "arrow_2",
            "color": "BLUE",
            "startPosition": { "x": 100, "y": 400 }
        }
    ],
    "holes": [
        {
            "id": "hole_1",
            "color": "RED",
            "position": { "x": 500, "y": 300 },
            "radius": 30
        },
        {
            "id": "hole_2",
            "color": "BLUE",
            "position": { "x": 500, "y": 400 },
            "radius": 30
        }
    ],
    "paths": [
        {
            "id": "path_1",
            "controlPoints": [
                { "x": 150, "y": 300 },
                { "x": 200, "y": 250 },
                { "x": 250, "y": 350 },
                { "x": 300, "y": 300 },
                { "x": 350, "y": 250 },
                { "x": 400, "y": 350 },
                { "x": 450, "y": 300 },
                { "x": 480, "y": 300 }
            ]
        }
    ],
    "portals": [],
    "timeLimit": 0,
    "starConditions": {
        "1": { "moves": 3 },
        "2": { "moves": 2 },
        "3": { "moves": 1 }
    }
}
```

### 4.2 加载关卡

```typescript
import { JsonAsset, resources } from 'cc';

interface ArrowData {
    id: string;
    color: ArrowColor;
    startPosition: { x: number; y: number };
}

interface HoleData {
    id: string;
    color: ArrowColor;
    position: { x: number; y: number };
    radius: number;
}

interface PathData {
    id: string;
    controlPoints: { x: number; y: number }[];
}

interface LevelData {
    id: number;
    name: string;
    difficulty: 'easy' | 'medium' | 'hard';
    arrows: ArrowData[];
    holes: HoleData[];
    paths: PathData[];
    timeLimit: number;
    starConditions: {
        1: { moves: number };
        2: { moves: number };
        3: { moves: number };
    };
}

@ccclass('LevelLoader')
export class LevelLoader extends Component {
    static loadLevel(levelId: number): Promise<LevelData> {
        return new Promise((resolve, reject) => {
            resources.load(`levels/level_${levelId}`, JsonAsset, (err, asset) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(asset.json as LevelData);
            });
        });
    }
}
```

---

## 5. 游戏流程

### 5.1 状态机

```
┌─────────────┐
│   Start     │ ──▶ [点击开始]
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Loading    │ ──▶ [资源加载完成]
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Playing     │ ──▶ [胜利/失败/暂停]
│             │     │
│  ┌─────────┐│     ▼
│  │Drawing  ││  ┌─────────────┐
│  │Moving   ││  │   Paused    │
│  │Matching ││  └──────┬──────┘
│  └─────────┘│         │
└──────┬──────┘         ▼
       │           ┌─────────────┐
       ▼           │  Resume     │
┌─────────────┐    └─────────────┘
│ LevelComplete│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Result    │ ──▶ [下一关/重试/菜单]
└─────────────┘
```

### 5.2 胜利判定

```typescript
class GameController {
    private _arrows: Arrow[] = [];
    private _holes: Hole[] = [];

    /** 检查胜利条件 */
    checkWinCondition(): boolean {
        for (const arrow of this._arrows) {
            let matched = false;

            for (const hole of this._holes) {
                // 位置检测 + 颜色匹配
                if (hole.isArrowInside(arrow.node) &&
                    hole.checkColorMatch(arrow.color)) {
                    matched = true;
                    break;
                }
            }

            if (!matched) return false;
        }

        return true;
    }

    /** 检查部分匹配（用于显示） */
    getMatchedCount(): number {
        let count = 0;
        for (const arrow of this._arrows) {
            for (const hole of this._holes) {
                if (hole.isArrowInside(arrow.node) &&
                    hole.checkColorMatch(arrow.color)) {
                    count++;
                    break;
                }
            }
        }
        return count;
    }
}
```

---

## 6. 资源规范

### 6.1 预制体命名

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 箭头 | Arrow_Color | Arrow_RED, Arrow_BLUE |
| 终孔 | Hole_Color | Hole_RED, Hole_BLUE |
| 路径显示 | PathRenderer | PathRenderer |
| UI 面板 | Panel_Name | Panel_LevelSelect |

### 6.2 Bundle 划分

```
Bundle:
├── game        # 游戏核心 Prefab
├── ui          # UI 资源
├── level       # 关卡配置 JSON
├── effect      # 特效资源
└── audio       # 音效/音乐
```

### 6.3 资源加载

```typescript
// 使用现有的 LoadMgr
import { LoadMgr } from '../manager/LoadMgr';
import { Bundle } from '../global/bundle';

// 加载箭头预制体
const arrowPrefab = await LoadMgr.loadFile(Bundle.game, 'prefabs/Arrow_RED', Prefab);

// 加载关卡配置
const levelData = await LoadMgr.loadFile(Bundle.level, `level_${id}`, JsonAsset);
```

---

## 7. 性能优化

### 7.1 对象池

```typescript
// 使用现有 NodePoolMgr
import { NodePoolMgr } from '../manager/NodePoolMgr';

// 箭头池
const arrowPool = NodePoolMgr.getPool('Arrow');

// 获取
const arrow = arrowPool.get();
// 回收
arrowPool.put(arrow);
```

### 7.2 渲染优化

- **DrawCall 合并**：使用 Dynamic Atlas
- **路径渲染**：只在绘制时渲染，完成后转 Sprite
- **物理检测**：使用简单的 AABB，不启用完整物理引擎

---

## 8. 后续功能

### 8.1 Phase 2 功能

- [ ] 多段 Spline 曲线连接
- [ ] 传送门机关（颜色转换/路径跳转）
- [ ] 障碍物（阻挡箭头）

### 8.2 Phase 3 功能

- [ ] 关卡编辑器
- [ ] 60+ 关卡设计
- [ ] 教程系统
- [ ] 收集系统（星星）

### 8.3 Phase 4 功能

- [ ] 社交分享（炫耀通关）
- [ ] 每日挑战
- [ ] 商店/道具系统
- [ ] 多人对战

---

## 9. 快速参考

### 常用代码片段

```typescript
// 创建箭头
const arrow = instantiate(arrowPrefab);
arrow.parent = gameNode;
arrow.setPosition(startPos);

// 获取路径采样点
const pathPoints = splinePath.getSamplePoints();

// 箭头沿线移动
arrow.startMove(pathPoints);

// 碰撞检测
if (hole.isArrowInside(arrow.node)) {
    // 进入终孔
}
```

---

*Last Updated: 2026-03-30*
*Author: Arrow Team*