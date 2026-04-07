// 组ID，用于总榜，设置用户的组ID是在主域进行
export const GroupID = "groupAll";

// 视频广告类型
export enum VideoAdType {
    Common = "common",
    Revive = "revive",
}

// 插屏广告
export enum InterstitialAdType {
    // 去遮罩
    MaskAD,
    // 更换顺序
    ChangeOrder,
    // 闯关成功
    Success,
    // 进入游戏
    EnterGame,
    // 撤销
    Undo,
    // 长串
    LongSkewer,
    // 一串到底
    Signature2End,
    // 通用
    Common,
    // 方块胜利
    BlockGame,
    // 猪猪翻翻看
    PiggyFlip,
    // 连连看
    LinkGame,
}

export enum CustomAdType {
    // 格子
    Grid,
    // 横幅
    //Banner = "banner",
    // 收集奖励
    Collection,
}
