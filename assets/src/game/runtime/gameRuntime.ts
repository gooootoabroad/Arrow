import { Vec2 } from "cc";
import { GameConfig } from "../../global/GameConfig";
import { HoleGroup } from "../entity/HoleGroup";

export class GameRuntime {
    // 关卡外圈路径
    private static _levelPathPoints: Vec2[] = [];
    // 孔洞组列表
    public static holeGroups: HoleGroup[] = [];

    public static get levelPathPoints(): readonly Vec2[] {
        return this._levelPathPoints;
    }

    public static initLevelPathPoints(points: number[][]) {
        this._levelPathPoints = points.map(point => new Vec2(point[0] * GameConfig.UNIT_SIZE, point[1] * GameConfig.UNIT_SIZE));
    }
}