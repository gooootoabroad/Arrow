import { PlatformBase } from "./base";
import { _decorator, randomRangeInt, Size } from "cc";
import { InterstitialAdType, VideoAdType } from "./type";
import { GEventTarget, GEventType } from "../common/event";
import { GConfig } from "../config/config";
const { ccclass, property } = _decorator;

interface shareImageInfo {
    title: string,
    imageUrl: string,
    imageUrlId: string,
}

interface videoAdInfo {
    ad: any,
    unitID: string,
}

const vxShareImageInfoList: shareImageInfo[] = [
    {
        title: '你想玩的这里都有~~',
        imageUrl: 'https://mmocgame.qpic.cn/wechatgame/pmIwodVSVJ6g4Kia3qCcWgfaPrc2FZs35TWuZtfo93v6loOHp1vGnicV39J6Cfh1J5/0',
        imageUrlId: 'EcSg+rrETyu8NNZCGLkd9g==',
    },
    {
        title: '第二关好难过，快来帮帮我！',
        imageUrl: 'https://mmocgame.qpic.cn/wechatgame/ce9IcskJrE2cib6w8icqaW1G14WUxK4R1zNib8xf8MZmOricguo83BWXyoL9cbQIoDna/0',
        imageUrlId: '5Js8tspaQ+mcvfJDc0WZHw==',
    },
    {
        title: '我行我上',
        imageUrl: 'https://mmocgame.qpic.cn/wechatgame/nqA07kRiaMHBzKJpibjOUroT8fmxribFrNWBLY0wKnV2MCxusLFLL8IyEllQWpjBLVB/0',
        imageUrlId: 'WuVHyGCcT3iFVCkX52K1xg==',
    },
]

// TODO
const vxInterstitialAdTypeAdInfo: Map<InterstitialAdType, string> = new Map([
])

// TODO
const vxVideoAdUnitID = '';

// cocos测试时使用
@ccclass('TaobaoPlatform')
export class TaobaoPlatform implements PlatformBase {
    // 分享时间纪录
    private gShareStartTime = 0;
    // 创建 原生模板 广告实例，提前初始化
    private gCustomAd: any = null;
    private gScreenWidth: number = null;
    // 推荐
    private gRecommendPageManager: any = null;
    // 视频广告ID
    private gVideoAdInfo: videoAdInfo = null;
    // 插屏广告ID
    private gInterstitialAdTypeAdInfo: Map<InterstitialAdType, string> = null;
    // 分享图片信息
    private gShareImageInfoList: shareImageInfo[] = [];
    // 观看成功回掉函数
    private gRewardCallback: (() => void) | null = null;
    // 不管成功或失败的回掉函数
    private gFinallyCallback: (() => void) | null = null;

    constructor() {
        this.initData();
    }
    // 初始数据
    private initData() {
        // 观看成功回掉函数
        this.gRewardCallback = null;
        // 不管成功或失败的回掉函数
        this.gFinallyCallback = null;

        this.gShareImageInfoList = vxShareImageInfoList;
        this.gVideoAdInfo = {
            ad: null,
            unitID: vxVideoAdUnitID,
        }

        this.gInterstitialAdTypeAdInfo = vxInterstitialAdTypeAdInfo;

    }
    // 获得备案信息
    getRegistrationInformation(): string {
        return "ICP备案号：闽ICP备2025100959号-3X";
    }

    // 初始化视频广告
    initVideoAdAsync(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.gVideoAdInfo.ad = this.initVideoAd(this.gVideoAdInfo.unitID);
            this.gRewardCallback = null;
            this.gFinallyCallback = null;
            resolve();
        });
    }
    // 同步加载广告，兜底用的
    private initVideoAd(unitID: string): any {
        const ad = my.createRewardedAd({
            adUnitId: unitID,
        });
        console.log("init ad type= %s, ", unitID);

        ad.offError();
        ad.offClose();

        ad.onError((err: any) => {
            console.error('激励视频广告加载失败', err);
            // 不影响后续其他广告加载
        });

        ad.onClose((res: any) => {
            console.log("video ad on close, res: ", res);
            if ((res && res.isEnded) || res === undefined) {
                console.log('用户看完视频，发奖励');
                this.gRewardCallback?.();
            } else {
                console.log('用户中途退出视频');
            }

            this.gRewardCallback = null;
            this.gFinallyCallback?.();
            this.gFinallyCallback = null;
            // 这里观看视频后需要重新加载下声音
            GEventTarget.emit(GEventType.GEventGameMusicChange);
        })

        return ad;
    }
    // 显示视频广告
    showVideoAd(type: VideoAdType, onSuccess?: () => void, onFinally?: () => void): void {
        let onSuccess2 = () => {
            // 上报看完广告数据
            // my.reportEvent("ad_video_finish", {
            //     "ad_video_type": type,
            // });
            onSuccess?.();
        }

        // 这里统一判断下是否需要显示广告
        if (GConfig.noAD) {
            onSuccess2?.();
            onFinally?.();
            return;
        }

        if (!this.gVideoAdInfo.ad) {
            // 可能是初次加载视频广告失败了，这里重新加载
            this.gVideoAdInfo.ad = this.initVideoAd(this.gVideoAdInfo.unitID);
            onFinally?.();
            return;
        }

        this.gRewardCallback = onSuccess2 || null;
        this.gFinallyCallback = onFinally || null;

        this.gVideoAdInfo.ad.show().catch(() => {
            // 失败重试
            this.gVideoAdInfo.ad.load()
                .then(() => this.gVideoAdInfo.ad.show())
                .catch(err => {
                    console.error('激励视频 广告显示失败', err)
                    this.gFinallyCallback && this.gFinallyCallback();
                    this.gFinallyCallback = null;
                    // 这里观看视频后需要重新加载下声音
                    GEventTarget.emit(GEventType.GEventGameMusicChange);
                })
        })
    }
    // 显示插屏广告
    showInterstitialAd(type: InterstitialAdType): void {
        return;
    }
    // 初始化原生模板广告
    initCustomAd(): void {

    }
    // 显示原生模板广告
    showCustomAd(): void {

    }
    // 关闭原生模板广告
    closeCustomAd(): void {

    }

    // 短震动
    vibrateShort(): void {
        // if (isEnabledVibrate()) {
        //     my.vibrateShort();
        // }
    }
    // 长震动
    vibrateLong(): void {
        // if (isEnabledVibrate()) {
        //     const systemInfo = my.getSystemInfoSync();
        //     if (systemInfo.platform === 'ios') {
        //         my.vibrateShort();  // iOS 使用短震动
        //     } else {
        //         my.vibrateLong();  // 安卓使用长震动
        //     }
        // }
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
    // 随机获得图片
    private getRandomShareImage() {
        const index = randomRangeInt(0, this.gShareImageInfoList.length);
        return this.gShareImageInfoList[index];
    }
    // 手动分享
    shareToFriend(onSuccess?: () => void, onFinally?: () => void): void {
        if (GConfig.noAD) {
            onSuccess?.();
            onFinally?.();
            return;
        }

        const imgInfo = this.getRandomShareImage();
        this.gShareStartTime = Date.now();
        let minDuration = 1000;
        const sdk = my.tb.getInteractiveSDK();
        sdk.shareApp({
            title: "逃跑我最快",
            desc: '你牛，你来把这关过了！',
            thumbImgUrl: imgInfo.imageUrl,
            querys: {
                foo: '1',
                bar: 'baz'
            }
        })
            .catch(err => {
                console.log(err)
            })


        // 监听回到前台
        const onShowHandler = () => {
            const duration = Date.now() - this.gShareStartTime;
            console.log("分享停留时间:", duration, "ms");

            if (duration >= minDuration) {
                onSuccess?.();
            }
            onFinally?.();
            // 移除监听，避免多次触发
            my.offShow(onShowHandler);
        };

        my.onShow(onShowHandler);
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
        this.shareToFriend();
        return null;
    }

    // 订阅游戏排行榜变动提醒
    getSubscribeMessage(): Promise<string> {
        return null;
    }

    // 性能检测：启动场景游戏可交互
    benchCheckGameStart(): void {
        my.reportScene({
            sceneId: 7,  //「必填」sceneId 为「新建场景」后，由系统生成的场景 Id 值，用于区分当前是哪个启动场景的数据
            success(res) {
                // 上报接口执行完成后的回调，用于检查上报数据是否符合预期，也可通过启动调试能力进行验证
                console.log(res);
            },
            fail(res) {
                // 上报报错时的回调，用于查看上报错误的原因：如参数类型错误等
                console.log(res);
            },
        });
    }

    listenGameEnterSidebar() { }
    // 抖音上报推荐流直出场景游戏初始化完成
    feedSceneInitFinished(): void { }
    // 进入侧边栏
    enterSidebar() { }
    // 添加到桌面
    addShortcut(onSuccess?: () => void) { }
    addCommonUse(onSuccess?: () => void): void { }
    // 存储本地数据
    setLocalStorageData(key: string, value: any) {
        const str = JSON.stringify(value);
        my.setStorageSync({ key: key, data: str });
    }
    // 获取本地数据
    getLocalStorageData<T>(key: string): T | null {
        let res = my.getStorageSync({ key: key });
        try {
            return res ? JSON.parse(res.data) as T : null;
        } catch (e) {
            console.warn('解析失败:', key, e);
            return null;
        }
    }
    // 获取本地raw格式数据
    getLocalStorageRaw(key: string): string | null {
        return my.getStorageSync(key);
    }
    // 获取本地存储所有的keys
    keysLocalStorage(): string[] {
        const res: string[] = [];
        const keys = my.getStorageInfoSync()?.keys || [];
        for (let key of keys) res.push(key);
        return res;
    }
    // 清除本地存储
    clearLocalStorage() {
        my.clearStorageSync();
    }

    /*       跳转其他游戏    */
    // 跳转到缤果串串串
    goGameSugarCalabash(): void {
    }
}