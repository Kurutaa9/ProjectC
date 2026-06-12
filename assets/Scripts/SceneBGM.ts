const { ccclass, property } = cc._decorator;

import BGMManager from "./BGMManager";

@ccclass
export default class SceneBGM extends cc.Component {

    @property(cc.AudioClip)
    bgmClip: cc.AudioClip = null;

    @property
    loop: boolean = true;

    @property
    forceRestart: boolean = false;

    start(): void {
        if (!this.bgmClip) {
            cc.warn("SceneBGM: 尚未設定 bgmClip");
            return;
        }

        BGMManager.getInstance().playBGM(this.bgmClip, this.loop, this.forceRestart);
    }
}