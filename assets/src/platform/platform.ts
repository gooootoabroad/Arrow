// 平台管理，区分抖音，微信

import { sys } from "cc";
import { PlatformBase } from "./base";
import { WeChatPlatform } from "./weChat";
import { TestPlatform } from "./test";
import { ByteDancePlatform } from "./byteDance";
import { TaobaoPlatform } from "./taobao";
import { AliplayPlatform } from "./aliplay";

function initPlatform(): PlatformBase {
    switch (sys.platform) {
        case sys.Platform.WECHAT_GAME:
            console.log("platform wx");
            return new WeChatPlatform();
        case sys.Platform.BYTEDANCE_MINI_GAME:
            console.log("platform bytedance");
            return new ByteDancePlatform();
        case sys.Platform.TAOBAO_MINI_GAME:
            console.log("platfrom taobao");
            return new TaobaoPlatform();
        case sys.Platform.ALIPAY_MINI_GAME:
            console.log("platfrom Aliplay");
            return new AliplayPlatform();
        default:
            console.log("platform local");
            return new TestPlatform();
    }
}

export const GPlatform = initPlatform();
