import { _decorator, Component, Node } from 'cc';
import { TopController } from '../components/TopController';
import { Prefab } from 'cc';
import { Bundle } from '../global/bundle';
import { AudioClip } from 'cc';
import { AudioMgr } from '../manager/AudioMgr';
import { Core } from '../global/Core';
import { GPlatform } from '../platform/platform';
import { VideoAdType } from '../platform/type';
const { ccclass, property } = _decorator;

@ccclass('EnergyAD')
export class EnergyAD extends TopController {
    private isDealing: boolean = false;

    protected static async _getPrefab(): Promise<Prefab> {
        return Bundle.get(Bundle.resource, "prefabs/EnergyAD", Prefab);
    }

    protected async _open() {
        let audio = await Bundle.get(Bundle.audio, 'ad', AudioClip);
        AudioMgr.inst.playOneShot(audio, 0.1);
    }

    onConfirmClick() {
        if (this.isDealing) return;
        this.isDealing = true;

        let isSuccessed = false;
        let onSuccess = () => {
            isSuccessed = true;
            Core.userInfo.energy += 3;
        }

        let onFinally = () => {
            if (isSuccessed) {
                this.onCloseClick();
            }
            this.isDealing = false;
        }

        GPlatform.showVideoAd(VideoAdType.Energy, onSuccess, onFinally);
    }

    onCloseClick() {
        this.node.destroy();
    }
}

