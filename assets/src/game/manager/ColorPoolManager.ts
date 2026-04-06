import { GameRuntime } from "../runtime/gameRuntime";
import { EArrowColor } from "../type/arrow";

export class ColorPoolManager {
    private static _colorPool: Record<string, number> = {};
    private static _enableRainbow: boolean = false;

    static initColorPool(pool: Record<string, number>, enableRainbow: boolean) {
        this._colorPool = { ...pool };
        this._enableRainbow = enableRainbow;
    }

    static getNextHoleColor(): EArrowColor {
        if (this._enableRainbow) {
            const poolTotal = Object.values(this._colorPool).reduce((s, v) => s + v, 0);
            const activeGroups = GameRuntime.holeGroups.filter(g => !g.isExhausted());
            if (poolTotal <= 3 && activeGroups.length <= 1) {
                return EArrowColor.RAINBOW;
            }
        }

        const availableColors = Object.entries(this._colorPool)
            .filter(([, count]) => count > 0)
            .map(([color]) => color);

        if (availableColors.length === 0) {
            return EArrowColor.RED;
        }

        const weights = availableColors.map(color => this._colorPool[color]);
        const totalWeight = weights.reduce((s, w) => s + w, 0);
        let rand = Math.random() * totalWeight;
        for (let i = 0; i < availableColors.length; i++) {
            rand -= weights[i];
            if (rand <= 0) {
                const picked = availableColors[i] as EArrowColor;
                this._colorPool[picked]--;
                return picked;
            }
        }

        const picked = availableColors[availableColors.length - 1] as EArrowColor;
        this._colorPool[picked]--;
        return picked;
    }
}