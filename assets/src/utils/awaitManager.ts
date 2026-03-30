import { _decorator, Component, Node } from 'cc';
import { AsyncRWLockManager } from './lock';
const { ccclass, property } = _decorator;

export type AwaitID = string;
const LockKey = "awaitManager";

@ccclass('awaitManager')
export class awaitManager {
    private static _instance: awaitManager;
    public static get instance(): awaitManager {
        if (!this._instance) this._instance = new awaitManager();
        return this._instance;
    }

    /** 保存所有 await 的控制对象 */
    private _awaitMap: Map<AwaitID, { promise: Promise<void>; resolve: () => void }> = new Map();
    private _rwLock = AsyncRWLockManager.getInstance();
    private _idCounter = 0;

    // 是否停止注册
    private gForbinCreate: boolean = false;

    public init() {
        this.gForbinCreate = false;
        this._awaitMap.clear();
        this._awaitMap = new Map();
        this._idCounter = 0;
        this._rwLock.clear(LockKey);
    }

    private generateAwaitID() {
        // 用位运算快速取随机数（比 Math.random().toString(16) 快很多）
        const rand = (Math.random() * 0xFFFF) | 0;
        this._idCounter = (this._idCounter + 1) & 0xFFFF; // 保证在 0~65535 内循环
        const time = Date.now() & 0xFFFFFFF; // 时间戳低28位（足够区分几天内的动画）
        // 拼接为短字符串 ID
        return `await_${time.toString(16)}${this._idCounter.toString(16)}${rand.toString(16)}`;
    }

    /** 创建一个可管理的 await */
    public async create<T>(fn: () => Promise<T>): Promise<T> {
        if (this.gForbinCreate) return Promise.resolve(undefined as unknown as T);;

        const id = this.generateAwaitID();
        const release = await this._rwLock.acquireWrite(LockKey);
        let hasReleased = false;
        try {
            if (this.gForbinCreate) return Promise.resolve(undefined as unknown as T);;
            let resolveFunc: () => void;
            const p = new Promise<void>(resolve => { resolveFunc = resolve; });
            this._awaitMap.set(id, { promise: p, resolve: resolveFunc! });
            release();
            hasReleased = true;
            const result = await fn();
            return result;
        } finally {
            this.finish(id);
            if (!hasReleased) release();
        }
    }

    /** 批量注册一组 await（类似 Promise.all，但受管理） */
    public async createAll<T>(items: (Promise<T> | (() => Promise<T>))[]): Promise<T[]> {
        if (this.gForbinCreate) return Promise.resolve([]);

        const wrapped = items.map(item => {
            if (typeof item === "function") {
                // 如果是函数，就直接交给 create()
                return this.create(item);
            } else {
                // 如果是 Promise，就包成函数再交给 create()
                return this.create(() => item);
            }
        });

        return Promise.all(wrapped);
    }

    /** 外部监听，等待所有当前注册的 await 都执行完毕 */
    public async waitAllFinish(): Promise<void> {
        this.gForbinCreate = true;
        console.log("wait await count:", this._awaitMap.size);
        const allPromises = Array.from(this._awaitMap.values()).map(info => info.promise);
        await Promise.all(allPromises).catch(
            (err) => {
                if (err) console.error("Fail to awaitManager waitAllFinish, err: ", err);
            }
        );
        this.init();
        console.log("wait await finished");
    }

    /** 主动标记某个 await 完成 */
    public finish(id: AwaitID) {
        const info = this._awaitMap.get(id);
        if (info) {
            info.resolve();
            this._awaitMap.delete(id);
        }
    }
}


