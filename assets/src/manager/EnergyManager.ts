import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { Core } from '../global/Core';
import { GameConfig } from '../global/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('EnergyManager')
export class EnergyManager extends Component {
    @property(Label)
    private energyLabel: Label = null;

    @property(Label)
    private countdownLabel: Label = null;

    @property(Node)
    private recoverNode: Node = null;


    protected onLoad(): void {
        this._recoverEnergyIfNeeded();
    }

    start() {
        this.refreshDisplay();
        this._updateCountdown();
        this.schedule(() => {
            this._updateCountdown();
        }, 1);
    }

    private _recoverEnergyIfNeeded() {
        const now = Date.now();
        const recoverTime = Core.userInfo.energyRecoverTime;
        const currentEnergy = Core.userInfo.energy;
        if (recoverTime > 0 && currentEnergy < GameConfig.maxEnergy) {
            if (now >= recoverTime) {
                this._doRecover();
            }
        }

        if (currentEnergy >= GameConfig.maxEnergy) {
            Core.userInfo.energyRecoverTime = 0;
        }
    }

    private _doRecover() {
        if (Core.userInfo.energy < GameConfig.maxEnergy) {
            Core.userInfo.energy += 1;
            this._scheduleNextRecover();
            this.refreshDisplay();
        }
    }

    private _scheduleNextRecover() {
        Core.userInfo.energyRecoverTime = Date.now() + GameConfig.energyRecoverInterval * 1000;
    }

    private _updateCountdown() {
        if (!this.countdownLabel || !this.recoverNode) return;

        this.refreshDisplay();

        const now = Date.now();
        const recoverTime = Core.userInfo.energyRecoverTime;

        if (Core.userInfo.energy >= GameConfig.maxEnergy) {
            this.recoverNode.active = false;
            return;
        }

        if (recoverTime > 0 && now < recoverTime) {
            this.recoverNode.active = true;
            const remaining = Math.ceil((recoverTime - now) / 1000);
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            this.countdownLabel.string = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else if (recoverTime > 0 && now >= recoverTime) {
            this._doRecover();
        }
    }

    refreshDisplay() {
        if (this.energyLabel) {
            this.energyLabel.string = `${Core.userInfo.energy}`;
        }

        if (Core.userInfo.energy >= GameConfig.maxEnergy) {
            this.recoverNode && (this.recoverNode.active = false);
        }
    }

    static consumeEnergy(): boolean {
        if (Core.userInfo.energy <= 0) return false;

        Core.userInfo.energy -= 1;

        if (Core.userInfo.energy < GameConfig.maxEnergy && Core.userInfo.energyRecoverTime <= 0) {
            Core.userInfo.energyRecoverTime = Date.now() + GameConfig.energyRecoverInterval * 1000;
        }

        return true;
    }

    static addEnergy(amount: number = 1): void {
        Core.userInfo.energy += amount;

        if (Core.userInfo.energy >= GameConfig.maxEnergy) {
            Core.userInfo.energy = GameConfig.maxEnergy;
            Core.userInfo.energyRecoverTime = 0;
        }
    }
}