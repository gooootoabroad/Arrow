import { Label, Node } from 'cc';
import { Core } from '../global/Core';
import { GameConfig } from '../global/GameConfig';

export class EnergyManager {
    private static _instance: EnergyManager | null = null;

    private _energyLabel: Label | null = null;
    private _countdownLabel: Label | null = null;
    private _recoverNode: Node | null = null;
    private _updateInterval: number = -1;

    static get instance(): EnergyManager {
        if (!EnergyManager._instance) {
            EnergyManager._instance = new EnergyManager();
        }
        return EnergyManager._instance;
    }

    init() {
        this._recoverOfflineEnergy();
        this._startRecoverTimer();
    }

    bindUI(energyLabel: Label, countdownLabel: Label | null, recoverNode: Node | null) {
        this._energyLabel = energyLabel;
        this._countdownLabel = countdownLabel;
        this._recoverNode = recoverNode;
        this._refreshDisplay();
    }

    unbindUI() {
        this._energyLabel = null;
        this._countdownLabel = null;
        this._recoverNode = null;
    }

    private _startRecoverTimer() {
        if (this._updateInterval < 0) {
            this._updateInterval = setInterval(() => {
                this._checkAndRecover();
            }, 1000) as unknown as number;
        }
    }

    private _recoverOfflineEnergy() {
        const now = Date.now();
        const recoverTime = Core.userInfo.energyRecoverTime;
        const currentEnergy = Core.userInfo.energy;

        if (currentEnergy >= GameConfig.maxEnergy) {
            Core.userInfo.energyRecoverTime = 0;
            return;
        }

        if (recoverTime <= 0) {
            return;
        }

        if (now >= recoverTime) {
            const recoverIntervalMs = GameConfig.energyRecoverInterval * 1000;
            const elapsedMs = now - recoverTime;
            const energyToRecover = Math.floor(elapsedMs / recoverIntervalMs) + 1;
            const actualRecover = Math.min(energyToRecover, GameConfig.maxEnergy - currentEnergy);
            
            if (actualRecover > 0) {
                Core.userInfo.energy += actualRecover;
                if (Core.userInfo.energy < GameConfig.maxEnergy) {
                    Core.userInfo.energyRecoverTime = now + recoverIntervalMs;
                } else {
                    Core.userInfo.energyRecoverTime = 0;
                }
            }
        }
    }

    private _checkAndRecover() {
        const now = Date.now();
        const recoverTime = Core.userInfo.energyRecoverTime;

        if (Core.userInfo.energy >= GameConfig.maxEnergy) {
            Core.userInfo.energyRecoverTime = 0;
            this._refreshDisplay();
            return;
        }

        if (recoverTime > 0 && now >= recoverTime) {
            Core.userInfo.energy += 1;
            Core.userInfo.energyRecoverTime = now + GameConfig.energyRecoverInterval * 1000;
        }

        this._refreshDisplay();
        this._updateCountdownDisplay();
    }

    private _refreshDisplay() {
        if (this._energyLabel) {
            this._energyLabel.string = `${Core.userInfo.energy}`;
        }

        if (Core.userInfo.energy >= GameConfig.maxEnergy && this._recoverNode) {
            this._recoverNode.active = false;
        }
    }

    private _updateCountdownDisplay() {
        if (!this._countdownLabel || !this._recoverNode) return;

        const now = Date.now();
        const recoverTime = Core.userInfo.energyRecoverTime;

        if (Core.userInfo.energy >= GameConfig.maxEnergy) {
            this._recoverNode.active = false;
            return;
        }

        if (recoverTime > 0 && now < recoverTime) {
            this._recoverNode.active = true;
            const remaining = Math.ceil((recoverTime - now) / 1000);
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            this._countdownLabel.string = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            this._recoverNode.active = false;
        }
    }

    static consumeEnergy(): boolean {
        if (Core.userInfo.energy <= 0) return false;

        Core.userInfo.energy -= 1;

        if (Core.userInfo.energy < GameConfig.maxEnergy && Core.userInfo.energyRecoverTime <= 0) {
            Core.userInfo.energyRecoverTime = Date.now() + GameConfig.energyRecoverInterval * 1000;
        }

        EnergyManager.instance._refreshDisplay();

        return true;
    }

    static addEnergy(amount: number = 1): void {
        Core.userInfo.energy += amount;

        if (Core.userInfo.energy >= GameConfig.maxEnergy) {
            Core.userInfo.energy = GameConfig.maxEnergy;
            Core.userInfo.energyRecoverTime = 0;
        }

        EnergyManager.instance._refreshDisplay();
    }

    static getEnergy(): number {
        return Core.userInfo.energy;
    }

    static getMaxEnergy(): number {
        return GameConfig.maxEnergy;
    }
}
