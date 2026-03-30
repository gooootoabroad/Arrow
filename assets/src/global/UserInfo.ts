import { SaveProp } from "../localstorage/SaveProp";

export class UserInfo {
    @SaveProp.decorator(1)
    level: number;

    @SaveProp.decorator({
        musicEnabled: true,
        soundEffectEnabled: true,
        vibrateEnabled: true,
    })
    settingConfig: SettingConfig;

    constructor() {
        SaveProp.initObject(this);
    }

    clear() {
        SaveProp.removeObject(this);
        // 重置内存数据
        SaveProp.initObject(this);
    }

}

export interface SettingConfig {
    musicEnabled: boolean,
    soundEffectEnabled: boolean,
    vibrateEnabled: boolean,
}