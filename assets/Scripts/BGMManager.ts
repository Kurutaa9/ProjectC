const { ccclass, property } = cc._decorator;

@ccclass
export default class BGMManager extends cc.Component {

    private static instance: BGMManager = null;

    private static readonly STORAGE_KEY_BGM_VOLUME: string = "bgm_volume";
    private static readonly STORAGE_KEY_SFX_VOLUME: string = "sfx_volume";

    private currentBGMName: string = "";

    private bgmVolume: number = 1;
    private sfxVolume: number = 1;

    public static getInstance(): BGMManager {
        if (BGMManager.instance && cc.isValid(BGMManager.instance.node)) {
            return BGMManager.instance;
        }

        const managerNode = new cc.Node("BGMManager");
        const manager = managerNode.addComponent(BGMManager);

        cc.game.addPersistRootNode(managerNode);

        BGMManager.instance = manager;

        return manager;
    }

    onLoad(): void {
        if (BGMManager.instance && BGMManager.instance !== this) {
            this.node.destroy();
            return;
        }

        BGMManager.instance = this;
        cc.game.addPersistRootNode(this.node);

        this.loadVolumes();

        cc.audioEngine.setMusicVolume(this.bgmVolume);
        cc.audioEngine.setEffectsVolume(this.sfxVolume);
    }

    public playBGM(clip: cc.AudioClip, loop: boolean = true, forceRestart: boolean = false): void {
        if (!clip) {
            cc.warn("BGMManager: 沒有指定 BGM AudioClip");
            return;
        }

        const clipName = clip.name;

        if (!forceRestart && this.currentBGMName === clipName) {
            cc.audioEngine.setMusicVolume(this.bgmVolume);
            return;
        }

        cc.audioEngine.stopMusic();

        this.currentBGMName = clipName;

        cc.audioEngine.playMusic(clip, loop);
        cc.audioEngine.setMusicVolume(this.bgmVolume);
    }

    public stopBGM(): void {
        cc.audioEngine.stopMusic();
        this.currentBGMName = "";
    }

    public setBGMVolume(volume: number): void {
        volume = Math.max(0, Math.min(1, volume));

        this.bgmVolume = volume;

        cc.audioEngine.setMusicVolume(this.bgmVolume);
        cc.sys.localStorage.setItem(BGMManager.STORAGE_KEY_BGM_VOLUME, this.bgmVolume.toString());
    }

    public getBGMVolume(): number {
        return this.bgmVolume;
    }

    public playSFX(clip: cc.AudioClip): void {
        if (!clip) {
            cc.warn("BGMManager: 沒有指定 SFX AudioClip");
            return;
        }

        cc.audioEngine.setEffectsVolume(this.sfxVolume);
        cc.audioEngine.playEffect(clip, false);
    }

    public setSFXVolume(volume: number): void {
        volume = Math.max(0, Math.min(1, volume));

        this.sfxVolume = volume;

        cc.audioEngine.setEffectsVolume(this.sfxVolume);
        cc.sys.localStorage.setItem(BGMManager.STORAGE_KEY_SFX_VOLUME, this.sfxVolume.toString());
    }

    public getSFXVolume(): number {
        return this.sfxVolume;
    }

    private loadVolumes(): void {
        this.bgmVolume = this.loadVolumeValue(BGMManager.STORAGE_KEY_BGM_VOLUME, 1);
        this.sfxVolume = this.loadVolumeValue(BGMManager.STORAGE_KEY_SFX_VOLUME, 1);
    }

    private loadVolumeValue(key: string, defaultValue: number): number {
        const savedValue = cc.sys.localStorage.getItem(key);

        if (savedValue === null || savedValue === undefined || savedValue === "") {
            return defaultValue;
        }

        const parsedValue = parseFloat(savedValue);

        if (isNaN(parsedValue)) {
            return defaultValue;
        }

        return Math.max(0, Math.min(1, parsedValue));
    }
}