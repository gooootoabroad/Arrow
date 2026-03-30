import { director, Layers, Node, NodeEventType, RenderRoot2D, Widget } from "cc";

export class UIMgr {

    private static _instance: UIMgr;
    static get instance(): UIMgr {
        return this._instance ?? (this._instance = new UIMgr());
    }

    private _root: Node;

    dialogParent: Node;
    topParent: Node;
    persistParent: Node;

    private constructor() {
        this._root = this._createNode("UI-Root", true);
        this.dialogParent = this._createNode("UI-Dialog");
        this.topParent = this._createNode("UI-Top");
        this.persistParent = this._createNode("UI-Persist");
        this._root.on(NodeEventType.SCENE_CHANGED_FOR_PERSISTS, () => {
            for (const node of this.dialogParent.children) {
                node.destroy();
            }
            for (const node of this.topParent.children) {
                node.destroy();
            }
        });
    }

    private _createNode(name: string, persist = false) {
        let node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        if (persist) {
            director.addPersistRootNode(node);
            node.addComponent(RenderRoot2D);
        }
        else {
            node.parent = this._root;
        }

        const widget = node.addComponent(Widget);
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        widget.top = widget.bottom = widget.left = widget.right = 0;
        return node;
    }
}


