import { Size } from "cc";
import { CustomAdType, InterstitialAdType, VideoAdType } from "./type";

export interface PlatformBase {
    // 获得备案信息
    getRegistrationInformation(): string,
    // 初始化视频广告
    initVideoAdAsync(): Promise<void>,
    // 显示视频广告
    showVideoAd(type: VideoAdType, onSuccess?: () => void, onFinally?: () => void): void,
    // 显示插屏广告
    showInterstitialAd(type: InterstitialAdType): void,
    // 初始化原生模板广告
    initCustomAd(): void,
    // 显示原生模板广告
    showCustomAd(type: CustomAdType): void,
    // 关闭原生模板广告
    closeCustomAd(type: CustomAdType): void,

    // 短震动
    vibrateShort(): void,
    // 长震动
    vibrateLong(): void,

    // 设置排行榜
    setRank(level: number): void,
    // 获取好友排行榜
    getFriendsRank(size: Size): void,
    // 获取总排行榜
    getOverallRank(size: Size): void,

    // 开启右上角分享
    enableShare(): void,
    // 手动分享
    shareToFriend(onSuccess?: () => void, onFinally?: () => void): void,

    // 跳转该小游戏游戏圈
    viewGameCircle(): void,

    // 加载推荐组件
    loadRecommend(): Promise<void>,
    // 拉起推荐组件
    showRecommend(): Promise<void>,

    // 订阅游戏排行榜变动提醒
    getSubscribeMessage(): Promise<string>,

    // 性能检测：启动场景游戏可交互
    benchCheckGameStart(): void,

    // 监听是否是从侧边栏进入游戏
    listenGameEnterSidebar(): void,

    // 抖音上报推荐流直出场景游戏初始化完成
    feedSceneInitFinished(): void,

    // 进入侧边栏
    enterSidebar(): void,
    // 添加到桌面
    addShortcut(onSuccess?: () => void): void,
    addCommonUse(onSuccess?: () => void): void,

    // 存储本地数据
    setLocalStorageData(key: string, value: any): void,
    // 获取本地数据
    getLocalStorageData<T>(key: string): T | null,
    // 获取本地raw格式数据
    getLocalStorageRaw(key: string): string | null,
    // 获取本地存储所有的keys
    keysLocalStorage(): string[],
    // 清除本地存储
    clearLocalStorage(): void,
}
