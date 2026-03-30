import { AudioClip, AudioSource, Node, director } from "cc";

/**
 * 音频控制器
 */
export class AudioMgr {
    private static _inst: AudioMgr;
    static get inst(): AudioMgr {
        if (!this._inst) {
            this._inst = new AudioMgr();
            this._inst.volume = 1;
        }
        return this._inst;
    }

    private static _background: AudioMgr;
    static get background(): AudioMgr {
        if (!this._background) {
            this._background = new AudioMgr();
            this._background.volume = 1;
        }
        return this._background;
    }

    private _audio: AudioSource;
    private _audioMap: Map<AudioClip, number> = new Map();

    constructor() {
        let audioMrg = new Node('AudioMgr');
        director.getScene().addChild(audioMrg);
        director.addPersistRootNode(audioMrg);

        this._audio = audioMrg.addComponent(AudioSource);
        this._audio.playOnAwake = true;
    }

    get audio() {
        return this._audio;
    }

    get volume(): number {
        return this._audio.volume;
    }

    set volume(value: number) {
        this._audio.volume = value;
    }

    playOneShot(sound: AudioClip, delay = 0.2) {
        let now = Date.now();
        const time = this._audioMap.get(sound) ?? 0;
        if ((now - time) >= (delay * 1000)) {
            this._audioMap.set(sound, now);
            this._audio.playOneShot(sound);
            return true;
        }
        return false;
    }

    play(sound: AudioClip) {
        this._audio.stop();
        this._audio.clip = sound;
        this._audio.loop = true;
        this._audio.play();
    }

    stop() {
        this._audio.stop();
    }

    pause() {
        this._audio.pause();
    }

    resume() {
        this._audio.play();
    }
}