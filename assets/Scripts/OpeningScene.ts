const { ccclass, property } = cc._decorator;

enum OpeningState {
    Idle = 0,
    FadeIn = 1,
    Typing = 2,
    Waiting = 3,
    FadeOut = 4,
    Finished = 5
}

@ccclass
export default class OpeningScene extends cc.Component {

    @property(cc.Label)
    narrationLabel: cc.Label = null;

    @property([cc.String])
    narrationTexts: string[] = [
        "Long ago, the world was protected by a powerful treasure known as the Element Core.",
        "But one day, the Element Core disappeared.",
        "Without its power, the world began to fall into chaos.",
        "To save the world, two young guardians were chosen.",
        "Aqua, the Guardian of Water, and Ignis, the Guardian of Fire.",
        "Their powers are completely different, but neither of them can complete the journey alone.",
        "Only by working together can they pass through the five trials, and find the Element Core.",
        "Their adventure begins now."
    ];

    @property
    nextSceneName: string = "Menu";

    @property
    typeInterval: number = 0.045;

    @property
    fadeInTime: number = 0.6;

    @property
    fadeOutTime: number = 0.45;

    private currentIndex: number = 0;
    private currentCharIndex: number = 0;
    private currentText: string = "";

    private state: OpeningState = OpeningState.Idle;
    private isChangingParagraph: boolean = false;

    onLoad(): void {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    start(): void {
        if (!this.narrationLabel) {
            cc.error("OpeningScene: narrationLabel 尚未設定");
            return;
        }

        this.narrationLabel.string = "";
        this.narrationLabel.node.opacity = 0;

        this.currentIndex = 0;
        this.playCurrentParagraph();
    }

    onDestroy(): void {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this.unschedule(this.typeNextCharacter);
    }

    private playCurrentParagraph(): void {
        if (this.currentIndex >= this.narrationTexts.length) {
            this.finishOpening();
            return;
        }

        this.isChangingParagraph = false;
        this.state = OpeningState.FadeIn;

        this.currentText = this.narrationTexts[this.currentIndex];
        this.currentCharIndex = 0;

        this.narrationLabel.string = "";
        this.narrationLabel.node.opacity = 0;
        this.narrationLabel.node.active = true;

        cc.Tween.stopAllByTarget(this.narrationLabel.node);

        cc.tween(this.narrationLabel.node)
            .to(this.fadeInTime, { opacity: 255 })
            .call(() => {
                this.startTyping();
            })
            .start();
    }

    private startTyping(): void {
        if (this.state === OpeningState.Finished) {
            return;
        }

        this.state = OpeningState.Typing;
        this.currentCharIndex = 0;
        this.narrationLabel.string = "";

        this.unschedule(this.typeNextCharacter);
        this.schedule(this.typeNextCharacter, this.typeInterval);
    }

    private typeNextCharacter(): void {
        if (this.state !== OpeningState.Typing) {
            return;
        }

        if (this.currentCharIndex >= this.currentText.length) {
            this.unschedule(this.typeNextCharacter);
            this.state = OpeningState.Waiting;
            return;
        }

        this.currentCharIndex++;
        this.narrationLabel.string = this.currentText.substring(0, this.currentCharIndex);
    }

    private onKeyDown(event: cc.Event.EventKeyboard): void {
        if (event.keyCode !== cc.macro.KEY.space) {
            return;
        }

        if (this.state === OpeningState.Finished) {
            return;
        }

        // 狀況 1：正在逐字出現時，按空白鍵直接顯示完整文字
        if (this.state === OpeningState.Typing) {
            this.showFullCurrentText();
            return;
        }

        // 狀況 2：文字已經完整顯示，按空白鍵才進入下一段
        if (this.state === OpeningState.Waiting) {
            this.goToNextParagraph();
            return;
        }

        // 狀況 3：淡入期間按空白鍵，先讓文字直接完整出現
        if (this.state === OpeningState.FadeIn) {
            cc.Tween.stopAllByTarget(this.narrationLabel.node);
            this.narrationLabel.node.opacity = 255;
            this.showFullCurrentText();
            return;
        }
    }

    private showFullCurrentText(): void {
        this.unschedule(this.typeNextCharacter);

        this.currentCharIndex = this.currentText.length;
        this.narrationLabel.string = this.currentText;
        this.narrationLabel.node.opacity = 255;

        this.state = OpeningState.Waiting;
    }

    private goToNextParagraph(): void {
        if (this.isChangingParagraph) {
            return;
        }

        this.isChangingParagraph = true;

        this.unschedule(this.typeNextCharacter);
        cc.Tween.stopAllByTarget(this.narrationLabel.node);

        this.state = OpeningState.FadeOut;

        cc.tween(this.narrationLabel.node)
            .to(this.fadeOutTime, { opacity: 0 })
            .call(() => {
                this.currentIndex++;
                this.playCurrentParagraph();
            })
            .start();
    }

    private finishOpening(): void {
        this.state = OpeningState.Finished;

        this.unschedule(this.typeNextCharacter);
        cc.Tween.stopAllByTarget(this.narrationLabel.node);

        cc.director.loadScene(this.nextSceneName);
    }
}