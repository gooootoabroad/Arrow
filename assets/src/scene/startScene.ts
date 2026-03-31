import { _decorator, AudioClip, Button, Component, Font, game, Label, Node, Prefab, ProgressBar, Sprite } from 'cc';
import { getCurrentVersion, versionToString } from '../common/version';
import { GPlatform } from '../platform/platform';
import { Bundle, BundleName } from '../global/bundle';
import { LoadMgr } from '../manager/LoadMgr';
import { AudioMgr } from '../manager/AudioMgr';
import { RunScene } from '../controller/RunScene';
import { SceneName } from '../global/IGame';
const { ccclass, property } = _decorator;

@ccclass('startScene')
export class startScene extends Component {
    @property(ProgressBar)
    private gProgressBar: ProgressBar = null;
    @property(Label)
    private gProgressMessageLabel: Label = null;
    // 版本号
    @property(Label)
    private gVersionLabel: Label = null;
    // 备案号
    @property(Label)
    private gRegistrationInformationLabel: Label = null;

    protected onLoad(): void {
        this.gVersionLabel.string = `v${versionToString(getCurrentVersion())}`;
        this.gRegistrationInformationLabel.string = GPlatform.getRegistrationInformation();
    }

    start() {
        game.frameRate = 60;
        this._toLoad();
    }

    private async _toLoad() {
        try {
            this._load();
        }
        catch {
            this.scheduleOnce(() => {
                console.log('加载失败重试');
                this._toLoad();
            }, 2);
        }
    }

    private async _load() {
        // 下载游戏资源
        this._updateProgress(0.1, "正在加载游戏资源");
        await this._loadBundle();
        await this.loadRes();

        // 初始化平台以及钩子
        this._updateProgress(0.95, "正在初始化数据");
        await this._initPlatform();
        // 初始化钩子
        await this._privateFunc();
        this._updateProgress(1, "加载完成，正在进入游戏");
        this._nextScene();
    }

    private async _loadBundle() {
        Bundle.font = await LoadMgr.loadBundle(BundleName.Font);
        Bundle.runScene = await LoadMgr.loadBundle(BundleName.RunScene);
        await LoadMgr.loadDir(Bundle.runScene, 'prefabs', Prefab);
        this._updateProgress(0.5);

        Bundle.audio = await LoadMgr.loadBundle(BundleName.Audio);
        await LoadMgr.loadDir(Bundle.audio, '/', AudioClip);
        this._updateProgress(0.6);

        Bundle.game = await LoadMgr.loadBundle(BundleName.Game);
        this._updateProgress(0.7);

        Bundle.mainCanvas = await LoadMgr.loadBundle(BundleName.MainCanvas);

        // Bundle.monster = await LoadMgr.loadBundle(BundleName.Monster);
        // this._targetProgress = 0.8;

        // await LoadMgr.loadDir(Bundle.game, 'prefab', Prefab);
        this._updateProgress(0.9);
        await LoadMgr.loadScene(SceneName.Game);
    }

    private async loadRes() {
        await LoadMgr.loadDir2(Bundle.audio);
        await LoadMgr.loadDir2(Bundle.game);
        await LoadMgr.loadDir2(Bundle.runScene);
        await LoadMgr.loadDir2(Bundle.mainCanvas);
    }

    private async _initPlatform() {
        // 初始化转发功能
        GPlatform.enableShare();
        // 初始化滚动广告
        //GPlatform.initCustomAd();
        // 初始化推荐
        GPlatform.loadRecommend();
        // 初始化广告
        await GPlatform.initVideoAdAsync();
    }

    // 更新进度
    private _updateProgress(value: number, description: string = null) {
        if (value > 1) value = 1;
        if (description !== null) {
            console.log(description);
            this.gProgressMessageLabel.string = description;
        }

        this.gProgressBar.progress = value;
    }

    private async _privateFunc() {
        //let customFont = await LoadMgr.loadFile(Bundle.font, 'SweiHalfMoonCJKSC', Font);


        // let labelOnLoad = Label.prototype.onLoad;
        // Label.prototype.onLoad = function (...args: any[]) {
        //     let self = this as Label;
        //     labelOnLoad.call(self, ...args);
        //     if (!!customFont) {
        //         self.useSystemFont = false;
        //         self.isBold = false;
        //         self.font = customFont;
        //     }
        // }
        let clickAudio = await Bundle.get(Bundle.audio, "press", AudioClip);
        Button.prototype["onLoad"] = function (...args: any[]) {
            let self = this as Button;
            self.transition = Button.Transition.SCALE;
            self.zoomScale = 1.1;
        }

        let onTouchEnded = Button.prototype["_onTouchEnded"];
        Button.prototype["_onTouchEnded"] = function (...args: any[]) {
            let self = this as Button;
            onTouchEnded.call(self, ...args);
            AudioMgr.inst.playOneShot(clickAudio, 0.1);
        }
    }

    private _nextScene() {
        RunScene.show(SceneName.Game, true);
    }
}

