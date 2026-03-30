import { DynamicAtlasManager, macro } from "cc";

// 动态合图，开启会减少drawcall，但是会增加内存消耗
export function updateDynamicCompositeImage(open: boolean) {
    if (open) {
        macro.CLEANUP_IMAGE_CACHE = false;
        DynamicAtlasManager.instance.enabled = true;
    } else {
        macro.CLEANUP_IMAGE_CACHE = true;
        DynamicAtlasManager.instance.enabled = false;
    }
}

// 重建动态图集，减少内存，切换场景会自动去除动态合集，但是本项目没有切换场景需求，所以需要手动调用
export function resetDynamicCompositeImage(){
    DynamicAtlasManager.instance.reset();
}
