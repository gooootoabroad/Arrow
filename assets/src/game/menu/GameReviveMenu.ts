import { Prefab, _decorator } from "cc";
import { TopController } from "../../components/TopController";
import { Label } from "cc";
import { Bundle } from "../../global/bundle";
import { AudioClip } from "cc";
import { AudioMgr } from "../../manager/AudioMgr";
import { GEventTarget, GEventType } from "../../common/event";
import { GPlatform } from "../../platform/platform";
import { VideoAdType } from "../../platform/type";
import { GameFailedMenu } from "./GameFailedMenu";
import { GameStatus } from "../type/types";
import { GameRuntime } from "../runtime/gameRuntime";

const { ccclass, property } = _decorator;

@ccclass('GameReviveMenu')
export class GameReviveMenu extends TopController {
    @property(Label)
    private progressLabel: Label = null;
    @property(Label)
    private fightLabel: Label = null;

    private isDealing: boolean = false;

    protected static async _getPrefab(): Promise<Prefab> {
        return Bundle.get(Bundle.game, "prefabs/GameReviveMenu", Prefab);
    }

    protected async _open() {
        let audio = await Bundle.get(Bundle.audio, 'pigFailed', AudioClip);
        AudioMgr.inst.playOneShot(audio, 0.1);
        this.updateProgress();
        this.fightLabel.string = this.getRandomText();
    }

    private getRandomText(): string {
        let texts: string[] = [
            "就差一点点了，再试一次！",
            "已经很接近成功了，加油！",
            "这一把真的能过，别放弃！",
            "差一点就赢了，再来一次！",
            "手感来了，继续冲！",
            "马上成功，坚持一下！",
            "这一局很有希望！",
            "再试一次就过了！",
            "节奏很好，继续保持！",
            "就差最后一步了！",
            "运气已经在你这边了！",
            "这把真的很接近了！",
            "再来一次，稳过！",
            "已经找到感觉了！",
            "胜利就在眼前！"
        ];

        return texts[Math.floor(Math.random() * texts.length)];
    }

    private updateProgress() {
        let ratio = Math.floor(Math.min(GameRuntime.finishedArrow / GameRuntime.totalArrow, 1) * 100);
        this.progressLabel.string = `已完成：${ratio}%`;
    }

    onReviveClick() {
        if (this.isDealing) return;
        this.isDealing = true;

        let isSuccessed = false;
        let onSuccess = () => {
            isSuccessed = true;
        }

        let onFinally = () => {
            if (isSuccessed) {
                GEventTarget.emit(GEventType.GEventSetGameStatus, GameStatus.Revive);
                this.node.destroy();
            }
            this.isDealing = false;
        }

        GPlatform.showVideoAd(VideoAdType.Revive, onSuccess, onFinally);
    }

    onCloseClick() {
        if (this.isDealing) return;
        this.isDealing = true;

        // 打开失败菜单
        GameFailedMenu.show();
        this.node.destroy();
    }
}