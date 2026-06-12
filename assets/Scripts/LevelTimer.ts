const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelTimer extends cc.Component {
    @property(cc.Label)
    timerLabel: cc.Label = null;

    private elapsedTime: number = 0;
    private running: boolean = true;

    update(dt: number) {
        if (!this.running) return;

        this.elapsedTime += dt;

        const seconds = Math.floor(this.elapsedTime);
        this.timerLabel.string = this.formatTime(seconds);
    }

    private formatTime(totalSeconds: number): string {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const secText = seconds < 10 ? "0" + seconds : seconds.toString();

        return `${minutes}:${secText}`;
    }

    public stopTimer(): number {
        this.running = false;
        return this.elapsedTime;
    }

    public getStarCount(): number {
        if (this.elapsedTime <= 25) return 3;
        if (this.elapsedTime <= 45) return 2;
        return 1;
    }
}