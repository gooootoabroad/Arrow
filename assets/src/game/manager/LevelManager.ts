import { Label } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { getLevelInfo, LevelInfo } from '../levels/levelInfo';
import { numberToString } from '../../utils/string';
import { alertController } from '../alert/alertController';
import { Color } from 'cc';
import { GameRuntime } from '../runtime/gameRuntime';
import { settingController } from '../../setting/settingController';
import { GameMenuMgr } from './GameMenuMgr';
import { GEventTarget, GEventType } from '../../common/event';
const { ccclass, property } = _decorator;

@ccclass('LevelManager')
export class LevelManager extends Component {
    @property(Label)
    private nameLabel: Label = null;
    @property(Label)
    private stepLabel: Label = null;

    private static _instance: LevelManager = null;

    public static get instance(): LevelManager {
        if (!this._instance) this._instance = new LevelManager();
        return this._instance;
    }

    private step: number = 0;

    private normalColor: Color = new Color().fromHEX("#FFFFFF");
    private alertColor: Color = new Color().fromHEX("#FF0000");

    private isDealing: boolean = false;
    private lastAlertTime: number = 0;
    private static readonly ALERT_COOLDOWN: number = 10000;

    protected onLoad(): void {
        GEventTarget.on(GEventType.GEventAddOneStep, this.addOneStep, this);
    }

    protected onDestroy(): void {
        GEventTarget.off(GEventType.GEventAddOneStep, this.addOneStep, this);
    }

    init(step: number) {
        this.step = step;
        this.isDealing = false;

        this.nameLabel.string = GameRuntime.levelInfo.name;
        this.updateStpeUI();
    }

    costOneStep() {
        if (this.step <= 0) {
            GameMenuMgr.showFailedMenu();
            return;
        }

        this.step -= 1;
        this.updateStpeUI();
    }

    addOneStep() {
        this.step += 1;
        this.updateStpeUI();
    }

    updateStpeUI() {
        let color = this.normalColor;
        if (this.step == 1) {
            const now = Date.now();
            if (now - this.lastAlertTime >= LevelManager.ALERT_COOLDOWN) {
                alertController.show();
                this.lastAlertTime = now;
            }
        }
        if (this.step <= 1) {
            color = this.alertColor;
        }

        this.stepLabel.color = color;
        this.stepLabel.string = numberToString(this.step);
    }

    onSettingClick() {
        if (this.isDealing) return;
        this.isDealing = true;
        settingController.showSetting(true);

        this.isDealing = false;
    }
}

