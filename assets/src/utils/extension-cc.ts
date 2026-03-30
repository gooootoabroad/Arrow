import { CCObject, Component, Node, sp, UIOpacity, UITransform, v2, v3, Vec2 } from "cc";

declare module 'cc' {

    interface CCObject {
        info?: any,
        getValue(key: string, defaultValue?: any): any;
        setValue(key: string, value: any): void;
    }

    interface Node {
        uid?: number;
        /**
         * 每次调用会获取当前position的值
         */
        get tempPosition(): Vec3;

        /**
         * 每次调用会获取当前worldPosition的值
         */
        get tempWorldPosition(): Vec3;

        /**
         * 每次调用会获取当前scale的值
         */
        get tempScale(): Vec3;

        /**
         * 获取UITransform
         */
        get uiTransfrom(): UITransform;

        /**
         * 获取当前节点透明度(0-255)
         */
        get opacity(): number;

        /**
         * 设置当前节点透明度(0-255)
         */
        set opacity(v: number);

        /**
         * 获取Rect
         */
        getBoundingBox(): Rect;

        /**
         * 在2D下，让节点看向某个位置（比如让箭头朝向这个position，箭头默认朝向应该是↑并且箭头顶端在原点）
         * @param position 
         * @param isWorld 是否是世界坐标，默认为false（本地坐标）
         */
        lookPosition(position: Vec3, isWorld?: boolean): void;

        /**
         * 添加不可重复唯一的组件
         * @param classConstructor 
         */
        addUniqueComponent<T extends Component>(classConstructor: __private.__types_globals__Constructor<T>): T | null;

    }

    interface Component {
        /**
         * 添加不可重复唯一的组件
         * @param classConstructor 
         */
        addUniqueComponent<T extends Component>(classConstructor: __private.__types_globals__Constructor<T>): T | null;
    }

    namespace sp {
        interface Skeleton {

            /**
             * 开启自动混合动画
             * @param duration 
             */
            openAutoMixAnimation(duration: number): void;

            /**
             * 播放动画
             * @param name 动作名
             * @param loop 是否循环
             * @param call 动作播放结束回调，会自动加监听setCompleteListener
             */
            play(name: string, loop: boolean, call?: __private._cocos_spine_skeleton__TrackListener): sp.spine.Animation;

            /**
             * 播放单次动画
             * @param name 
             * @param call 
             */
            playOnce(name: string, call?: __private._cocos_spine_skeleton__TrackListener): sp.spine.Animation;
        }
    }

}

const v2_1 = v2();

CCObject.prototype.getValue = function (key, defaultValue?) {
    if (!this.info) { this.info = {}; }
    return this.info[key] ?? defaultValue;
}

CCObject.prototype.setValue = function (key, value) {
    if (!this.info) { this.info = {}; }
    this.info[key] = value;
}

Object.defineProperty(Node.prototype, "tempPosition", {
    get: function () {
        let self = this as Node;
        let tempPos = getImplicitProperty(self, 'tempPosition', () => v3());
        return self.getPosition(tempPos);
    },
    enumerable: false,
    configurable: true,
})

Object.defineProperty(Node.prototype, "tempWorldPosition", {
    get: function () {
        let self = this as Node;
        let tempPos = getImplicitProperty(self, 'tempWorldPosition', () => v3());
        return self.getWorldPosition(tempPos);
    },
    enumerable: false,
    configurable: true,
})

Object.defineProperty(Node.prototype, "tempScale", {
    get: function () {
        let self = this as Node;
        let tempPos = getImplicitProperty(self, 'tempScale', () => v3());
        return self.getScale(tempPos);
    },
    enumerable: false,
    configurable: true,
})

Object.defineProperty(Node.prototype, "uiTransfrom", {
    get: function () {
        let self = this as Node;
        return getImplicitProperty(self, 'uiTransfrom', () => self.getComponent(UITransform));
    },
    enumerable: false,
    configurable: true,
})

Object.defineProperty(Node.prototype, "opacity", {
    get: function () {
        let self = this as Node;
        let comp = self.addUniqueComponent(UIOpacity);
        return comp.opacity;
    },
    set: function (v) {
        let self = this as Node;
        let comp = self.addUniqueComponent(UIOpacity);
        comp.opacity = v;
    },
    enumerable: false,
    configurable: true,
})

Node.prototype.getBoundingBox = function () {
    let self = this as Node;
    return self.uiTransfrom.getBoundingBox();
}

Node.prototype.lookPosition = function (position, isWorld = false) {
    let self = this as Node;
    let selfPos = isWorld ? self.worldPosition : self.position;
    v2_1.set(position.x - selfPos.x, position.y - selfPos.y).normalize();
    self.angle = Vec2.UNIT_Y.signAngle(v2_1) / Math.PI * 180;
}

Node.prototype.addUniqueComponent = function (comp) {
    let self = this as Node;
    return self.getComponent(comp) ?? self.addComponent(comp);
}

Component.prototype.addUniqueComponent = function (comp) {
    let self = this as Component;
    return self.node.addUniqueComponent(comp);
}

if (sp && sp.Skeleton) {
    sp.Skeleton.prototype.openAutoMixAnimation = function (duration) {
        let self = this as sp.Skeleton;
        self['__AutoMixDuration__'] = duration;
    }

    sp.Skeleton.prototype.play = function (name, loop, call) {
        let self = this as sp.Skeleton;
        let animation = self.findAnimation(name);
        if (animation) {
            let mixDuration = self['__AutoMixDuration__'];
            if (!!mixDuration) {
                self.setMix(self.animation, name, mixDuration);
            }
            self.setAnimation(0, name, loop);
            if (!!call && !loop) {
                self.setCompleteListener(x => {
                    self.setCompleteListener(null);
                    if (x.animation.name === name && call) {
                        call(x);
                    }
                });
            }
            else {
                self.setCompleteListener(null);
            }
        }
        else {
            self.setCompleteListener(null);
        }
        return animation;
    }

    sp.Skeleton.prototype.playOnce = function (name, call) {
        let self = this as sp.Skeleton;
        return self.play(name, false, call);
    }
}

/**
 * 获取隐式的属性
 */
export function getImplicitProperty<T>(target: any, key: string, defaultValue: () => T): T {
    key = `__${key.toUpperCase()}`;
    let value = target[key];
    if (!value) {
        value = defaultValue();
        target[key] = value;
    }
    return value;
}


