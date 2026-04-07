import { awaitManager } from "../utils/awaitManager";
import { setTimeoutManager } from "../utils/setTimeoutManager";
import { tweenManager } from "../utils/tweenManager";

export class ResourceMgr {
    /*           初始化异步资源          */
    static initAsyncResource() {
        tweenManager.instance.init();
        awaitManager.instance.init();
        setTimeoutManager.instance.init();
    }
    /*                释放异步资源          */
    static async waitCancelAsyncResource() {
        tweenManager.instance.cancelAll();
        setTimeoutManager.instance.cancelAll();
        await awaitManager.instance.waitAllFinish();
    }
}