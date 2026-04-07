/* 事件使用，全局定义一次即可 */

import { EventTarget } from "cc";

export const GEventTarget = new EventTarget();

export enum GEventType {
    GEventGameMusicChange,

    GEventSetGameStatus,
}
