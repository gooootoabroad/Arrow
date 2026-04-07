import { _decorator } from 'cc';
import { AsyncRWLockManager } from './lock';
import { awaitManager } from './awaitManager';
const { ccclass, property } = _decorator;

type TimeoutID = NodeJS.Timeout;
const LockKey = "setTimeoutManager";

@ccclass('setTimeoutManager')
export class setTimeoutManager {
    private static _instance: setTimeoutManager;
    public static get instance(): setTimeoutManager {
        if (!this._instance) this._instance = new setTimeoutManager();
        return this._instance;
    }

    /** 保存所有 await 的控制对象 */
    private _timeoutMap: Map<TimeoutID, boolean> = new Map();
    private _rwLock = AsyncRWLockManager.getInstance();
    private _idCounter = 0;

    // 是否停止注册
    private gForbinCreate: boolean = false;

    public init() {
        this.gForbinCreate = false;
        this._timeoutMap.clear();
        this._timeoutMap = new Map();
        this._idCounter = 0;
        this._rwLock.clear(LockKey);
    }

    /** 创建一个可管理的 setTimeout */
    public async create(callback: () => void, timeout: number) {
        if (this.gForbinCreate) return null;

        let callback2 = () => {
            return new Promise<void>((resolve) => {
                callback();
                resolve();
            });
        }
        const release = await this._rwLock.acquireWrite(LockKey);
        let hasReleased = false;
        try {
            const id = setTimeout(async () => {
                if (this.gForbinCreate) {
                    this.finish(id);
                    return;
                }
                await awaitManager.instance.create(callback2);
                this.finish(id);
            }, timeout);
            this._timeoutMap.set(id, true);
            release();
            hasReleased = true;
            return id;
        } finally {
            if (!hasReleased) release();
        }
    }

    /** 主动标记某个 await 完成 */
    public finish(id: TimeoutID) {
        const info = this._timeoutMap.get(id);
        if (info) {
            this._timeoutMap.delete(id);
        }
    }

    /** 取消所有 tween */
    public cancelAll() {
        this.gForbinCreate = true;
        console.log("cancel setTimeout count:", this._timeoutMap.size);
        this._timeoutMap.forEach((_, id) => {
            clearTimeout(id);
        });
        this._timeoutMap.clear();
        console.log("cancel setTimeout finished:");
    }
}