import { _decorator, CCObject, Color, Enum, Node, Sprite, SpriteFrame } from 'cc';
import { Controller } from './Controller';
const { ccclass, property, executeInEditMode } = _decorator;

export enum UISpriteType {
    /* 容器大小 */
    Fill,
    /* 容器内完全可见的最大尺寸 */
    Contain,
    /* 完全覆盖容器的最小尺寸 */
    Cover,
    /* 原图大小 */
    None,
}

@ccclass('UISprite')
@executeInEditMode(true)
export class UISprite extends Controller {

    @property
    _color = Color.WHITE.clone();

    @property
    get color() {
        return this._color;
    }
    set color(value: Color) {
        this._color = value;
        this._onUpdateSprite();
    }

    @property(SpriteFrame)
    _spriteFrame: SpriteFrame;

    @property(SpriteFrame)
    get spriteFrame(): SpriteFrame {
        return this._spriteFrame;
    }
    set spriteFrame(value: SpriteFrame) {
        this._spriteFrame = value;
        this._onUpdateSprite();
    }

    @property({ type: Enum(UISpriteType) })
    _type = UISpriteType.Fill;

    @property({ type: Enum(UISpriteType) })
    get type(): UISpriteType {
        return this._type;
    }
    set type(value: UISpriteType) {
        this._type = value;
        this._onUpdateSprite();
    }

    private _sprite: Sprite;

    protected onEnable(): void {
        this.node.on(Node.EventType.SIZE_CHANGED, this._onUpdateSprite, this);
        this.node.on(Node.EventType.ANCHOR_CHANGED, this._onUpdateSprite, this);
        this._onUpdateSprite();
        this._sprite.enabled = true;
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.SIZE_CHANGED, this._onUpdateSprite, this);
        this.node.off(Node.EventType.ANCHOR_CHANGED, this._onUpdateSprite, this);
        this._sprite.enabled = false;
    }

    getSprite() {
        return this._sprite;
    }

    private _onUpdateSprite() {
        if (!this._sprite) {
            const spriteName = 'DRAW_SPRITE_NODE';
            let spriteNode = this.node.getChildByName(spriteName);
            if (!spriteNode) {
                spriteNode = new Node(spriteName);
                spriteNode.hideFlags |= CCObject.Flags.HideInHierarchy;
                this.node.insertChild(spriteNode, 0);
                let sprite = spriteNode.addComponent(Sprite);
                sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                sprite.trim = false;
            }
            this._sprite = spriteNode.getComponent(Sprite);
        }
        let spriteFrame = this.spriteFrame;
        this._sprite.spriteFrame = spriteFrame;
        this._sprite.color = this.color;
        if (!spriteFrame) {
            return;
        }
        let anchor = this.node.uiTransfrom.anchorPoint;
        let size = this.node.uiTransfrom.contentSize;
        let x = -(anchor.x - 0.5) * size.width;
        let y = -(anchor.y - 0.5) * size.height;
        this._sprite.node.setPosition(x, y, 0);

        let width: number;
        let height: number;
        const { width: imgWidth, height: imgHeight } = spriteFrame.originalSize;
        if (this.type === UISpriteType.Fill) {
            width = size.width;
            height = size.height;
        }
        else if (this.type === UISpriteType.Contain) {
            const { width: containerWidth, height: containerHeight } = size;
            const widthRatio = containerWidth / imgWidth;
            const heightRatio = containerHeight / imgHeight;
            const ratio = Math.min(widthRatio, heightRatio);
            width = imgWidth * ratio;
            height = imgHeight * ratio;
        }
        else if (this.type === UISpriteType.Cover) {
            const { width: containerWidth, height: containerHeight } = size;
            const widthRatio = containerWidth / imgWidth;
            const heightRatio = containerHeight / imgHeight;
            const ratio = Math.max(widthRatio, heightRatio);
            width = imgWidth * ratio;
            height = imgHeight * ratio;
        }
        else if (this.type === UISpriteType.None) {
            width = imgWidth;
            height = imgHeight;
        }
        this._sprite.node.uiTransfrom.setContentSize(width, height);
    }

}


