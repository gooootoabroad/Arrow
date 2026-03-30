import { _decorator, instantiate, Prefab } from 'cc';
import { Controller } from './Controller';
import { UIMgr } from '../manager/UIMgr';
const { ccclass, property } = _decorator;

@ccclass('TopController')
export class TopController extends Controller {

    static async show(...args: any[]) {
        let prefab = await this._getPrefab();
        let node = instantiate(prefab);
        node.parent = UIMgr.instance.topParent;

        let comp = node.getComponent(TopController);
        comp.open(...args);

        return comp;
    }

    open(...args: any[]) {
        this._open(...args);
    }

    close() {
        this.node.destroy();
    }

    protected static _getPrefab(): Promise<Prefab> {
        return null;
    }

    protected _open(...args: any[]) {
        //...todo something
    }
}

