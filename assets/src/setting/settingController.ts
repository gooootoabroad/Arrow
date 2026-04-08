import { _decorator, Color, Component, instantiate, Label, Node, Sprite } from 'cc';
import { TopController } from '../components/TopController';
import { Core } from '../global/Core';
import { getCurrentVersion, versionToString } from '../common/version';
import { Prefab } from 'cc';
import { Bundle } from '../global/bundle';
import { GEventTarget, GEventType } from '../common/event';
import { numberToString } from '../utils/string';
import { EnergyAD } from '../ad/EnergyAD';
import { GameStatus } from '../game/type/types';
const { ccclass, property } = _decorator;

@ccclass('settingController')
export class settingController extends TopController {
    @property(Node)
    private gMusicNode: Node = null;
    @property(Node)
    private gSoundEffectNode: Node = null;
    @property(Node)
    private gVibrateNode: Node = null;
    @property(Label)
    private versionLabel: Label = null;


    private gIsDealingClicked: boolean = false;

    // 启用的按钮颜色
    private gEnableButtonColor0: string = "#61A720";
    private gEnableButtonColor1: string = "#77C52E";
    // 禁用的按钮颜色
    private gDisableButtonColor0: string = "#B64B41";
    private gDisableButtonColor1: string = "#F06458";

    private static isGameSetting: boolean = false;
    static async showSetting(isGameSetting: boolean) {
        this.isGameSetting = isGameSetting;
        settingController.show();
    }

    protected static async _getPrefab(): Promise<Prefab> {
        console.log("is game setting ", this.isGameSetting);
        let name = "prefabs/SettingCanvas";
        if (this.isGameSetting) {
            name = "prefabs/GameSetting";
        }
        return Bundle.get(Bundle.setting, name, Prefab);
    }

    protected _open() {
        GEventTarget.emit(GEventType.GEventEnableScheduleDraw, false);
        // 设置按钮颜色以及提示
        let settingConfig = Core.userInfo.settingConfig;
        this.initMusic(settingConfig.musicEnabled);
        this.initSoundEffect(settingConfig.soundEffectEnabled);
        this.initVibrate(settingConfig.vibrateEnabled);
        this.versionLabel.string = `v${versionToString(getCurrentVersion())}`;
    }

    onCloseClicked() {
        if (this.gIsDealingClicked) return;
        GEventTarget.emit(GEventType.GEventEnableScheduleDraw, true);
        this.node.destroy();
    }

    private initMusic(on?: boolean) {
        let enableText = "音乐：开启";
        let disableText = "音乐：关闭";
        let isEnable = this.dealCommonSettingUI(this.gMusicNode, enableText, disableText, on);
        if (on == undefined) {
            Core.userInfo.settingConfig.musicEnabled = isEnable;
            GEventTarget.emit(GEventType.GEventGameMusicChange);
        }
    }
    // on参数为主动获取到设置后初始化按钮颜色使用
    onMusicClicked(_: Event, on?: boolean) {
        this.initMusic(on);
    }

    private initSoundEffect(on?: boolean) {
        let enableText = "音效：开启";
        let disableText = "音效：关闭";
        let isEnable = this.dealCommonSettingUI(this.gSoundEffectNode, enableText, disableText, on);
        if (on == undefined) {
            Core.userInfo.settingConfig.soundEffectEnabled = isEnable;
        }
    }

    onSoundEffectClicked(_: Event, on?: boolean) {
        this.initSoundEffect(on);
    }

    private initVibrate(on?: boolean) {
        let enableText = "震动：开启";
        let disableText = "震动：关闭";
        let isEnable = this.dealCommonSettingUI(this.gVibrateNode, enableText, disableText, on);
        if (on == undefined) {
            Core.userInfo.settingConfig.vibrateEnabled = isEnable;
        }
    }

    onVibrateClicked(_: Event, on?: boolean) {
        this.initVibrate(on);
    }

    private dealCommonSettingUI(buttonNode: Node, enableText: string, disableText: string, on?: boolean): boolean {
        let isEnable: boolean;
        let buttonColor0: string;
        let buttonColor1: string;
        const buttonLabel = buttonNode.getComponentInChildren(Label);

        let buttonText: string = buttonLabel.string;
        if (on != undefined) {
            isEnable = on;
        } else {
            // 取反
            if (buttonText == enableText) {
                isEnable = false;
            } else {
                isEnable = true;
            }
        }

        if (isEnable) {
            buttonColor0 = this.gEnableButtonColor0;
            buttonColor1 = this.gEnableButtonColor1;
            buttonText = enableText;
        } else {
            buttonColor0 = this.gDisableButtonColor0;
            buttonColor1 = this.gDisableButtonColor1;
            buttonText = disableText;
        }

        buttonNode.getComponent(Sprite).color = new Color().fromHEX(buttonColor0);
        buttonNode.getChildByName("B0").getComponent(Sprite).color = new Color().fromHEX(buttonColor1);
        buttonLabel.string = buttonText;
        return isEnable;
    }

    onRestartClick() {
        const node = this.node.getChildByName("EnergyTip");
        node.active = true;
        node.getChildByName("EnergyCount").getComponent(Label).string = numberToString(Core.userInfo.energy);
    }

    onConfirmRestartClick() {
        if (this.gIsDealingClicked) return;
        this.gIsDealingClicked = true;

        // 判断体力够不够
        if (Core.userInfo.energy <= 0) {
            EnergyAD.show();
            this.onEnergyTipCloseClick();
            this.gIsDealingClicked = false;
            return;
        }

        Core.userInfo.energy -= 1;
        GEventTarget.emit(GEventType.GEventSetGameStatus, GameStatus.Start);
        this.node.destroy();
    }

    onEnergyTipCloseClick() {
        this.node.getChildByName("EnergyTip").active = false;
    }

    onReturnMainClick() {
        if (this.gIsDealingClicked) return;
        this.gIsDealingClicked = true;

        GEventTarget.emit(GEventType.GEventSetGameStatus, GameStatus.ReturnMain);
        this.node.destroy();
    }
}

