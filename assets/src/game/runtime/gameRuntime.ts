import { Vec2 } from "cc";
import { GameConfig } from "../../global/GameConfig";

export class GameRuntime {
    // 关卡外圈路径
    private static _levelPathPoints: Vec2[] = [];

    public static get levelPathPoints(): readonly Vec2[] {
        return this._levelPathPoints;
    }

    public static initLevelPathPoints(points: number[][]) {
        this._levelPathPoints = points.map(point => new Vec2(point[0] * GameConfig.UNIT_SIZE, point[1] * GameConfig.UNIT_SIZE));
    }
}