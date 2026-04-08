import { _decorator, Component, director, instantiate, Node, Prefab, tween, Tween, UITransform } from 'cc';
import { SceneName } from '../global/IGame';
import { Bundle } from '../global/bundle';
import { UIMgr } from '../manager/UIMgr';
import { Animation } from 'cc';
import { NodePoolMgr } from '../manager/NodePoolMgr';
const { ccclass, property } = _decorator;

@ccclass('RunScene')
export class RunScene extends Component {
    @property(Node)
    private gLoadingStartNode: Node = null;
    @property(Node)
    private gLoadingEndNode: Node = null;

    private _fast = false;

    // 过渡动画，后续加上支持prefab加回调
    static async show(sceneName: SceneName, fast = false) {
        let prefab = await Bundle.get(Bundle.runScene, 'prefabs/Loading', Prefab);
        let node = instantiate(prefab);
        node.parent = UIMgr.instance.persistParent;
        node.setSiblingIndex(10000);

        node.getComponent(RunScene)._startAnim(sceneName, fast);
    }

    private _startAnim(sceneName: SceneName, fast = false) {
        this._fast = fast;
        let nextStep = () => {
            director.loadScene(sceneName, () => {
                this._hide(() => {
                    this.node.destroy();
                });
            }, () => {
                NodePoolMgr.clear();
            });
        }
        this._show(() => {
            this.scheduleOnce(() => {
                nextStep();
            }, this._fast ? 0 : 0.2);

            // if (sceneName === SceneName.Game) {
            //     MonsterData.loadRes(() => {
            //         HeroData.loadRes(() => {
            //             nextStep();
            //         });
            //     });
            // }
            // else {
            //     this.scheduleOnce(() => {
            //         nextStep();
            //     }, this._fast ? 0 : 0.2);
            // }
        });
    }

    private _show(call: () => void) {
        this.gLoadingStartNode.active = true;
        this.gLoadingEndNode.active = false;
        const animation = this.gLoadingStartNode.getComponent(Animation);
        animation.once(Animation.EventType.FINISHED, () => {
            call();
        });

        animation.play();
    }

    private _hide(call: () => void) {
        this.gLoadingEndNode.active = true;
        this.gLoadingStartNode.active = false;
        const animation = this.gLoadingEndNode.getComponent(Animation);
        animation.once(Animation.EventType.FINISHED, () => {
            call();
        });

        animation.play();
    }
}


