import { _decorator, Prefab, AudioClip, UIOpacity, tween } from 'cc';
import { TopController } from '../../components/TopController';
import { Bundle } from '../../global/bundle';
import { AudioMgr } from '../../manager/AudioMgr';

const { ccclass, property } = _decorator;

@ccclass('alertController')
export class alertController extends TopController {
    protected static async _getPrefab(): Promise<Prefab> {
        return Bundle.get(Bundle.game, "prefabs/Alert", Prefab);
    }

    protected async _open() {
        let audio = await Bundle.get(Bundle.audio, 'alert', AudioClip);
        AudioMgr.inst.playOneShot(audio, 0.1);
        let duration = 0.5;
        let uiOpacity = this.node.getComponent(UIOpacity);
        let id = tween(uiOpacity).sequence(
            tween(uiOpacity).to(duration, { opacity: 50 }),
            tween(uiOpacity).to(duration, { opacity: 255 })
        ).repeatForever().start();

        setTimeout(() => {
            id.stop();
            this.node.destroy();
        }, 3000);
    }
}

