import { updateDynamicCompositeImage } from "../utils/dynamicCompositeImage";

// 游戏配置
export const GConfig = {
    testing: false,
    noAD: false,
}

export function setGconfigNoADFeild(b: boolean) {
    GConfig.noAD = b;
}

// 强制开启动态合图，减少drawcall，但是会增加内存，默认最大生成5张动态合图
updateDynamicCompositeImage(true);