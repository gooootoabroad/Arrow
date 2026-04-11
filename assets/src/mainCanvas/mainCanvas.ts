import { _decorator, Component, Node } from 'cc';
import { settingController } from '../setting/settingController';
import { Core } from '../global/Core';
import { AudioMgr } from '../manager/AudioMgr';
import { Label } from 'cc';
import { UISprite } from '../components/UISprite';
import { getLevelInfo } from '../game/levels/levelInfo';
import { LoadMgr } from '../manager/LoadMgr';
import { Bundle } from '../global/bundle';
import { Prefab } from 'cc';
import { instantiate } from 'cc';
import { GPlatform } from '../platform/platform';
import { RunScene } from '../controller/RunScene';
import { SceneName } from '../global/IGame';
import { EnergyManager } from '../manager/EnergyManager';
import { EnergyAD } from '../ad/EnergyAD';
import { GEventTarget, GEventType } from '../common/event';
import { AudioClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('mainCanvas')
export class mainCanvas extends Component {
    @property(Label)
    private mapNameLabel: Label = null;
    @property(UISprite)
    private mapIcon: UISprite = null;
    @property(Label)
    private mapLevelLabel: Label = null;

    @property(Prefab)
    private themePrefab: Prefab = null;

    @property(Label)
    private energyLabel: Label = null;
    @property(Label)
    private countdownLabel: Label = null;
    @property(Node)
    private recoverNode: Node = null;

    private themeNode: Node = null;

    private isDealing: boolean = false;

    protected onLoad(): void {
        GEventTarget.on(GEventType.GEventGameMusicChange, this.dealGameMusice, this);
    }

    protected onDestroy(): void {
        GEventTarget.off(GEventType.GEventGameMusicChange, this.dealGameMusice, this);
        EnergyManager.instance.unbindUI();
    }

    async start() {
        this.isDealing = false;
        let clip = await Bundle.get(Bundle.audio, 'gameMusic', AudioClip);
        AudioMgr.background.play(clip);
        this.dealGameMusice();
        this.initMapInfo();
        EnergyManager.instance.bindUI(this.energyLabel, this.countdownLabel, this.recoverNode);
    }

    initMapInfo() {
        let levelInfo = getLevelInfo(Core.userInfo.level);
        if (levelInfo == null) {
            // 没有解锁的图案了
            this.mapIcon.node.active = false;
            this.mapNameLabel.node.active = false;
        } else {
            this.mapLevelLabel.string = levelInfo.name;
            LoadMgr.loadSprite(Bundle.animals, levelInfo.image, this.mapIcon);
        }

        this.mapLevelLabel.string = `第${Core.userInfo.level}关`;
    }

    onSettingClick() {
        if (this.isDealing) return;
        this.isDealing = true;
        settingController.showSetting(false);

        this.isDealing = false;
    }

    onGameClubClick() {
        if (this.isDealing) return;
        this.isDealing = true;
        GPlatform.viewGameCircle();
        this.isDealing = false;
    }

    onThemeClick() {
        if (this.isDealing) return;
        this.isDealing = true;
        if (this.themeNode != null) {
            this.themeNode.active = true;
            this.isDealing = false;
            return;
        }

        this.themeNode = instantiate(this.themePrefab);
        this.node.addChild(this.themeNode);
        this.isDealing = false;
    }

    onGameStartClick() {
        if (this.isDealing) return;
        this.isDealing = true;
        // 这里要消耗体力
        if (!EnergyManager.consumeEnergy()) {
            EnergyAD.show();
            this.isDealing = false;
            return;
        }
        RunScene.show(SceneName.Game);
    }

    private dealGameMusice() {
        if (Core.userInfo.settingConfig.musicEnabled) {
            AudioMgr.background.resume();
        } else {
            AudioMgr.background.pause();
        }
    }
}

