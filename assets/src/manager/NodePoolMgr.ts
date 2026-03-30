import { instantiate, isValid, Node, NodePool, Prefab } from 'cc';
import { Controller } from '../components/Controller';

export class NodePoolMgr {

    static maxPoolCount = 50
    private static _pool: Map<Node | Prefab, NodePool> = new Map()

    private static getPool(v: Node | Prefab) {
        let pool = this._pool.get(v)
        if (!pool) {
            pool = new NodePool()
            this._pool.set(v, pool)
        }
        return pool
    }

    static gets(v: Node | Prefab, count: number = 1): Node[] {
        if (count <= 0) {
            return []
        }
        let pool = this.getPool(v)
        let result = []
        for (let i = 0; i < count; i++) {
            result.push(this.get(v, pool))
        }
        return result
    }

    static get(v: Node | Prefab, pool: NodePool = null): Node {
        if (!pool) {
            pool = this.getPool(v)
        }
        let node: Node = undefined
        if (pool.size() > 0) {
            node = pool.get()
        }
        else {
            if (v instanceof Node) {
                node = instantiate(v)
            }
            else if (v instanceof Prefab) {
                node = instantiate(v)
            }
        }
        if (node) {
            node.active = true
            node.destroy = (...args: any[]) => {
                const pool = this.getPool(v)
                if (pool && pool.size() > this.maxPoolCount) {
                    this.emitUnuse(node)
                    return Node.prototype.destroy.call(node, ...args)
                }
                else {
                    this.put(node)
                    return false
                }
            }
            node._destroyImmediate = (...args: any[]) => {
                const pool = this.getPool(v)
                if (pool && pool.size() > this.maxPoolCount) {
                    this.emitUnuse(node)
                    Node.prototype._destroyImmediate.call(node, ...args)
                }
                else {
                    this.put(node)
                }
            }
            node.setValue('__pool', pool)
        }

        return node
    }

    static puts(nodes: Node[]) {
        if (nodes.length === 0) {
            return
        }
        for (let i = nodes.length - 1; i >= 0; i--) {
            this.put(nodes[i])
        }
    }

    static put(node: Node) {
        if (!isValid(node, true)) {
            return
        }
        let pool = node.getValue('__pool') as NodePool
        if (!pool) {
            node.destroy()
            return
        }
        this.emitUnuse(node)

        pool.put(node)
        node.destroy = Node.prototype.destroy;
        node._destroyImmediate = Node.prototype._destroyImmediate;
    }

    static emitUnuse(node: Node) {
        node.setValue('__pool', null)
        node.getComponent(Controller)?.unuse()
    }

    static clear() {
        for (let pool of this._pool.values()) {
            pool.clear()
        }
        this._pool.clear()
    }
}

