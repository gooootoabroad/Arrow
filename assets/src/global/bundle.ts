import { Asset } from "cc";
import { AssetManager } from "cc";

export class Bundle {
    static font: AssetManager.Bundle;
    static audio: AssetManager.Bundle;
    static game: AssetManager.Bundle;
    static mainCanvas: AssetManager.Bundle;
    static runScene: AssetManager.Bundle;
    static animals: AssetManager.Bundle;

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
}

export enum BundleName {
    Game = "game",
    MainCanvas = "mainCanvas",
    Audio = "audio",
    Font = "font",
    RunScene = "runScene",
    Animals = "animals",
}