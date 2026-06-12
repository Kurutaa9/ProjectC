const { ccclass, property } = cc._decorator;

@ccclass
export default class BGMManager extends cc.Component {

    private static instance: BGMManager = null;

    private static readonly STORAGE_KEY_BGM_VOLUME: string = "bgm_volume";

    private currentBGMName: string = "";

    private bgmVolume: number = 1;

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

        this.loadVolume();
        cc.audioEngine.setMusicVolume(this.bgmVolume);
    }

    public playBGM(clip: cc.AudioClip, loop: boolean = true, forceRestart: boolean = false): void {
        if (!clip) {
            cc.warn("BGMManager: 沒有指定 AudioClip");
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

    private loadVolume(): void {
        const savedValue = cc.sys.localStorage.getItem(BGMManager.STORAGE_KEY_BGM_VOLUME);

        if (savedValue === null || savedValue === undefined || savedValue === "") {
            this.bgmVolume = 1;
            return;
        }

        const parsedValue = parseFloat(savedValue);

        if (isNaN(parsedValue)) {
            this.bgmVolume = 1;
            return;
        }

        this.bgmVolume = Math.max(0, Math.min(1, parsedValue));
    }
}