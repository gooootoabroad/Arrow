import { __private, Asset, AssetManager, assetManager, director, SceneAsset, SpriteFrame } from "cc";

export class LoadMgr {

    private static _loadedAssets: Map<string, Asset> = new Map();
    private static _pendingRequests: Map<string, Promise<any>> = new Map();
    static this: any;

    static async loadScene(name: string): Promise<SceneAsset> {
        return new Promise((resolve, reject) => {
            director.preloadScene(name, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }

    static async loadBundle(name: string): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(name, (err, bundle) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(bundle);
                }
            });
        });
    }

    static async loadDir<T extends Asset>(bundle: AssetManager.Bundle, dir = '/', type: __private.__types_globals__Constructor<T>): Promise<T[]> {
        return new Promise((resolve, reject) => {
            bundle.loadDir(dir, type, (err, assets) => {
                if (err) {
                    reject(err);
                }
                else {
                    assets.forEach(v => v.addRef());
                    resolve(assets);
                }
            });
        });
    }

    static loadDir2(bundle: AssetManager.Bundle, dir: string = "./", ref: boolean = false): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            console.info(`开始加载资源包${bundle.name}下的文件夹${dir}`);
            let startTime: number = Date.now()
            bundle.loadDir(dir, (err: Error, assets: Asset[]) => {
                if (err) {
                    console.error(`资源包${bundle.name}下的文件夹${dir}加载失败,err:${err}`)
                    reject(err);
                } else {

                    if (ref) {
                        assets.forEach(v => v.addRef());
                    }

                    let endTime: number = Date.now()
                    console.log(`资源包${bundle.name}下的文件夹${dir}加载完毕,用时${endTime - startTime}ms`);
                    resolve();
                }
            })
        })
    }

    static async loadFile<T extends Asset>(bundle: AssetManager.Bundle, path: string, type: __private.__types_globals__Constructor<T>): Promise<T> {
        let key = `@${bundle.name}_@${path}`;
        if (this._loadedAssets.has(key)) {
            return Promise.resolve(this._loadedAssets.get(key) as T);
        }
        if (this._pendingRequests.has(key)) {
            return this._pendingRequests.get(key);
        }
        let requestPromise = new Promise<T>((resolve, reject) => {
            bundle.load(path, type, (err, asset) => {
                this._pendingRequests.delete(key);
                if (err) {
                    reject(err);
                }
                else {
                    asset.name = path;
                    asset.addRef();
                    this._loadedAssets.set(key, asset);
                    resolve(asset);
                }
            });
        });
        this._pendingRequests.set(key, requestPromise);
        return requestPromise;
    }

    static async loadSpriteFrame(bundle: AssetManager.Bundle, path: string): Promise<SpriteFrame> {
        return await this.loadFile(bundle, path + '/spriteFrame', SpriteFrame);
    }

    static async loadSprite(bundle: AssetManager.Bundle, path: string, sprite: { spriteFrame: SpriteFrame },) {
        if (!sprite || sprite['_SFPath'] === path) return;

        sprite['_SFPath'] = path;

        const sf = await LoadMgr.loadSpriteFrame(bundle, path);

        if (sprite['_SFPath'] === path) {
            sprite.spriteFrame = sf;
        }
    }
}