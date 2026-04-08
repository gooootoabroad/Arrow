import { _decorator, Component, Node } from 'cc';
import { GameController } from './GameController';
import { GEventTarget, GEventType } from '../../common/event';
import { Bundle } from '../../global/bundle';
import { AudioClip } from 'cc';
import { AudioMgr } from '../../manager/AudioMgr';
import { ResourceMgr } from '../../manager/ResourceMgr';
import { GameStatus } from '../type/types';
import { Core } from '../../global/Core';
import { GameRuntime } from '../runtime/gameRuntime';
import { RunScene } from '../../controller/RunScene';
import { SceneName } from '../../global/IGame';
const { ccclass, property } = _decorator;

@ccclass('GameCanvas')
export class GameCanvas extends Component {
    @property(GameController)
    private gameScript: GameController = null;

    private isDealing: boolean = false;

    protected onLoad(): void {
        GEventTarget.on(GEventType.GEventSetGameStatus, this.dealGameStatus, this);
        GEventTarget.on(GEventType.GEventGameMusicChange, this.dealGameMusice, this);
    }

    protected onDestroy(): void {
        GEventTarget.off(GEventType.GEventSetGameStatus, this.dealGameStatus, this);
        GEventTarget.off(GEventType.GEventGameMusicChange, this.dealGameMusice, this);
    }

    async start() {
        let clip = await Bundle.get(Bundle.audio, 'gameMusic', AudioClip);
        AudioMgr.background.play(clip);
        this.dealGameMusice();
        ResourceMgr.initAsyncResource();
        this.doStartGame();
    }

    private dealGameStatus(status: GameStatus) {
        switch (status) {
            case GameStatus.Start: {
                return this.doStartGame();
            }
            case GameStatus.Revive: {
                return this.doRevie();
            }
            case GameStatus.ReturnMain: {
                return this.returnMainCanvas();
            }

        }
    }

    private async doStartGame() {
        await ResourceMgr.waitCancelAsyncResource();
        this.gameScript.clear();
        setTimeout(() => {
            ResourceMgr.initAsyncResource();
            this.gameStart();
        }, 500);
    }

    private gameStart() {
        this.gameScript.startGame();
    }

    private doRevie() {
        this.gameScript.revive();
    }

    private dealGameMusice() {
        if (Core.userInfo.settingConfig.musicEnabled) {
            AudioMgr.background.resume();
        } else {
            AudioMgr.background.pause();
        }
    }

    private async returnMainCanvas() {
        if (this.isDealing) return;
        this.isDealing = true;
        await ResourceMgr.waitCancelAsyncResource();
        this.gameScript.clear();
        RunScene.show(SceneName.Main);
    }
}

