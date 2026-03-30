# Arrow 项目架构文档

> 本文档用于团队成员快速理解项目结构，统一开发风格
> Cocos Creator 3.8.8 | TypeScript | 小游戏平台

---

## 1. 模块划分

```
assets/src/
├── common/          # 公共定义、类型声明
│   ├── event.ts         # 全局事件总线 (GEventTarget)
│   ├── version.ts       # 版本号管理
│   └── *.d.ts           # 平台类型声明 (wechat, byteDance, ks, my)
│
├── config/          # 游戏配置
│   └── config.ts        # 运行时配置开关
│
├── global/          # 全局核心
│   ├── Core.ts          # 核心单例 (Core.userInfo)
│   ├── IGame.ts         # 场景枚举 (SceneName)
│   ├── bundle.ts        # Bundle 资源管理
│   ├── GameConfig.ts    # 游戏配置数据
│   └── UserInfo.ts      # 用户信息 + 本地存储
│
├── controller/      # 场景控制器
│   └── RunScene.ts      # 场景切换 (Loading 过渡动画)
│
├── localstorage/    # 本地存储
│   └── SaveProp.ts      # 属性装饰器式本地存储
│
├── manager/         # 管理系统
│   ├── LoadMgr.ts       # 资源加载 (Bundle/Scene/Prefab/SpriteFrame)
│   ├── UIMgr.ts         # UI 层级管理 (Dialog/Top/Persist)
│   ├── AudioMgr.ts      # 音频管理 (背景音/音效)
│   └── NodePoolMgr.ts   # 对象池管理
│
├── platform/        # 平台抽象层
│   ├── platform.ts      # 平台初始化 (根据 sys.platform 分发)
│   ├── base.ts          # PlatformBase 接口定义
│   ├── core.ts          # 平台核心
│   └── weChat.ts / byteDance.ts / aliplay.ts / taobao.ts / test.ts  # 各平台实现
│
├── scene/           # 场景入口
│   └── startScene.ts    # 启动场景 + 资源预加载
│
├── components/      # 通用组件
│   ├── UISprite.ts      # 动态 Sprite
│   ├── Controller.ts    # 控制器基类
│   └── TopController.ts # 顶层控制器
│
└── utils/           # 工具函数
    ├── resources.ts     # 资源加载工具 (大部分注释)
    ├── tweenManager.ts  # 动画管理
    ├── lock.ts          # 锁机制
    ├── show.ts          # 显示控制
    ├── extension-cc.ts  # Cocos 扩展
    └── ...
```

---

## 2. 核心依赖关系

### 2.1 启动链路

```
main 场景 (startScene)
    │
    ├── _loadBundle()        → LoadMgr.loadBundle()
    │   ├── Bundle.font     → 字体资源
    │   ├── Bundle.runScene → prefabs/Loading
    │   ├── Bundle.audio    → 音效资源
    │   ├── Bundle.game     → 游戏资源
    │   └── Bundle.mainCanvas → 主 Canvas 资源
    │
    ├── loadRes()            → LoadMgr.loadDir2() 批量预加载
    │
    ├── _initPlatform()      → GPlatform.initVideoAdAsync()
    │
    └── _nextScene()
            └── RunScene.show() → director.loadScene()
```

### 2.2 Bundle 管理

```typescript
// global/bundle.ts
export class Bundle {
    static font: AssetManager.Bundle;
    static audio: AssetManager.Bundle;
    static game: AssetManager.Bundle;
    static mainCanvas: AssetManager.Bundle;
    static runScene: AssetManager.Bundle;
}

// 资源获取
Bundle.get(bundle, path, type)
```

**Bundle 枚举**:
- `BundleName.Game` - 游戏主资源
- `BundleName.MainCanvas` - 主 Canvas
- `BundleName.Audio` - 音效
- `BundleName.Font` - 字体
- `BundleName.RunScene` - 场景切换 Loading

### 2.3 平台抽象

```typescript
// platform/platform.ts
export const GPlatform = initPlatform();

// PlatformBase 接口
- getRegistrationInformation()    // 备案信息
- initVideoAdAsync()              // 视频广告
- showVideoAd()                   // 显示视频广告
- showInterstitialAd()            // 插屏广告
- enableShare() / shareToFriend() // 分享
- vibrateShort() / vibrateLong()  // 震动
- getFriendsRank() / getOverallRank() // 排行榜
- addShortcut()                   // 添加桌面
```

### 2.4 模块调用图

```
startScene (入口)
    ├─ LoadMgr (资源加载)
    ├─ Bundle (bundle 管理)
    ├─ GPlatform (平台能力)
    ├─ AudioMgr (音频)
    └─ RunScene (场景切换)

Bundle / LoadMgr
    └─ assetManager (Cocos原生)

UIMgr
    └─ director (场景管理)
    └─ Layers.UI_2D

AudioMgr
    └─ AudioSource (Cocos原生)
```

---

## 3. 资源加载链路

### 3.1 启动加载流程

```typescript
// scene/startScene.ts
async _load() {
    // 1. 加载 Bundle
    await this._loadBundle();
        - LoadMgr.loadBundle(BundleName.Font)
        - LoadMgr.loadBundle(BundleName.RunScene)
        - LoadMgr.loadBundle(BundleName.Audio)
        - LoadMgr.loadBundle(BundleName.Game)
        - LoadMgr.loadBundle(BundleName.MainCanvas)
    
    // 2. 预加载资源
    await this.loadRes();
        - LoadMgr.loadDir2(Bundle.audio)
        - LoadMgr.loadDir2(Bundle.game)
        - LoadMgr.loadDir2(Bundle.runScene)
        - LoadMgr.loadDir2(Bundle.mainCanvas)
    
    // 3. 初始化平台
    await this._initPlatform();
    
    // 4. 进入主场景
    this._nextScene(); // → RunScene.show()
}
```

### 3.2 LoadMgr 核心 API

| 方法 | 用途 |
|------|------|
| `loadScene(name)` | 预加载场景 |
| `loadBundle(name)` | 加载资源包 |
| `loadDir(bundle, dir, type)` | 批量加载目录下资源 |
| `loadFile(bundle, path, type)` | 加载单个资源 (带缓存) |
| `loadSpriteFrame(bundle, path)` | 加载 SpriteFrame |
| `loadSprite(bundle, path, sprite)` | 动态绑定 Sprite |

### 3.3 资源缓存机制

```typescript
// LoadMgr.ts
private static _loadedAssets: Map<string, Asset> = new Map();
private static _pendingRequests: Map<string, Promise<any>> = new Map();

// loadFile 带缓存 - 避免重复加载
// Key 格式: @bundleName_@path
```

---

## 4. 开发规范 (统一风格)

### 4.1 目录组织

- **每个模块独立目录**：如需新增功能，按模块放入对应目录
- **工具函数放在 utils/**：通用工具函数统一放 utils/
- **组件放在 components/**：可复用的 Cocos 组件
- **平台相关放 platform/**：新平台实现需实现 PlatformBase 接口

### 4.2 单例模式

```typescript
// 推荐: 私有静态实例 + get
class ManagerClass {
    private static _instance: ManagerClass;
    static get instance(): ManagerClass {
        return this._instance ?? (this._instance = new ManagerClass());
    }
    private constructor() { /* 初始化 */ }
}
```

### 4.3 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 类名 | 大驼峰 | `class LoadMgr` |
| 方法名 | 小驼峰 | `loadBundle()` |
| 常量 | 全大写下划线 | `BundleName.Game` |
| 枚举成员 | 大驼峰 | `SceneName.Main` |
| 私有属性 | 下划线开头 | `_loadedAssets` |
| 全局单例 | G前缀 | `GPlatform`, `GEventTarget` |

### 4.4 资源加载规范

```typescript
// ✅ 正确: 使用 LoadMgr 加载
const prefab = await LoadMgr.loadFile(Bundle.game, 'prefabs/Player', Prefab);

// ✅ 正确: 使用 Bundle.get 获取缓存
const clip = await Bundle.get(Bundle.audio, 'press', AudioClip);

// ❌ 避免: 直接操作 assetManager (统一入口)
```

### 4.5 平台适配规范

```typescript
// 新平台实现
1. 在 platform/ 下创建新文件 (如 xxx.ts)
2. 实现 PlatformBase 接口所有方法
3. 在 platform.ts 的 switch中加入分支
4. 在 common/ 下添加类型声明 *.d.ts
```

### 4.6 Scene 切换规范

```typescript
// 使用 RunScene 而非直接 director.loadScene
RunScene.show(SceneName.Main);

// Loading 会自动处理过渡动画
```

---

## 5. 常用代码片段

### 5.1 加载 Prefab

```typescript
import { Bundle } from '../global/bundle';
import { LoadMgr } from '../manager/LoadMgr';
import { Prefab, instantiate } from 'cc';

const prefab = Bundle.game.get('prefabs/Enemy', Prefab);
const node = instantiate(prefab);
```

### 5.2 播放音效

```typescript
import { AudioMgr } from '../manager/AudioMgr';
import { Bundle } from '../global/bundle';

const clickSound = await Bundle.get(Bundle.audio, 'click', AudioClip);
AudioMgr.inst.playOneShot(clickSound);
```

### 5.3 场景切换

```typescript
import { RunScene } from '../controller/RunScene';
import { SceneName } from '../global/IGame';

RunScene.show(SceneName.Main);
```

### 5.4 触发平台能力

```typescript
import { GPlatform } from '../platform/platform';

GPlatform.showVideoAd(VideoAdType.Revive);
GPlatform.shareToFriend();
```

### 5.5 发布事件

```typescript
import { GEventTarget, GEventType } from '../common/event';

GEventTarget.emit(GEventType.GEventGameMusicChange, enable);
```

---

## 6. 注意事项

1. **Bundle 需提前加载**：使用前需在 startScene 加载流程中确保 Bundle 已加载
2. **LoadMgr 带缓存**：`loadFile` 会缓存已加载资源，重复调用直接返回缓存
3. **UIMgr 层级**：
   - `dialogParent` - 对话框
   - `topParent` - 顶层节点 (如 Toast)
   - `persistParent` - 常驻节点 (跨场景)
4. **音频预加载**：AudioMgr.inst.playOneShot() 有内置防抖 (默认 200ms)
5. **平台类型声明**：新平台需在 common/ 下添加对应 .d.ts

---

*Last Updated: 2026-03-30*