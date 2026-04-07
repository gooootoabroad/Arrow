import { HoleGroup } from "../entity/HoleGroup";
import { LevelInfo } from "../levels/levelInfo";

export class GameRuntime {
    public static holeGroups: HoleGroup[] = [];

    // 箭头总数
    public static totalArrow: number = 0;
    // 已完成箭头数
    public static finishedArrow: number = 0;
    // levelInfo
    public static levelInfo: LevelInfo = null;

    public static pause: boolean = false;
}