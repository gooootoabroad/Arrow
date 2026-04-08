import { _decorator } from "cc";
import { Node } from "cc";
import { Sprite } from "cc";
import { TopController } from "../../components/TopController";
import { UISprite } from "../../components/UISprite";
import { Label } from "cc";
import { Prefab } from "cc";
import { Bundle } from "../../global/bundle";
import { AudioClip } from "cc";
import { AudioMgr } from "../../manager/AudioMgr";
import { getRandomInt } from "../../utils/random";
import { LoadMgr } from "../../manager/LoadMgr";
import { GEventTarget, GEventType } from "../../common/event";
import { GameStatus } from "../type/types";
import { GameRuntime } from "../runtime/gameRuntime";
import { Core } from "../../global/Core";
import { getLevelInfo } from "../levels/levelInfo";

const { ccclass, property } = _decorator;

@ccclass('GameSuccessMenu')
export class GameSuccessMenu extends TopController {
    @property(UISprite)
    private uiSprite: UISprite = null;
    @property(Label)
    private iconLabel: Label = null;
    @property(Node)
    private unLockNode: Node = null;

    private isDealing: boolean = false;

    protected static async _getPrefab(): Promise<Prefab> {
        return Bundle.get(Bundle.game, "prefabs/GameVectoryMenu", Prefab);
    }

    protected async _open() {
        let audio = await Bundle.get(Bundle.audio, 'success', AudioClip);
        AudioMgr.inst.playOneShot(audio, 0.1);
        // 更新图片
        LoadMgr.loadSprite(Bundle.animals, GameRuntime.levelInfo.image, this.uiSprite);
        // 更新字
        this.iconLabel.string = this.getRandomText();

        // 下一关奖励
        let nextLevelInfo = getLevelInfo(Core.userInfo.level);
        if (nextLevelInfo == null) {
            this.unLockNode.active = false;
        } else {
            this.unLockNode.active = true;
            LoadMgr.loadSprite(Bundle.animals, nextLevelInfo.image, this.unLockNode.getComponentInChildren(Sprite));
            this.unLockNode.getComponentInChildren(Label).string = `下一关解锁${nextLevelInfo.name}`;
        }
    }

    private getRandomText(): string {
        let texts: string[] = [
            "又过一关！",
            "干得漂亮！",
            "太强了！",
            "完美通关！",
            "继续保持！",
            "轻松拿下！",
            "节奏很好！",
            "状态拉满！",
            "漂亮操作！",
            "再下一城！",
            "赢麻了！",
            "这波很秀！",
            "完美发挥！",
            "舒服了！",
            "就这？拿下！",
            "手感爆棚！",
            "一路通关！",
            "继续冲！",
            "无敌状态！"
        ];

        return texts[Math.floor(Math.random() * texts.length)];
    }

    onNextClick() {
        if (this.isDealing) return;
        this.isDealing = true;
        GEventTarget.emit(GEventType.GEventSetGameStatus, GameStatus.Start);
        this.node.destroy();
    }
}