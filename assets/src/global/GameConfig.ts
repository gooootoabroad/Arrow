// 游戏配置
export class GameConfig {
    // 单位size
    static readonly UNIT_SIZE: number = 25;
    // 箭头线多大
    static readonly arrowLineWidth: number = GameConfig.UNIT_SIZE * 0.3;
    // 箭头头部多大
    static readonly arrowHeadSize: number = GameConfig.UNIT_SIZE * 0.7;
    // 箭头进入洞口的距离阈值
    static readonly enterThreshold: number = GameConfig.UNIT_SIZE * 2;
    // 路径线大小
    static readonly pathWidth: number = 5;
    // 洞半径多大
    static readonly holeSize = GameConfig.UNIT_SIZE * 1;
}