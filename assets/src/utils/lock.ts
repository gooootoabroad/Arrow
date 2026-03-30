import { VisibleError, ERROR_CODES } from "./errors";

// 互斥锁
export class Mutex {
    // 互斥锁实例
    private static instance: Mutex;
    // 锁map
    private static locks: Map<string, boolean> = new Map();

    // 获取互斥锁单例
    public static getInstance(): Mutex {
        if (!Mutex.instance) {
            Mutex.instance = new Mutex();
        }

        return Mutex.instance;
    }

    // 锁函数，使用资源ID进行加锁
    public lock(resourceId: string): void {
        // 如果已经加锁，直接报错
        if (Mutex.locks.get(resourceId)) {
            // 锁已经被占用，抛出错误
            throw new VisibleError(ERROR_CODES.LOCK_FAILED, `Mutex lock failed: resource ${resourceId} is already locked`);
        }

        // 设置锁
        const wasLocked = Mutex.locks.set(resourceId, true).get(resourceId);
        if (!wasLocked) {
            // 如果设置锁失败，抛出错误
            throw new VisibleError(ERROR_CODES.LOCK_FAILED, `Mutex lock failed: resource ${resourceId} could not be locked`);
        }
    }

    // 解锁函数
    public unlock(resourceId: string): void {
        if (!Mutex.locks.has(resourceId)) {
            return;
        }
        Mutex.locks.set(resourceId, false);
    }
}

// 读写锁
type Resolver = () => void;

interface LockState {
    readers: number;
    writer: boolean;
    queue: {
        type: "read" | "write";
        resolve: Resolver;
    }[];
}

export class AsyncRWLockManager {
    private static _instance: AsyncRWLockManager;
    private _locks = new Map<string, LockState>();

    public static getInstance() {
        if (!this._instance) this._instance = new AsyncRWLockManager();
        return this._instance;
    }

    /**
     * 获取读锁（可并发）
     */
    async acquireRead(key: string): Promise<() => void> {
        let lock = this._locks.get(key);
        if (!lock) {
            lock = { readers: 0, writer: false, queue: [] };
            this._locks.set(key, lock);
        }

        // 如果有写任务在执行或排队，则进入等待队列
        if (lock.writer || lock.queue.some(q => q.type === "write")) {
            await new Promise<void>(resolve => {
                lock!.queue.push({ type: "read", resolve });
            });
        }

        lock.readers++;
        return () => {
            lock!.readers--;
            this._tryNext(key, lock!);
        };
    }

    /**
     * 获取写锁（独占）
     */
    async acquireWrite(key: string): Promise<() => void> {
        let lock = this._locks.get(key);
        if (!lock) {
            lock = { readers: 0, writer: false, queue: [] };
            this._locks.set(key, lock);
        }

        // 写任务必须等待所有读任务结束 + 没有写任务执行中
        if (lock.writer || lock.readers > 0) {
            await new Promise<void>(resolve => {
                lock!.queue.push({ type: "write", resolve });
            });
        }

        lock.writer = true;
        return () => {
            lock!.writer = false;
            this._tryNext(key, lock!);
        };
    }

    /**
     * 尝试释放锁并唤醒下一个任务
     */
    private _tryNext(key: string, lock: LockState) {
        if (lock.writer || lock.readers > 0) return;

        while (lock.queue.length > 0) {
            const next = lock.queue[0];
            if (next.type === "read") {
                // 所有连续的读请求同时唤醒
                const readersToWake = lock.queue.filter(q => q.type === "read");
                readersToWake.forEach(q => q.resolve());
                lock.queue = lock.queue.filter(q => q.type !== "read");
                return;
            } else if (next.type === "write") {
                // 唤醒单个写请求
                lock.queue.shift();
                lock.writer = true;
                next.resolve();
                return;
            }
        }

        if (lock.queue.length === 0) {
            this._locks.delete(key);
        }
    }

    clear(key: string) {
        if (!this._locks.get(key)) return;
        this._locks.delete(key);
    }

    clearAll() {
        this._locks.clear();
    }
}