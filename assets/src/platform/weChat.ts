import { _decorator, randomRangeInt, Size } from "cc";
import { PlatformBase } from "./base";
import { CustomAdType, InterstitialAdType, VideoAdType } from "./type";
import { GConfig } from "../config/config";
import { GEventType, GEventTarget } from "../common/event";
import { isKSPlatform } from "./core";
import { Core } from "../global/Core";
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

interface customAdInfo {
    ad: any,
    unitID: string,
    left: number,
    top: number,
    width?: number,
}

const vxShareImageInfoList: shareImageInfo[] = [
    {
        title: '想你的风吹到了缤果糖葫芦',
        imageUrl: 'https://mmocgame.qpic.cn/wechatgame/ATJtC2kxDJODiaRrHEiaO97vvGGdqAYctZfXWAgSKu1Q4lDicRI1Rf3a0uBuc4UN8w2/0',
        imageUrlId: 'w4YgU53TT7+jyn2G7h1OsA==',
    },
    {
        title: '我已在第38关沉沦，求超越！',
        imageUrl: 'https://mmocgame.qpic.cn/wechatgame/BAya3cPNpIKvxAjoiawyVSXCTBHO6AZkwgvmzjPeZzTEQ5PiaHGcGLIyczW2wXEiaTK/0',
        imageUrlId: 'YHqHvcg0QkGr0u9upD7GBA==',
    },
    {
        title: '你也爱吃糖葫芦吗？',
        imageUrl: 'https://mmocgame.qpic.cn/wechatgame/7ibBxxjXnAB6OT1kPVBIUqgjvr6IsUjW19B79Kw5FbgP4Nd2WhUwjGRJSiaDLWczdX/0',
        imageUrlId: 'VbW+gfYcRrqyFOhS6OTEFw==',
    },
]

const vxVideoAdUnitID = 'adunit-dd62ac5f64c2e316';

const vxInterstitialAdTypeAdInfo: Map<InterstitialAdType, string> = new Map([
    //[InterstitialAdType.MaskAD, "adunit-6439df42fad2ba57"],
    //[InterstitialAdType.ChangeOrder, "adunit-e0688f8cdf945533"],
    [InterstitialAdType.Success, "adunit-5d4c938e3fd7e7fa"],
    [InterstitialAdType.EnterGame, "adunit-f7bd192e07b9e5d0"],
    // [InterstitialAdType.BlockGame, "adunit-04f9e990fb934cf1"],
    // [InterstitialAdType.LongSkewer, "adunit-c0160a7183e37df4"],
    // [InterstitialAdType.Signature2End, "adunit-47e39568d2cee8b2"],
    [InterstitialAdType.Common, "adunit-6a0f62f9dc76966f"],
    // [InterstitialAdType.PiggyFlip, "adunit-b567f6ed454a2e0b"],
    // [InterstitialAdType.LinkGame, "adunit-de26fc60ce630a53"],
]);

const ksShareImageInfoList: shareImageInfo[] = [];

const ksVideoAdUnitID = '2300043030_01';

const ksInterstitialAdTypeAdInfo: Map<InterstitialAdType, string> = new Map([
    [InterstitialAdType.Success, "2300043030_03"],
])

// 微信平台
@ccclass('WeChatPlatform')
export class WeChatPlatform implements PlatformBase {
    // 分享时间纪录
    private gShareStartTime = 0;
    // 推荐
    private gRecommendPageManager: any = null;
    // 视频广告ID
    private gVideoAdInfo: videoAdInfo = null;
    // 插屏广告ID
    private gInterstitialAdTypeAdInfo: Map<InterstitialAdType, string> = null;
    // bannerID
    private gCustomAdTypeAdInfo: Map<CustomAdType, customAdInfo> = null;
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

        if (isKSPlatform()) {
            this.gShareImageInfoList = ksShareImageInfoList;
            this.gVideoAdInfo = {
                ad: null,
                unitID: ksVideoAdUnitID,
            }

            this.gInterstitialAdTypeAdInfo = ksInterstitialAdTypeAdInfo;
        } else {
            this.gShareImageInfoList = vxShareImageInfoList;
            this.gVideoAdInfo = {
                ad: null,
                unitID: vxVideoAdUnitID,
            }
            this.gInterstitialAdTypeAdInfo = vxInterstitialAdTypeAdInfo;
        }

        // banner
        this.gCustomAdTypeAdInfo = new Map([
            [CustomAdType.Grid, {
                ad: null,
                unitID: 'adunit-9043b7f00c2ed9ea',
                left: 0,
                top: 0,
            }],
            [CustomAdType.Collection, {
                ad: null,
                unitID: 'adunit-46e56f43e8df8a41',
                left: 0,
                top: 0,
            }],
        ]);

    }

    // 获得备案信息
    getRegistrationInformation(): string {
        return "ICP备案号：闽ICP备2025100959号-2X";
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
        const ad = wx.createRewardedVideoAd({
            adUnitId: unitID,
            multiton: false,
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
            // let adDB = getDBOneDailyPrizeInfoFromDB(DailyPrizeID.WhatchAD);
            // adDB.currentCount++;
            // setDBOneDailyPrizeInfoToDB(DailyPrizeID.WhatchAD, adDB);
            // 上报看完广告数据
            if (!isKSPlatform()) {
                wx.reportEvent("ad_video_finish", {
                    "ad_video_type": type,
                });
            }
            onSuccess?.();
        }

        // 这里统一判断下是否需要显示广告
        if (GConfig.noAD) {
            onSuccess2?.();
            onFinally?.();
            return;
        }

        if (!this.gVideoAdInfo.ad) {
            console.log("video ad is null, init video ad first");
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
        if (GConfig.noAD) return;

        const interstitialAd = wx.createInterstitialAd({
            adUnitId: this.gInterstitialAdTypeAdInfo.get(type),
        });

        if (interstitialAd) {
            interstitialAd.show().catch((err) => {
                console.error('插屏广告显示失败', err)
            })
        }
    }

    initCustomAd(): void {
        for (const [type, adInfo] of Array.from(this.gCustomAdTypeAdInfo.entries())) {
            adInfo.ad = this.initOneCustomAd(adInfo);
            this.gCustomAdTypeAdInfo.set(type, adInfo);
        }
    }
    // 初始化原生模板广告
    initOneCustomAd(info: customAdInfo): any {
        let ad = wx.createCustomAd({
            adUnitId: info.unitID,
            style: {
                left: info.left,
                top: info.top,
                width: info.width ? info.width : 0,
            }
        })

        ad.onLoad(() => {
            console.log('原生广告加载完成,ad=', info.unitID);
        });

        ad.onError(err => {
            console.error(`原生广告错误 ${err.errMsg},ad=`, info.unitID);
        });
        return ad;
    }
    // 显示原生模板广告
    showCustomAd(type: CustomAdType): void {
        if (GConfig.noAD) return;

        let info = this.gCustomAdTypeAdInfo.get(type);
        if (!info.ad) {
            info.ad = this.initOneCustomAd(info);
            this.gCustomAdTypeAdInfo.set(type, info);
            return;
        }

        info.ad.show();
    }
    // 关闭原生模板广告
    closeCustomAd(type: CustomAdType): void {
        if (GConfig.noAD) return;

        let info = this.gCustomAdTypeAdInfo.get(type);
        if (!info.ad) {
            info.ad = this.initOneCustomAd(info);
            this.gCustomAdTypeAdInfo.set(type, info);
            return;
        }

        info.ad.hide();
    }

    // 短震动
    vibrateShort(): void {
        if ((Core.userInfo.settingConfig.vibrateEnabled)) {
            wx.vibrateShort();
        }
    }
    // 长震动
    vibrateLong(): void {
        if (Core.userInfo.settingConfig.vibrateEnabled) {
            const systemInfo = wx.getSystemInfoSync();
            if (systemInfo.platform === 'ios') {
                wx.vibrateShort();  // iOS 使用短震动
            } else {
                wx.vibrateLong();  // 安卓使用长震动
            }
        }
    }

    // 设置好友排行榜
    setRank(level: number): void {
        // TODO快手排行榜
        if (isKSPlatform()) return;

        let openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage({
            type: 'engine',
            event: 'setRank',
            level: level
        });

        // 同时上传关卡数据
        wx.reportEvent("level_finished", {
            "level_id": level,
        })
    }
    // 获取好友排行榜
    getFriendsRank(size: Size): void {
        let openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage({
            type: 'engine',
            event: 'getFriendsRank',
            size: size,
        });
    }
    getOverallRank(size: Size): void {
        let openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage({
            type: 'engine',
            event: 'getOverallRank',
            size: size,
        });
    }

    // 开启右上角分享
    enableShare(): void {
        // 快手不用
        if (isKSPlatform()) return;

        wx.showShareMenu({
            menus: ['shareAppMessage', 'shareTimeline']
        })

        // 转发参数绑定
        wx.onShareAppMessage(() => {
            let imgInfo = this.getRandomShareImage();
            return {
                title: imgInfo.title,
                imageUrl: imgInfo.imageUrl,
                imageUrlId: imgInfo.imageUrlId,
            };
        });

        // 朋友圈转发参数绑定
        wx.onShareTimeline(() => {
            let imgInfo = this.getRandomShareImage();
            return {
                title: imgInfo.title,
                imageUrl: imgInfo.imageUrl,
                imageUrlId: imgInfo.imageUrlId,
            };
        })
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

        // 快手有回调函数，以及无需参数
        if (isKSPlatform()) {
            console.log("ks share to friend");
            wx.shareAppMessage({
                success: () => {
                    onSuccess?.();
                },
                complete: () => {
                    onFinally?.();
                }
            });
            return;
        }

        const imgInfo = this.getRandomShareImage();
        this.gShareStartTime = Date.now();
        let minDuration = 1000;
        wx.shareAppMessage({
            title: imgInfo.title,
            imageUrl: imgInfo.imageUrl,
            imageUrlId: imgInfo.imageUrlId,
        });

        // 监听回到前台
        const onShowHandler = () => {
            const duration = Date.now() - this.gShareStartTime;
            console.log("分享停留时间:", duration, "ms");

            if (duration >= minDuration) {
                onSuccess?.();
            }
            onFinally?.();
            // 移除监听，避免多次触发
            wx.offShow(onShowHandler);
        };

        wx.onShow(onShowHandler);
    }

    // 跳转该小游戏游戏圈
    viewGameCircle(): void {
        // TODO 快手游戏圈
        if (isKSPlatform()) {
            return;
        }

        const pageManager = wx.createPageManager();

        pageManager.load({
            openlink: '-SSEykJvFV3pORt5kTNpS_xOWXKBaoTit6NR4SKCJZfthfS9_ZBgxwhDo449o1LK2deB6adw46ZoPfwsbWex8_MONcu-vijOk7WV1annTagwAN05L6whH3kVfZG4UjOdSRBrgH0zep-dwMOIAZSOH5mY5RU1hX5y6Uhor6UpPKyeWz6dwhEQUgPml1Nji72iNMvCbyDZXiVF7xlBRPQmPw2-kxQlsDKMi5s0lZlkNTJXp_XoVThcCu0n52T0VhJQSUAURXRea3OAPTsrxMCJ_APW4XfHbRYs4SuqvyBrG1pIFSpmXP-pDvwerMaMzlOaFTCHfO0vbvu6r14M2AocIA'
        }).then((res) => {
            // 加载成功，res 可能携带不同活动、功能返回的特殊回包信息（具体请参阅渠道说明）
            console.log(res);

            // 加载成功后按需显示
            pageManager.show();

        }).catch((err) => {
            // 加载失败，请查阅 err 给出的错误信息
            console.error(err);
        })
    }

    // 加载推荐组件
    async loadRecommend(): Promise<void> {
        if (isKSPlatform()) return;

        if (!wx.createPageManager) {
            console.error('当前基础库版本暂不支持。');
            return;
        }

        this.gRecommendPageManager = wx.createPageManager();
        await this.gRecommendPageManager.load({
            openlink: 'TWFRCqV5WeM2AkMXhKwJ03MhfPOieJfAsvXKUbWvQFQtLyyA5etMPabBehga950uzfZcH3Vi3QeEh41xRGEVFw', // 推荐组件OPENLINK常量，直接复制即可，无需理解含义
        });

        const listener = this.gRecommendPageManager.on;
        listener('destroy', (res) => {
            console.log("recommend res ", res);
            this.gRecommendPageManager = null;
        })
    }
    // 拉起推荐组件
    async showRecommend(): Promise<void> {
        if (!this.gRecommendPageManager) {
            await this.loadRecommend();
        }

        console.log("show recommmend ");
        return await this.gRecommendPageManager.show();
    }

    // 订阅游戏排行榜变动提醒
    getSubscribeMessage(): Promise<string> {
        return new Promise((resolve) => {
            // "SYS_MSG_TYPE_INTERACTIVE"（好友互动提醒）
            // "SYS_MSG_TYPE_RANK"（排行榜超越提醒）
            // "SYS_MSG_TYPE_WHATS_NEW"（游戏更新提醒）
            wx.requestSubscribeSystemMessage({
                msgTypeList: ['SYS_MSG_TYPE_INTERACTIVE', 'SYS_MSG_TYPE_RANK', 'SYS_MSG_TYPE_WHATS_NEW'],
                success(res) {
                    console.log("[subscribeMessage] 订阅消息成功 ", res);
                    return resolve('');
                },
                fail: (res) => {
                    console.log("[subscribeMessage] 订阅消息失败: ", res);
                    return resolve('');
                }
            });
        });
    }

    // 性能检测：启动场景游戏可交互
    benchCheckGameStart(): void {
        wx.reportScene({
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

    // 监听是否是从侧边栏进入游戏,这里是判断快手平台是否支持侧边栏的接口，微信没有侧边栏所以不需要实现
    listenGameEnterSidebar() {
        if (!isKSPlatform()) return;

        console.log("check enter game from sidebar");

        wx.checkSliderBarIsAvailable({
            success: (result) => {
                console.log("checkSliderBarIsAvailable result: ", result);
                let { available } = result;
                if (available) {
                    console.log("侧边栏可用");
                    // setSupportByteDanceSidebayEnterGame(true);
                }
            },
            fail: (error) => {
                console.log("checkSliderBarIsAvailable fail: ", error);
            },
        })

    }

    // 进入侧边栏,快手用
    enterSidebar() {
        if (!isKSPlatform()) return;

        wx.navigateToScene({
            scene: "sidebar",
            success: (res) => {
                // 这里就直接设置为true,因为已经到侧边栏了，说明是从侧边栏进入游戏的
                // setByteDanceSidebayEnterGame(true);
                console.log("navigate to scene success");
                // 跳转成功回调逻辑
            },
            fail: (res) => {
                console.log("navigate to scene fail: ", res);
                // 跳转失败回调逻辑
            },
        });

    }

    // 添加到桌面，快手用
    addShortcut(onSuccess?: () => void) {
        if (!isKSPlatform()) return;
        console.log("add shortcut KS Platform");
        // IOS不支持回调，回调成功奖励函数在上层用吧
        wx.addShortcut({
            success() {
                console.log("添加桌面成功");
            },
            fail(err) {
                if (err.code === -10005) {
                    console.log("暂不支持该功能");
                } else {
                    console.log("添加桌面失败", err.msg);
                }
            },
        });
    }

    // 设为常用，快手用
    addCommonUse(onSuccess?: () => void) {
        if (!isKSPlatform()) return;
        console.log("add common use KS Platform");
        wx.addCommonUse({
            success() {
                console.log("设为常用成功");
                onSuccess?.();
            },
            fail(err) {
                if (err.code === -10005) {
                    console.log("暂不支持该功能");
                } else {
                    console.log("设为常用失败", err.msg);
                }
            },
        });

    }

    // 存储本地数据
    setLocalStorageData(key: string, value: any) {
        const str = JSON.stringify(value);
        wx.setStorageSync(key, str);
    }
    // 获取本地数据
    getLocalStorageData<T>(key: string): T | null {
        let str = '';
        str = wx.getStorageSync(key);
        try {
            return str ? JSON.parse(str) as T : null;
        } catch (e) {
            console.warn('解析失败:', key, e);
            return null;
        }
    }
    // 获取本地raw格式数据
    getLocalStorageRaw(key: string): string | null {
        return wx.getStorageSync(key);
    }
    // 获取本地存储所有的keys
    keysLocalStorage(): string[] {
        const res: string[] = [];
        const keys = wx.getStorageInfoSync()?.keys || [];
        for (let key of keys) res.push(key);
        return res;
    }
    // 清除本地存储
    clearLocalStorage() {
        wx.clearStorageSync();
    }

    feedSceneInitFinished() {
        return;
    }
}