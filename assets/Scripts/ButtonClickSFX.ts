const { ccclass, property } = cc._decorator;

import BGMManager from "./BGMManager";

@ccclass
export default class ButtonClickSFX extends cc.Component {

    @property(cc.AudioClip)
    clickSFX: cc.AudioClip = null;

    onEnable(): void {
        this.node.off("click", this.playClickSFX, this);
        this.node.on("click", this.playClickSFX, this);
    }

    onDisable(): void {
        this.node.off("click", this.playClickSFX, this);
    }

    private playClickSFX(): void {
        if (!this.clickSFX) {
            cc.warn("ButtonClickSFX: 尚未設定 clickSFX");
            return;
        }

        BGMManager.getInstance().playSFX(this.clickSFX);
    }
}