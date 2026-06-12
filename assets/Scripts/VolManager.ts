// 把原本的 export default class 改成這樣：
export class SettingsManager {
    public static bgmVolume: number = 0.5; 
    public static sfxVolume: number = 0.5;

    public static reset() {
        this.bgmVolume = 0.5;
        this.sfxVolume = 0.5;
    }
}