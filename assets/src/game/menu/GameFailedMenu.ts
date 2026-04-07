import { _decorator, Node, tween, v3 } from "cc";
import { TopController } from "../../components/TopController";
import { ProgressBar } from "cc";
import { Label } from "cc";
import { Prefab } from "cc";
import { Bundle } from "../../global/bundle";
import { AudioMgr } from "../../manager/AudioMgr";
import { AudioClip } from "cc";
import { UITransform } from "cc";
import { tweenManager } from "../../utils/tweenManager";
import { GEventTarget, GEventType } from "../../common/event";
import { GameStatus } from "../type/types";
import { GameRuntime } from "../runtime/gameRuntime";

const { ccclass, property } = _decorator;

@ccclass('GameFailedMenu')
export class GameFailedMenu extends TopController {
    @property(ProgressBar)
    private progressBar: ProgressBar = null;
    @property(Node)
    private spriteNode: Node = null;

    @property(Label)
    private iconLabel: Label = null;

    private isDealing: boolean = false;

    protected static async _getPrefab(): Promise<Prefab> {
        return Bundle.get(Bundle.game, "prefabs/GameFailedMenu", Prefab);
    }

    protected async _open() {
        let audio = await Bundle.get(Bundle.audio, 'failed', AudioClip);
        AudioMgr.inst.playOneShot(audio, 0.1);
        this.iconLabel.string = this.getRandomText();
        this.animateProgressTo(Math.min(GameRuntime.finishedArrow / GameRuntime.totalArrow, 1));
    }

    private getRandomText(): string {
        let texts: string[] = [
            "就差一点",
            "不想失败",
            "说好不哭",
            "再试一次",
            "差点就赢了",
            "不甘心啊",
            "马上就过了",
            "这把太亏了",
            "还能再来",
            "手滑了吧",
            "差一点点",
            "运气差一点",
            "再给我一次",
            "刚刚失误了",
            "不服再来",
            "这局不算",
            "再来就赢",
            "别停继续",
        ];

        return texts[Math.floor(Math.random() * texts.length)];
    }


    public animateProgressTo(targetProgress: number, duration: number = 1): void {
        targetProgress = Math.max(0, Math.min(1, targetProgress));

        let progressBarWidth = this.progressBar.node.getComponent(UITransform).contentSize.x;
        let spritePos = this.spriteNode.position.clone();
        let endX = spritePos.x + progressBarWidth * targetProgress;
        let targetPos = v3(endX, spritePos.y, spritePos.z);

        tweenManager.instance.create(this.progressBar, t =>
            t.to(duration, { progress: targetProgress }, { easing: 'sineOut' })
        );

        tweenManager.instance.create(this.spriteNode, t =>
            t.to(duration, { position: targetPos }, { easing: 'sineOut' })
                .call(() => {
                    let ratio = Math.floor(targetProgress * 100);
                    this.spriteNode.getComponentInChildren(Label).string = `${ratio}%`;
                    this.spriteNode.children[0].active = true;
                })
        );
    }

    onContinueClick() {
        if (this.isDealing) return;
        this.isDealing = true;
        GEventTarget.emit(GEventType.GEventSetGameStatus, GameStatus.Start);
        this.node.destroy();
    }
}