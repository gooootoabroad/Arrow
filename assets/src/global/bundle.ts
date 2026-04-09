import { Asset } from "cc";
import { AssetManager } from "cc";

export class Bundle {
    static audio: AssetManager.Bundle;
    static game: AssetManager.Bundle;
    static mainCanvas: AssetManager.Bundle;
    static runScene: AssetManager.Bundle;
    static animals: AssetManager.Bundle;
    static resource: AssetManager.Bundle;
    static setting: AssetManager.Bundle;

    static async get<T extends Asset>(bundle: AssetManager.Bundle, path: string, type: new (...args: any[]) => T): Promise<T> {
        const asset = bundle.get(path, type);
        if (asset) return asset;

        return new Promise((resolve, reject) => {
            bundle.load(path, type, (err, asset) => {
                if (err) reject(err);
                else resolve(asset);
            });
        });
    }

    // 找不到就直接返回null，然后内部去加载到缓存
    static get2<T extends Asset>(bundle: AssetManager.Bundle, path: string, type: new (...args: any[]) => T): T | null {
        const asset = bundle.get(path, type);
        if (asset) return asset;

        bundle.load(path, type);
        return null;
    }
}

export enum BundleName {
    Game = "game",
    MainCanvas = "mainCanvas",
    Audio = "audio",
    RunScene = "runScene",
    Animals = "animals",
    Setting = "setting",
}