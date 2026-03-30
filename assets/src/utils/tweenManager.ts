import { _decorator, Component, Node, tween, Tween } from 'cc';
import { AsyncRWLockManager } from './lock';
const { ccclass, property } = _decorator;

export type TweenID = string;
const LockKey = "tweenManager";

type TweenRecord = {
    tween: Tween<any>;
    resolve: (arg0:string) => void;
};

@ccclass('tweenManager')
export class tweenManager extends Component {
    private static _instance: tweenManager;
    public static get instance(): tweenManager {
        if (!this._instance) {
            this._instance = new tweenManager();
        }
        return this._instance;
    }

    /** 保存所有 tween 引用 */
    private _tweenMap: Map<TweenID, TweenRecord> = new Map();
    private _rwLock = AsyncRWLockManager.getInstance();
    private _tweenIdCounter: number = 0;

    // 是否停止注册
    private gForbinCreate: boolean = false;

    public init() {
        this.gForbinCreate = false;
        this._tweenMap.clear();
        this._tweenMap = new Map();
        this._tweenIdCounter = 0;
        this._rwLock.clear(LockKey);
    }

    /** 创建并注册 tween */
    /* @param actions 一个函数，接收 tween(target) */
    // 返回的ID有延迟不好用
    public async create<T extends object>(
        target: T,
        actions: (t: Tween<T>) => Tween<T>
    ): Promise<string> {
        return new Promise<string>(resolve => {
            if (this.gForbinCreate) return resolve("");
            const id = this.generateTweenID();

            // 构建 tween
            const tw = actions(tween(target));

            // tween 完成或取消时通知上层 Promise
            const finishCallback = () => {
                this._tweenMap.delete(id);
                resolve(id);
            };
            tw.call(finishCallback);

            // 上锁写入 map
            this._rwLock.acquireWrite(LockKey).then(release => {
                if (this.gForbinCreate) {
                    release();
                    resolve(id);
                    return;
                }
                this._tweenMap.set(id, { tween: tw, resolve });
                release();
                tw.start(); // 启动 tween 放锁外
            });
        });
    }

    /** 获取 tween */
    public async get(id: TweenID): Promise<any> {
        const release = await this._rwLock.acquireRead(LockKey);
        try {
            const tw = this._tweenMap.get(id) || null;
            return Promise.resolve(tw);
        } finally {
            release();
        }
    }

    /** 取消指定 tween */
    public async cancel(id: TweenID) {
        const release = await this._rwLock.acquireRead(LockKey);
        try {
            const t = this._tweenMap.get(id);
            if (t) {
                t.tween.stop();
                t.resolve?.(id);
                this._tweenMap.delete(id);
            }
        } finally {
            release();
        }
    }

    /** 取消所有 tween */
    public cancelAll() {
        this.gForbinCreate = true;
        console.log("cancel tween count:", this._tweenMap.size);
        this._tweenMap.forEach(task => {
            task.tween.stop();
            task.resolve?.(""); // tween 被取消，通知上层 Promise
        });
        this._tweenMap.clear();
        console.log("cancel tween finished:");
    }

    /** 是否存在指定 id 的 tween */
    public has(id: TweenID): boolean {
        return this._tweenMap.has(id);
    }

    private generateTweenID(): string {
        // 用位运算快速取随机数（比 Math.random().toString(16) 快很多）
        const rand = (Math.random() * 0xFFFF) | 0;
        this._tweenIdCounter = (this._tweenIdCounter + 1) & 0xFFFF; // 保证在 0~65535 内循环
        const time = Date.now() & 0xFFFFFFF; // 时间戳低28位（足够区分几天内的动画）
        // 拼接为短字符串 ID
        return `tw_${time.toString(16)}${this._tweenIdCounter.toString(16)}${rand.toString(16)}`;
    }

    start() {

    }

    update(deltaTime: number) {

    }
}

