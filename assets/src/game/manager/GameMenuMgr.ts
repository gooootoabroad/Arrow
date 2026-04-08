import { Core } from "../../global/Core";
import { GPlatform } from "../../platform/platform";
import { GameFailedMenu } from "../menu/GameFailedMenu";
import { GameReviveMenu } from "../menu/GameReviveMenu";
import { GameSuccessMenu } from "../menu/GameSuccessMenu";
import { GameRuntime } from "../runtime/gameRuntime";

export class GameMenuMgr {
    private static _canRevive: boolean = true;

    static showingMenu: boolean = false;

    static init() {
        this._canRevive = true;
        this.showingMenu = false;
    }

    static showFailedMenu(forbiddenRevive: boolean = false) {
        if (this.showingMenu) return;
        this.showingMenu = true;
        GameRuntime.pause = true;
        if (!forbiddenRevive && this._canRevive) {
            GameReviveMenu.show();
            this._canRevive = false;
        } else {
            GameFailedMenu.show();
        }

        this.showingMenu = false;
    }

    static showSuccessMenu() {
        if (this.showingMenu) return;
        this.showingMenu = true;
        if (Core.userInfo.level == 3) {
            // 第三关过了，展示下推荐
            GPlatform.showRecommend();
        }
        Core.userInfo.level += 1;
        GameSuccessMenu.show();
        this.showingMenu = false;
    }
}