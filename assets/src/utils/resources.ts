// import { Asset, AssetManager, assetManager, Constructor, director, dragonBones, Prefab, resources, Sprite, SpriteAtlas, SpriteFrame } from "cc";

// export function loadFromBundle<T extends Asset>(
//     bundleName: string,
//     path: string,
//     type: Constructor<T>,
//     callback: (err: Error | null, asset: T | null) => void
// ) {
//     const bundle = assetManager.getBundle(bundleName);
//     if (!bundle) {
//         assetManager.loadBundle(bundleName, (err, loadedBundle) => {
//             if (err) {
//                 console.error(`加载 ${bundleName} bundle 失败:`, err);
//                 callback(err, null);
//                 return;
//             }
//             loadedBundle.load(path, type, callback);
//         });
//     } else {
//         bundle.load(path, type, callback);
//     }
// }

// /** 延迟执行回调（默认延迟 100 毫秒） */
// function delayCallback<T extends (...args: any[]) => void>(
//     callback: T | undefined,
//     delayMs: number = 100
// ): T | undefined {
//     if (!callback) return undefined;
//     return ((...args: Parameters<T>) => {
//         setTimeout(() => callback(...args), delayMs);
//     }) as T;
// }

// /** 从指定 bundle 加载并运行场景（可延迟执行 callback） */
// export function loadSceneFromBundle(
//     bundleName: string,
//     callback?: (err: Error | null, asset: AssetManager.Bundle | null) => void,
// ) {
//     const delayedCb = delayCallback(callback);
//     const bundle = assetManager.getBundle(bundleName);

//     const handleSceneLoad = (bundle: AssetManager.Bundle) => {
//         bundle.loadScene(bundleName, (err, scene) => {
//             if (err) {
//                 console.warn(`加载场景 ${bundleName} 失败:`, err);
//                 delayedCb?.(err, bundle);
//                 return;
//             }

//             console.log(`加载场景 ${bundleName} 成功`);
//             director.runScene(scene, null, (err) => {
//                 if (err) {
//                     console.error(`运行场景 ${bundleName} 失败:`, err);
//                     delayedCb?.(err, bundle);
//                     return;
//                 }
//                 delayedCb?.(null, bundle);
//             });
//         });
//     };

//     if (!bundle) {
//         // 如果 bundle 未加载，则先加载
//         assetManager.loadBundle(bundleName, (err, loadedBundle) => {
//             if (err || !loadedBundle) {
//                 console.error(`加载 bundle ${bundleName} 失败:`, err);
//                 delayedCb?.(err || new Error(`加载 ${bundleName} bundle 失败`), loadedBundle);
//                 return;
//             }
//             handleSceneLoad(loadedBundle);
//         });
//     } else {
//         handleSceneLoad(bundle);
//     }
// }

// export function preLoadSceneFromBundle(
//     bundleName: string,
//     callback?: (err: Error | null, asset: AssetManager.Bundle | null) => void
// ) {
//     const bundle = assetManager.getBundle(bundleName);
//     if (!bundle) {
//         loadBundleSync(bundleName, (err, loadBundle) => {
//             if (err) {
//                 console.error(`加载 ${bundleName} bundle 失败:`, err);
//                 if (callback) callback(err, loadBundle);
//                 return;
//             }
//             loadBundle.preloadScene(bundleName, function (err) {
//                 if (err) {
//                     console.warn("预加载%s场景失败， err", bundleName, err);
//                     if (callback) callback(err, loadBundle);
//                     return;
//                 }
//                 console.log("预加载%s场景成功", bundleName);
//                 if (callback) callback(null, loadBundle);
//             });
//         });
//     } else {
//         bundle.preloadScene(bundleName, function (err) {
//             if (err) {
//                 console.warn("预加载%s场景失败， err", bundleName, err);
//                 if (callback) callback(err, bundle);
//                 return;
//             }
//             console.log("预加载%s场景成功", bundleName);
//             if (callback) callback(err, bundle);
//         });
//     }
// }

// // 同步加载bundle
// export function loadBundleSync(bundleName: string,
//     callback?: (err: Error | null, asset: AssetManager.Bundle | null) => void): Promise<void> {
//     return new Promise((resolve) => {
//         const bundle = assetManager.getBundle(bundleName);
//         if (!bundle) {
//             assetManager.loadBundle(bundleName, (err, loadedBundle) => {
//                 if (err) {
//                     console.error(`加载 ${bundleName} bundle 失败:`, err);
//                     resolve();
//                     return;
//                 }
//                 if (callback) callback(err, loadedBundle);
//                 resolve();
//                 return;
//             });
//         }
//         else {
//             if (callback) callback(null, bundle);
//             resolve();
//             return;
//         }
//     });
// }

// // 加载bundle里的canvas
// export function loadBundleCanvasPrefabSync(bundleName: string, canvasName: string,
//     callback: (prefab: Prefab) => void): Promise<void> {
//     return new Promise((resolve) => {
//         const bundle = assetManager.getBundle(bundleName);
//         if (!bundle) {
//             assetManager.loadBundle(bundleName, (err, loadedBundle) => {
//                 if (err) {
//                     console.error(`加载 ${bundleName} bundle 失败:`, err);
//                     resolve();
//                     return;
//                 }
//                 loadedBundle.load(`canvas/${canvasName}`, Prefab, (err, prefab) => {
//                     if (err) {
//                         console.error(`加载 ${bundleName} bundle 成功，但加载prefab${canvasName}失败:`, err);
//                         resolve();
//                         return;
//                     }
//                     callback(prefab);
//                     resolve();
//                 });
//             });
//         }
//         else {
//             bundle.load(`canvas/${canvasName}`, Prefab, (err, prefab) => {
//                 if (err) {
//                     console.error(`加载 ${bundleName} bundle 成功，但加载prefab${canvasName}失败:`, err);
//                     resolve();
//                     return;
//                 }
//                 callback(prefab);
//                 resolve();
//             });
//         }
//     });
// }

// export function loadSpriteFromBundle(sprite: Sprite, path: string, bundleName: BundleName, callback?: () => void) {
//     if (!path) {
//         sprite.spriteFrame = null;
//         return;
//     }

//     loadFromBundle(bundleName, path, SpriteFrame, (err, spriteFrame) => {
//         if (err) {
//             console.error(`load sprite from ${bundleName} err: `, err);
//             return;
//         }
//         sprite.spriteFrame = spriteFrame;
//         if (callback) callback();
//     })
// }

// // 加载图集
// export function loadSpriteAtlasFromBundle(bundleName: string, path: string, spriteName: string, sprite: Sprite, callback?: () => void) {
//     if (!bundleName || !path || !spriteName) {
//         sprite.spriteFrame = null;
//         callback?.();
//         return;
//     }
//     loadFromBundle(bundleName, path, SpriteAtlas, (err, atlas) => {
//         if (err) {
//             console.error(`load sprite atlas from ${bundleName} err: `, err);
//             callback?.();
//             return;
//         }

//         const frame = atlas.getSpriteFrame(spriteName);
//         sprite.spriteFrame = frame;
//         callback?.();
//     });
// }

// /*        来刺一串     */
// // 加载来刺一串预制体
// export function loadPFFruitPrefab(path: string, callback: (err, prefab: Prefab) => void) {
//     loadFromBundle(BundleName.PiercingFruit, path, Prefab, callback);
// }

// // 加载主场景预制体
// export function loadPrefabFromMainCanvas(path: string, callback: (err, prefab: Prefab) => void) {
//     loadFromBundle(BundleName.MainCanvas, path, Prefab, callback);
// }
// // 加载主游戏预制体
// export function loadPrefabFromGame(path: string, callback: (err, prefab: Prefab) => void) {
//     loadFromBundle(BundleName.Game, path, Prefab, callback);
// }

// export function loadSpriteFromSugarCalashTheme(sprite: Sprite, id: string, theme: string) {
//     return new Promise<void>((resolve) => {
//         if (!id) {
//             sprite.spriteFrame = null;
//             resolve();
//             return;
//         }

//         let path = `ui/${theme}/${theme}`;
//         loadSpriteAtlasFromBundle(BundleName.SugarCalashTheme, path, id, sprite, () => {
//             resolve();
//         });
//     });

// }

// export function loadSpriteFrameFromGame(sprite: Sprite, path: string) {
//     if (path == "") {
//         return;
//     }
//     loadSpriteFromBundle(sprite, path, BundleName.Game);
// }

// export function loadGameSpriteAtlas(sprite: Sprite, path: string, spriteName: string) {
//     if (path == "") {
//         return;
//     }
//     loadSpriteAtlasFromBundle(BundleName.Game, path, spriteName, sprite);
// }

// // 加载SpriteFrame
// export function loadSpriteFrameFromMainCanvas(sprite: Sprite, path: string) {
//     if (path == "") {
//         return;
//     }
//     loadSpriteFromBundle(sprite, path, BundleName.MainCanvas);
// }

// export function loadSpriteFrame(sprite: Sprite, path: string) {
//     if (path == "") {
//         return;
//     }
//     resources.load(path, SpriteFrame, (err, spriteFrame) => {
//         if (err) {
//             console.warn(err);
//             return;
//         }

//         sprite.spriteFrame = spriteFrame;
//     });
// }

// export function loadBackgroundSpriteFrame(sprite: Sprite, theme: string, isEave: boolean = false, isTiny: boolean = false) {
//     let path = "ui/normalUI/normalUI";
//     if (isTiny) {
//         path = "ui/tinyUI/tinyUI";
//     }
//     let name = theme;
//     if (isEave) {
//         name = `${theme}Eave`;
//     }

//     return loadSpriteAtlasFromBundle(BundleName.BackgroundTheme, path, name, sprite);
// }

// export function loadPrefabFromSugarPaperTheme(theme: string, callback: (err: Error, prefab: Prefab) => void) {
//     if (!theme) {
//         return;
//     }

//     let path = `prefabs/${theme}/SugarPaper`;
//     return loadFromBundle(BundleName.SugarPaperTheme, path, Prefab, callback);
// }

// export function loadSpriteFromSugarPaperTheme(sprite: Sprite, theme: string) {
//     if (!theme) {
//         sprite.spriteFrame = null;
//         return;
//     }

//     let path = `ui/${theme}/paper0/spriteFrame`;
//     loadSpriteFromBundle(sprite, path, BundleName.SugarPaperTheme);
// }

// export function loadCollectionSpriteAtlas(path: string, spriteName: string, sprite: Sprite) {
//     return new Promise<void>((resolve) => {
//         loadSpriteAtlasFromBundle(BundleName.CollectCanvas, path, spriteName, sprite, () => {
//             resolve();
//         });
//     });
// }

// export function loadSpriteFromBoxTheme(sprite: Sprite, theme: string) {
//     if (!theme) {
//         sprite.spriteFrame = null;
//         return;
//     }

//     let path = `ui/${theme}/box/spriteFrame`;
//     loadSpriteFromBundle(sprite, path, BundleName.BoxTheme);
// }

// export function loadSpriteFromCabinetTheme(sprite: Sprite, theme: string, withTiny: boolean = false) {
//     if (!theme) {
//         sprite.spriteFrame = null;
//         return;
//     }

//     let path = `ui/${theme}/cabinet/spriteFrame`;
//     if (withTiny) {
//         path = `tinyUI/${theme}/cabinet/spriteFrame`;
//     }
//     loadSpriteFromBundle(sprite, path, BundleName.CabinetTheme);
// }

// // 加载顾客动画
// export function loadCustomSprite(sprite: Sprite, customName: string) {
//     let path = "ui/customs/" + customName + "/spriteFrame";
//     loadSpriteFromBundle(sprite, path, BundleName.ShortGame);
// }

// export function loadFromShortGame<T extends Asset>(
//     path: string,
//     type: Constructor<T>,
//     callback: (err: Error | null, asset: T | null) => void
// ) {
//     const bundle = assetManager.getBundle('shortGame');
//     if (!bundle) {
//         assetManager.loadBundle('shortGame', (err, loadedBundle) => {
//             if (err) {
//                 console.error('加载 shortGame bundle 失败:', err);
//                 callback(err, null);
//                 return;
//             }
//             loadedBundle.load(path, type, callback);
//         });
//     } else {
//         bundle.load(path, type, callback);
//     }
// }

// export function loadEnergyADPrefab(bundleName: BundleName, callback: (err: Error, prefab: Prefab) => void) {
//     let path = "prefabs/EnergyAD";
//     loadFromBundle(bundleName, path, Prefab, callback);
// }

// export function loadNotFinishedPrefab(callback: (err: Error, prefab: Prefab) => void) {
//     let path = "prefabs/NotFinished";
//     loadFromBundle(BundleName.Setting, path, Prefab, callback);
// }

// export function preloadOneThemeResource(name: string, themeDirNameList: string[], prefix: string, clear: boolean = true): Promise<void> {
//     return new Promise<void>((resolve) => {
//         assetManager.loadBundle(name, async (err, bundle) => {
//             if (err) {
//                 console.error("加载%s bundle 失败:", name, err);
//                 resolve();
//                 return;
//             }

//             // 获取 ui 目录下所有资源信息（包括路径）
//             const infos = bundle.getDirWithPath(prefix);

//             // 用一个 Set 保存一级目录（主题名）
//             const themeSet = new Set<string>();
//             let promises: Promise<void>[] = [];

//             for (const info of infos) {
//                 // info.path 可能是 "ui/aTheme/theme/xxx"
//                 const parts = info.path.split("/");
//                 if (parts.length > 1) {
//                     themeSet.add(parts[1]); // 第二层就是主题名
//                 }
//             }

//             // 遍历主题名，清理不需要的
//             if (clear) {
//                 themeSet.forEach(themeName => {
//                     if (themeDirNameList.indexOf(themeName) == -1) {
//                         const infos = bundle.getDirWithPath(`${prefix}/${themeName}`); // IAddressableInfo[]
//                         infos.forEach(info => {
//                             // info.uuid 是资源的唯一标识
//                             const asset = assetManager.assets.get(info.uuid); // 拿到真实 Asset
//                             if (asset) {
//                                 assetManager.releaseAsset(asset);
//                             }
//                         });
//                         console.log(`已彻底清理主题: ${themeName}`);
//                     }
//                 });
//             }

//             // 预加载当前主题
//             for (const themeDirName of themeDirNameList) {
//                 let promise = loadDirSync(bundle, `${prefix}/${themeDirName}`, name);
//                 promises.push(promise);
//             }
//             // 这里只能用普通的await，此时一般awaitManager已关闭
//             await Promise.all(promises);
//             resolve();
//         })
//     });
// }

// export function preloadResource(bundleName: string, prefix: string, layer: number): Promise<void> {
//     return new Promise<void>((resolve) => {
//         assetManager.loadBundle(bundleName, async (err, bundle) => {
//             if (err) {
//                 console.error("加载%s bundle 失败:", bundleName, err);
//                 resolve();
//                 return;
//             }
//             /*
//             infos = 
//             {
//                 uuid: '9ff2311b-a49a-48ae-9a22-e8fd9ff3aeab',
//                 path: 'ui/back/b2',
//                 ctor: [class ImageAsset extends Asset] {
//                 extnames: [Array],
//                 _sharedPlaceHolderCanvas: HTMLCanvasElement {},
//                 __ccclassCache__: undefined,
//                 '$super': [Function],
//                 _sealed: true,
//                 __props__: [Array],
//                 __values__: [Array]
//             }
//              */
//             const infos = bundle.getDirWithPath(prefix);
//             const itemSet = new Set<string>();
//             let promises: Promise<void>[] = [];

//             for (const info of infos) {
//                 // info.path 是 "ui/back/b2"
//                 const parts = info.path.split("/");
//                 if (parts.length > layer) {
//                     let path = "";
//                     for (let i = 0; i <= layer; i++) {
//                         path += parts[i];
//                         path += "/";
//                     }
//                     itemSet.add(path);
//                 }
//             }
//             // 预加载当前资源
//             for (const item of itemSet) {
//                 let promise = loadDirSync(bundle, item, bundleName);
//                 promises.push(promise);
//             }
//             // 这里只能用普通的await，此时一般awaitManager已关闭
//             await Promise.all(promises);
//             resolve();
//         });
//     });
// }

// // 异步加载目录下资源
// function loadDirSync(bundle: AssetManager.Bundle, path: string, bundleName: string): Promise<void> {
//     return new Promise<void>((resolve) => {
//         bundle.loadDir(path, (err, assets) => {
//             if (err) {
//                 console.error('加载资源出错', err);
//                 resolve();
//                 return;
//             }
//             console.log(`Bundle：${bundleName} 资源 ${path} 预加载完成，资源总数: ${assets.length}`);
//             resolve();
//         });
//     });
// }
// // 释放资源
// export function releaseResourse(bundleName: string, prefix: string, layer: number) {
//     assetManager.loadBundle(bundleName, (err, bundle) => {
//         if (err) {
//             console.error("加载%s bundle 失败:", bundleName, err);
//             return;
//         }
//         /*
//         infos = 
//         {
//             uuid: '9ff2311b-a49a-48ae-9a22-e8fd9ff3aeab',
//             path: 'ui/back/b2',
//             ctor: [class ImageAsset extends Asset] {
//             extnames: [Array],
//             _sharedPlaceHolderCanvas: HTMLCanvasElement {},
//             __ccclassCache__: undefined,
//             '$super': [Function],
//             _sealed: true,
//             __props__: [Array],
//             __values__: [Array]
//         }
//          */
//         const infos = bundle.getDirWithPath(prefix);
//         const itemSet = new Set<string>();

//         for (const info of infos) {
//             // info.path 是 "ui/back/b2"
//             const parts = info.path.split("/");
//             if (parts.length > layer) {
//                 let path = "";
//                 for (let i = 0; i <= layer; i++) {
//                     path += parts[i];
//                     path += "/";
//                 }
//                 itemSet.add(path);
//             }
//         }
//         // 清除
//         for (const item of itemSet) {
//             const infos = bundle.getDirWithPath(item); // IAddressableInfo[]
//             infos.forEach(info => {
//                 // info.uuid 是资源的唯一标识
//                 const asset = assetManager.assets.get(info.uuid); // 拿到真实 Asset
//                 if (asset) {
//                     assetManager.releaseAsset(asset);
//                 }
//             });
//             console.log(`已彻底清理${bundleName}资源: ${item}`);
//         }
//     });
// }
