import { sys } from "cc";

export function isWeChatPlatform(): boolean {
    return sys.platform == sys.Platform.WECHAT_GAME;
}

export function isByteDancePlatform(): boolean {
    return sys.platform == sys.Platform.BYTEDANCE_MINI_GAME;
}

export function isKSPlatform(): boolean {
    return typeof KSGameGlobal != 'undefined';
}