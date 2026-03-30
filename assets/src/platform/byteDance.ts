import { PlatformBase } from "./base";
import { _decorator, randomRangeInt, Size } from "cc";
import { CustomAdType, GroupID, InterstitialAdType, VideoAdType } from "./type";
import { GEventType, GEventTarget } from "../common/event";
import { GConfig } from "../config/config";
const { ccclass, property } = _decorator;

// 抖音平台
interface shareImageInfo {
    title: string,
    imageUrlId: string,
}

interface videoAdInfo {
    ad: any,
    unitID: string,
}

@ccclass('ByteDancePlatform')
export class ByteDancePlatform implements PlatformBase {
    // 分享时间纪录
    private gShareStartTime = 0;
    // 创建 原生模板 广告实例，提前初始化
    private gCustomAd: any = null;
    private gScreenWidth: number = null;
    // 推荐
    private gRecommendPageManager: any = null;
    // 视频广告ID
    private gVideoAdsMap: Map<VideoAdType, videoAdInfo>
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

        // 分享图片信息
        this.gShareImageInfoList = [
            {
                title: '想你的风吹到了缤果糖葫芦',
                imageUrlId: '10la8b36i7j82cj5l9',
            },
            {
                title: '我已在第38关沉沦，求超越！',
                imageUrlId: '1g3g508qc1hf46me0k',
            },
            {
                title: '谁来帮我破纪录！',
                imageUrlId: '1wdi7keotth7gbao5i',
            },
        ]

        // 视频广告
        this.gVideoAdsMap = new Map([
            // [
            //     VideoAdType.GameItem, {
            //         ad: null,
            //         unitID: 'adunit-ecd213c8b4a9018b',
            //     }
            // ],
            [
                VideoAdType.Common, {
                    ad: null,
                    unitID: '38w0e2plnpler7x0ws',
                }
            ],
            // [
            //     VideoAdType.MultipleMoney, {
            //         ad: null,
            //         unitID: 'adunit-26b2b76505f0b9c3',
            //     }
            // ],
            // [
            //     VideoAdType.Undo, {
            //         ad: null,
            //         unitID: 'adunit-cbf34591f6e1c5a7',
            //     }
            // ],
            // [
            //     VideoAdType.ChangeOrder, {
            //         ad: null,
            //         unitID: 'adunit-792dcbbf90aef749',
            //     }
            // ],
            // [
            //     VideoAdType.Mask, {
            //         ad: null,
            //         unitID: 'adunit-ecd213c8b4a9018b',
            //     }
            // ],
        ]);
        // 插屏广告ID
        this.gInterstitialAdTypeAdInfo = new Map([
            //[InterstitialAdType.MaskAD, "adunit-6439df42fad2ba57"],
            //[InterstitialAdType.ChangeOrder, "adunit-e0688f8cdf945533"],
            [InterstitialAdType.Success, "f1qarl9c0n2928nige"],
            //[InterstitialAdType.EnterGame, "adunit-f7bd192e07b9e5d0"],
            //[InterstitialAdType.Undo, "adunit-e2e92d3358ed3b33"],
        ]);
    }

    // 获得备案信息
    getRegistrationInformation(): string {
        return "ICP备案号：闽ICP备2025100959号-2X";
    }

    // 初始化视频广告
    initVideoAdAsync(): Promise<void> {
        return new Promise((resolve, reject) => {
            for (const [type, adInfo] of Array.from(this.gVideoAdsMap.entries())) {
                adInfo.ad = this.initVideoAd(adInfo.unitID);
                this.gVideoAdsMap.set(type, adInfo);
            }

            this.gRewardCallback = null;
            this.gFinallyCallback = null;
            resolve();
        });
    }

    // 同步加载广告，兜底用的
    private initVideoAd(unitID: string): any {
        const ad = tt.createRewardedVideoAd({
            adUnitId: unitID,
            multiton: false,
            progressTip: false,
        });
        console.log("init ad type= %s, ", unitID);

        ad.offLoad();
        ad.offError();
        ad.offClose();

        ad.onLoad(() => {
            console.log('激励视频广告加载完成, 类型=%s', unitID);
        });

        ad.onError((err: any) => {
            console.error('激励视频广告加载失败', err);
            // 不影响后续其他广告加载
        });

        ad.onClose((res: any) => {
            if (res && res.isEnded) {
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
            onSuccess?.();
        }

        // 这里统一判断下是否需要显示广告
        if (GConfig.noAD) {
            onSuccess2?.();
            onFinally?.();
            return;
        }

        let adInfo = this.gVideoAdsMap.get(type);
        if (!adInfo.ad) {
            // 可能是初次加载视频广告失败了，这里重新加载
            adInfo.ad = this.initVideoAd(adInfo.unitID);
            this.gVideoAdsMap.set(type, adInfo);
            onFinally?.();
            return;
        }

        this.gRewardCallback = onSuccess2 || null;
        this.gFinallyCallback = onFinally || null;

        adInfo.ad.show().catch(() => {
            // 失败重试
            adInfo.ad.load()
                .then(() => adInfo.ad.show())
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

        const interstitialAd = tt.createInterstitialAd({
            adUnitId: this.gInterstitialAdTypeAdInfo.get(type),
        });

        if (interstitialAd) {
            interstitialAd.show().catch((err) => {
                console.error('插屏广告显示失败', err)
            })
        }
    }
    // 初始化原生模板广告
    initCustomAd(): void {
        // if (this.gCustomAd) {
        //     return;
        // }

        // if (!this.gScreenWidth) {
        //     const sysInfo = wx.getSystemInfoSync();
        //     this.gScreenWidth = sysInfo.screenWidth;
        // }
        // this.gCustomAd = wx.createCustomAd({
        //     adUnitId: 'adunit-aa0c6fd0e5d6ff8d',
        //     style: {
        //         left: this.gScreenWidth - 50,
        //         top: 30,
        //     }
        // })

        // this.gCustomAd.onLoad(() => {
        //     console.log('原生广告加载完成');
        // });

        // this.gCustomAd.onError(err => {
        //     console.error(`原生广告错误 ${err.errMsg}`);
        // });
    }
    // 显示原生模板广告
    showCustomAd(type: CustomAdType): void {
        // if (GConfig.noAD) return;

        // if (!this.gCustomAd) {
        //     this.initCustomAd();
        //     return;
        // }

        // this.gCustomAd.show();
    }
    // 关闭原生模板广告
    closeCustomAd(type: CustomAdType): void {
        // if (GConfig.noAD) return;

        // if (!this.gCustomAd) {
        //     this.initCustomAd();
        //     return;
        // }

        // this.gCustomAd.hide();
    }

    // 短震动
    vibrateShort(): void {
        // if (isEnabledVibrate()) {
        //     tt.vibrateShort();
        // }
    }
    // 长震动
    vibrateLong(): void {
        // if (isEnabledVibrate()) {
        //     tt.vibrateLong();
        //     // const systemInfo = wx.getSystemInfoSync();
        //     // if (systemInfo.platform === 'ios') {
        //     //     wx.vibrateShort();  // iOS 使用短震动
        //     // } else {
        //     //     wx.vibrateLong();  // 安卓使用长震动
        //     // }
        // }
    }

    // 设置好友排行榜
    setRank(level: number): void {
        let callback = () => {
            let openDataContext = tt.getOpenDataContext();
            openDataContext.postMessage({
                type: 'engine',
                event: 'setRank',
                level: level
            });
        }

        // 需要先登录
        tt.login({
            force: true,
            success(res) {
                console.log(`login 调用成功${res.code} ${res.anonymousCode}`);
                tt.setUserGroup({
                    groupId: GroupID,
                    // 不管成功与否，都设置下排行榜的关卡
                    complete: (res) => {
                        console.log("setUserGroup: ", res);
                        callback();
                    }
                })
            },
            fail(res) {
                console.log(`login 调用失败`);
            },
        });



    }
    // 获取好友排行榜
    getFriendsRank(size: Size): void {
        tt.login({
            force: true,
            success(res) {
                console.log(`login 调用成功${res.code} ${res.anonymousCode}`);
                let openDataContext = tt.getOpenDataContext();
                openDataContext.postMessage({
                    type: 'engine',
                    event: 'getFriendsRank',
                    size: size,
                });
            },
            fail(res) {
                console.log(`login 调用失败`);
            },
        });

    }
    // 获得总榜
    getOverallRank(size: Size): void {
        tt.login({
            force: true,
            success(res) {
                console.log(`login 调用成功${res.code} ${res.anonymousCode}`);
                let openDataContext = tt.getOpenDataContext();
                openDataContext.postMessage({
                    type: 'engine',
                    event: 'getOverallRank',
                    size: size,
                    groupID: GroupID,
                });
            },
            fail(res) {
                console.log(`login 调用失败`);
            },
        });

    }

    // 开启右上角分享
    enableShare(): void {
        tt.onShareAppMessage(() => {
            const imgInfo = this.getRandomShareImage();
            return {
                templateId: imgInfo.imageUrlId,
                desc: imgInfo.title,
            };
        });

        // wx.showShareMenu({
        //     menus: ['shareAppMessage', 'shareTimeline']
        // })

        // // 转发参数绑定
        // wx.onShareAppMessage(() => {
        //     let imgInfo = this.getRandomShareImage();
        //     return {
        //         title: imgInfo.title,
        //         imageUrl: imgInfo.imageUrl,
        //         imageUrlId: imgInfo.imageUrlId,
        //     };
        // });

        // // 朋友圈转发参数绑定
        // wx.onShareTimeline(() => {
        //     let imgInfo = this.getRandomShareImage();
        //     return {
        //         title: imgInfo.title,
        //         imageUrl: imgInfo.imageUrl,
        //         imageUrlId: imgInfo.imageUrlId,
        //     };
        // })
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

        tt.shareAppMessage({
            templateId: imgInfo.imageUrlId,
            desc: imgInfo.title,
            success() {
                console.log("分享成功");
                onSuccess?.();
            },
            fail(e) {
                console.log("分享失败");
            },
            complete() {
                onFinally?.();
            }
        });
    }

    // 跳转该小游戏游戏圈
    viewGameCircle(): void {
        tt.navigateToMiniProgram({
            appId: 'ttb90ccfb12603db9302',    // 小游戏站appid
            path: 'pages/circle/index?appId=ttb90ccfb12603db9302',
        });
    }

    // 加载推荐组件
    async loadRecommend(): Promise<void> {
        // if (!wx.createPageManager) {
        //     console.error('当前基础库版本暂不支持。');
        //     return;
        // }

        // this.gRecommendPageManager = wx.createPageManager();
        // await this.gRecommendPageManager.load({
        //     openlink: 'TWFRCqV5WeM2AkMXhKwJ03MhfPOieJfAsvXKUbWvQFQtLyyA5etMPabBehga950uzfZcH3Vi3QeEh41xRGEVFw', // 推荐组件OPENLINK常量，直接复制即可，无需理解含义
        // });

        // const listener = this.gRecommendPageManager.on;
        // listener('destroy', (res) => {
        //     console.log("recommend res ", res);
        //     this.gRecommendPageManager = null;
        // })
    }
    // 拉起推荐组件
    async showRecommend(): Promise<void> {
        // if (!this.gRecommendPageManager) {
        //     await this.loadRecommend();
        // }

        // console.log("show recommmend ");
        // return await this.gRecommendPageManager.show();
    }

    // 订阅游戏排行榜变动提醒
    getSubscribeMessage(): Promise<string> {
        return new Promise((resolve) => {
        });
        // return new Promise((resolve) => {
        //     // "SYS_MSG_TYPE_INTERACTIVE"（好友互动提醒）
        //     // "SYS_MSG_TYPE_RANK"（排行榜超越提醒）
        //     // "SYS_MSG_TYPE_WHATS_NEW"（游戏更新提醒）
        //     wx.requestSubscribeSystemMessage({
        //         msgTypeList: ['SYS_MSG_TYPE_INTERACTIVE', 'SYS_MSG_TYPE_RANK', 'SYS_MSG_TYPE_WHATS_NEW'],
        //         success(res) {
        //             console.log("[subscribeMessage] 订阅消息成功 ", res);
        //             return resolve('');
        //         },
        //         fail: (res) => {
        //             console.log("[subscribeMessage] 订阅消息失败: ", res);
        //             return resolve('');
        //         }
        //     });
        // });
    }

    // 性能检测：启动场景游戏可交互
    benchCheckGameStart(): void {
        tt.reportScene({
            sceneId: 7001,  //「必填」sceneId 为「新建场景」后，由系统生成的场景 Id 值，用于区分当前是哪个启动场景的数据
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

    // 监听游戏启动时是否是从侧边栏进入
    listenGameEnterSidebar() {
        let callback = (res) => {
            if (res.launch_from === "homepage") {
                console.log("set enter game from sidebar");
                //setByteDanceSidebayEnterGame(true);
                tt.offShow(callback);
            }
        }

        tt.onShow(callback)

        // 检查是否支持从侧边栏进入
        tt.checkScene({
            scene: "sidebar",
            success: (res) => {
                console.log("check scene success: ", res.isExist);
                if (res.isExist) {
                    //setSupportByteDanceSidebayEnterGame(true);
                } else {
                    // 取消监听
                    console.log("cancle listen sidebar");
                    tt.offShow(callback);
                }
            },
            fail: (res) => {
                console.log("check scene fail:", res);
            }
        });

        // 判断是否是推荐流
        if (String(tt.getLaunchOptionsSync().scene).endsWith("3041")) {
            //setIsByteDanceFeedScene(true);
        }
    }

    // 进入侧边栏
    enterSidebar() {
        tt.navigateToScene({
            scene: "sidebar",
            success: (res) => {
                console.log("navigate to scene success");
            },
            fail: (res) => {
                console.log("navigate to scene fail: ", res);
            },
        });
    }

    // 添加到桌面
    addShortcut(onSuccess?: () => void) {
        tt.addShortcut({
            success() {
                console.log("添加桌面成功");
                onSuccess?.();
            },
            fail(err) {
                console.log("添加桌面失败", err.errMsg);
            },
        });
    }

    addCommonUse(onSuccess?: () => void): void { }

    // 存储本地数据
    setLocalStorageData(key: string, value: any) {
        const str = JSON.stringify(value);
        tt.setStorageSync(key, str);
    }
    // 获取本地数据
    getLocalStorageData<T>(key: string): T | null {
        let str = '';
        str = tt.getStorageSync(key);
        try {
            return str ? JSON.parse(str) as T : null;
        } catch (e) {
            console.warn('解析失败:', key, e);
            return null;
        }
    }
    // 获取本地raw格式数据
    getLocalStorageRaw(key: string): string | null {
        return tt.getStorageSync(key);
    }
    // 获取本地存储所有的keys
    keysLocalStorage(): string[] {
        const res: string[] = [];
        const keys = tt.getStorageInfoSync()?.keys || [];
        for (let key of keys) res.push(key);
        return res;
    }
    // 清除本地存储
    clearLocalStorage() {
        tt.clearStorageSync();
    }

    feedSceneInitFinished() {
        // if (!getIsByteDanceFeedScene() || getHasReportFeedScene()) {
        //     // 不是推荐流或已经上报完成
        //     return;
        // }

        // 上报初始化完成
        tt.reportScene({
            sceneId: 7001,
        })

        //setHasReportFeedScene(true);
    }
}