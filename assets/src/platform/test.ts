import { PlatformBase } from "./base";
import { _decorator, Size } from "cc";
import { CustomAdType, InterstitialAdType, VideoAdType } from "./type";
const { ccclass, property } = _decorator;

// cocos测试时使用
@ccclass('TestPlatform')
export class TestPlatform implements PlatformBase {
    // 获得备案信息
    getRegistrationInformation(): string {
        return "ICP备案号：闽ICP备2025100959号-2X";
    }

    // 初始化视频广告
    initVideoAdAsync(): Promise<void> {
        return null;
    }
    // 显示视频广告
    showVideoAd(type: VideoAdType, onSuccess?: () => void, onFinally?: () => void): void {
        onSuccess?.();
        onFinally?.();
    }
    // 显示插屏广告
    showInterstitialAd(type: InterstitialAdType): void {

    }
    // 初始化原生模板广告
    initCustomAd(): void {

    }
    // 显示原生模板广告
    showCustomAd(type: CustomAdType): void {

    }
    // 关闭原生模板广告
    closeCustomAd(type: CustomAdType): void {

    }

    // 短震动
    vibrateShort(): void {

    }
    // 长震动
    vibrateLong(): void {

    }

    // 设置好友排行榜
    setRank(level: number): void {

    }
    // 获取好友排行榜
    getFriendsRank(size: Size): void {

    }
    // 获取总排行榜
    getOverallRank(size: Size): void {

    }

    // 开启右上角分享
    enableShare(): void {

    }
    // 手动分享
    shareToFriend(onSuccess?: () => void, onFinally?: () => void): void {
        onSuccess?.();
        onFinally?.();
        return;
    }

    // 跳转该小游戏游戏圈
    viewGameCircle(): void {

    }

    // 加载推荐组件
    loadRecommend(): Promise<void> {
        return null;
    }
    // 拉起推荐组件
    showRecommend(): Promise<void> {
        return null;
    }

    // 订阅游戏排行榜变动提醒
    getSubscribeMessage(): Promise<string> {
        return null;
    }

    // 性能检测：启动场景游戏可交互
    benchCheckGameStart(): void {

    }

    listenGameEnterSidebar() { }
    // 进入侧边栏
    enterSidebar() { }
    // 添加到桌面
    addShortcut(onSuccess?: () => void) { }
    addCommonUse(onSuccess?: () => void) { }

    // 存储本地数据
    setLocalStorageData(key: string, value: any) {
        const str = JSON.stringify(value);
        localStorage.setItem(key, str);
    }
    // 获取本地数据
    getLocalStorageData<T>(key: string): T | null {
        let str = '';
        str = localStorage.getItem(key);
        try {
            return str ? JSON.parse(str) as T : null;
        } catch (e) {
            console.warn('解析失败:', key, e);
            return null;
        }
    }
    // 获取本地raw格式数据
    getLocalStorageRaw(key: string): string | null {
        return localStorage.getItem(key);
    }
    // 获取本地存储所有的keys
    keysLocalStorage(): string[] {
        return Object.keys(localStorage);
    }
    // 清除本地存储
    clearLocalStorage() {
        localStorage.clear();
    }

    feedSceneInitFinished() {
        return;
    }
}