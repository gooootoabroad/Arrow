# Spline Loop 游戏设计规格书

> 项目：Arrow 小游戏  
> 日期：2026-03-30  
> 引擎：Cocos Creator 3.8.8  
> 目标平台：微信/抖音/支付宝小游戏

---

## 1. 游戏概述

### 1.1 游戏类型

类似 **Spline Loop** 的颜色路径解谜游戏。

### 1.2 核心玩法

```
┌─────────────────────────────────────────┐
│              🍩 环形路径（环内）           │
│            ← ← ← ← ← ← ← ← ←             │
│         (箭头顺时针方向奔跑)              │
│                                        │
│   🕳️孔(红色) ←←←←←←←←←← 🕳️孔(蓝色)      │
│                                        │
│   ● 🔴  ● 🔵  ● 🟢    (箭头分散在环内)   │
│                                        │
│   起点附近          分散位置            │
│                                        │
│   点击箭头 → 它顺时针跑 → 遇到同色孔进入 │
└─────────────────────────────────────────┘
```

### 1.3 核心规则

| 规则 | 描述 |
|------|------|
| **移动触发** | 玩家点击箭头，箭头开始顺时针奔跑 |
| **颜色匹配** | 遇到同色孔 → 箭头进入孔洞消失 |
| **颜色不匹配** | 遇到不同色孔 → 继续绕圈跑 |
| **失败条件** | 环内位置满了（无空位）→ 游戏失败 |
| **胜利条件** | 所有箭头进入对应颜色的孔洞 → 游戏胜利 |

---

## 2. 设计方案

### 2.1 方案选择：预制体方案（方案一）

**每个关卡是一个预制体** `Level_X`

预制体包含：
- 环形路径 Sprite（图层在底层）
- 多个孔洞（分布在环形路径上）
- 多个箭头初始位置（分散在环内）

**优点**：
- Cocos 设计器可直接在 Editor 中画图形，所见即所得
- 灵活多变，路径形状随意设计
- 方便做视觉特效

---

## 3. 系统架构

### 3.1 模块划分

```
assets/src/
├── game/
│   ├── entity/
│   │   ├── Arrow.ts          # 箭头实体
│   │   ├── Hole.ts           # 孔洞实体
│   │   └── Level.ts          # 关卡预制体控制器
│   ├── controller/
│   │   ├── GameController.ts # 游戏主控
│   │   └── ArrowController.ts # 箭头控制器
│   └── manager/
│       └── LevelManager.ts   # 关卡管理器
│
└── ui/
    └── GameUI.ts             # 简单UI（胜利/失败提示）
```

### 3.2 核心类说明

#### Arrow（箭头）

| 属性 | 类型 | 描述 |
|------|------|------|
| `color` | `Color` | 箭头颜色 |
| `speed` | `number` | 移动速度（像素/秒）|
| `state` | `Idle \| Running \| Finished` | 状态 |

| 方法 | 描述 |
|------|------|
| `startRun()` | 开始顺时针奔跑 |
| `stopRun()` | 停止奔跑 |
| `onReachHole()` | 到达孔洞时的处理 |

#### Hole（孔洞）

| 属性 | 类型 | 描述 |
|------|------|------|
| `color` | `Color` | 期望匹配的箭头颜色 |
| `position` | `Vec3` | 孔洞位置 |

| 方法 | 描述 |
|------|------|
| `checkColorMatch(arrow: Arrow): boolean` | 检查颜色是否匹配 |

#### Level（关卡）

| 属性 | 描述 |
|------|------|
| `arrows: Arrow[]` | 所有箭头 |
| `holes: Hole[]` | 所有孔洞 |
| `pathPoints: Vec3[]` | 路径关键点（用于计算轨迹）|

| 方法 | 描述 |
|------|------|
| `init()` | 初始化关卡 |
| `checkWin(): boolean` | 检查胜利条件 |
| `checkFail(): boolean` | 检查失败条件 |

---

## 4. MVP 范围

### 4.1 第一版功能（核心可玩）

| 功能 | 描述 |
|------|------|
| ✓ 点击箭头顺时针跑 | 玩家点击箭头，箭头沿路径移动 |
| ✓ 同色孔进入 | 遇到同色孔时箭头进入并消失 |
| ✓ 不同色孔继续跑 | 遇到不同色孔继续绕圈 |
| ✓ 胜利提示 | 全部进孔后显示简单胜利 |
| ✓ 失败提示 | 环满了显示简单失败 |

### 4.2 第一版暂不包含

- 动画过渡效果
- 关卡切换
- 多关卡系统
- UI系统（先不做）
- 声音/特效（后续添加）

---

## 5. 技术实现要点

### 5.1 箭头移动实现

```typescript
// 使用 tween 实现顺时针移动
// 路径点预先配置在 Level 预制体中
tween(this.node)
    .to(duration, { position: nextPoint }, { easing: 'linear' })
    .call(() => this.moveToNextPoint())
    .start();
```

### 5.2 失败检测

```typescript
// 每次移动前检查
// 计算当前环内的箭头数量 vs 环的总容量
checkFail(): boolean {
    return this.arrowsInPath.length >= this.maxCapacity;
}
```

### 5.3 胜利检测

```typescript
// 每次箭头进孔后检查
checkWin(): boolean {
    return this.arrows.every(a => a.state === 'Finished');
}
```

---

## 6. 关卡数据结构

### 6.1 Level Prefab 结构

```
Level_X (Node)
├── PathSprite (Sprite)           # 路径图形
├── ArrowRoot (Node)              # 箭头父节点
│   ├── Arrow_1 (Sprite+Arrow)    # 箭头1
│   ├── Arrow_2 (Sprite+Arrow)    # 箭头2
│   └── ...
├── HoleRoot (Node)               # 孔洞父节点
│   ├── Hole_1 (Sprite+Hole)      # 孔洞1
│   └── ...
└── GameController (Component)    # 关卡控制器
```

### 6.2 资源命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 关卡预制体 | `Level_X` | `Level_1`, `Level_2` |
| 箭头Sprite | `Arrow_{颜色}` | `Arrow_RED`, `Arrow_BLUE` |
| 孔洞Sprite | `Hole_{颜色}` | `Hole_RED`, `Hole_BLUE` |

---

## 7. 开发顺序

### Phase 1: 基础设施
1. 创建 `Arrow` 组件脚本
2. 创建 `Hole` 组件脚本
3. 创建 `GameController` 组件脚本

### Phase 2: 核心玩法
1. 实现箭头顺时针移动
2. 实现孔洞颜色检测
3. 实现箭头进孔逻辑

### Phase 3: 胜负判定
1. 实现胜利检测与提示
2. 实现失败检测与提示

### Phase 4: 关卡扩展
1. 创建多个 Level 预制体
2. 实现关卡切换（可选）

---

## 8. 参考素材

- **Spline Loop** (App Store) - 核心玩法参考
- **Arrows & Holes** (Google Play) - 类似玩法参考

---

## 9. 注意事项

1. 路径使用预制体实现，关卡设计在 Cocos Editor 中完成
2. MVP 阶段先做 1-2 个简单关卡验证核心玩法
3. 箭头和孔洞的颜色需要统一管理（建议用枚举）
4. 移动速度需要调试到一个舒适的值（建议 100-200 像素/秒）

---

*文档创建时间：2026-03-30*
*如有疑问请联系游戏开发负责人*