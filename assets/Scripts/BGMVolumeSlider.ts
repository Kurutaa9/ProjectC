const { ccclass, property } = cc._decorator;

import BGMManager from "./BGMManager";

@ccclass
export default class BGMVolumeSlider extends cc.Component {

    @property(cc.Slider)
    slider: cc.Slider = null;

    @property(cc.Label)
    volumeLabel: cc.Label = null;

    start(): void {
        if (!this.slider) {
            this.slider = this.getComponent(cc.Slider);
        }

        if (!this.slider) {
            cc.warn("BGMVolumeSlider: 找不到 Slider component");
            return;
        }

        const currentVolume = BGMManager.getInstance().getBGMVolume();

        this.slider.progress = currentVolume;
        this.updateVolumeLabel(currentVolume);

        this.slider.node.off("slide", this.onSliderChanged, this);
        this.slider.node.on("slide", this.onSliderChanged, this);
    }

    onDestroy(): void {
        if (this.slider) {
            this.slider.node.off("slide", this.onSliderChanged, this);
        }
    }

    private onSliderChanged(): void {
        if (!this.slider) {
            return;
        }

        const volume = this.slider.progress;

        BGMManager.getInstance().setBGMVolume(volume);
        this.updateVolumeLabel(volume);
    }

    private updateVolumeLabel(volume: number): void {
        if (!this.volumeLabel) {
            return;
        }

        const percent = Math.round(volume * 100);
        this.volumeLabel.string = percent.toString() + "%";
    }
}