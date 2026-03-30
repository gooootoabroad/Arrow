import { Node, Vec3 } from "cc";
import { tweenManager } from "../utils/tweenManager";

// 展示打开节点
export function showOpenNode(node: Node, callback?: () => void) {
    node.scale = new Vec3(0.3, 0.3, 1);
    node.active = true;
    tweenManager.instance.create(node, t =>
        t.to(0.2, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .call(callback));
}

// 展示关闭节点
export function showCloseNode(node: Node, callback?: () => void) {
    tweenManager.instance.create(node, t =>
        t.to(0.2, { scale: new Vec3(1.1, 1.1, 1) })
            .to(0.2, { scale: new Vec3(0.3, 0.3, 1) })
            .call(callback));
}