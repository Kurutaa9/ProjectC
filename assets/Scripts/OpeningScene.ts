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

    @property(cc.Node)
    textRoot: cc.Node = null;

    @property(cc.Label)
    lineTemplate: cc.Label = null;

    @property([cc.String])
    narrationTexts: string[] = [
        "Long ago, two spirits were chosen\\nto protect the balance of the elements.",
        "One carried the warmth of fire.\\nThe other guarded the flow of water.",
        "But deep inside the forgotten cave,\\nan ancient power began to awaken.",
        "To restore peace,\\nthey must pass through five trials\\nand uncover the hidden treasure."
    ];

    @property
    nextSceneName: string = "LevelSelect";

    @property
    typeInterval: number = 0.045;

    @property
    fadeInTime: number = 0.6;

    @property
    fadeOutTime: number = 0.45;

    @property
    lineHeight: number = 40;

    @property
    estimatedCharWidth: number = 10;

    private currentIndex: number = 0;
    private currentLines: string[] = [];

    private currentLineIndex: number = 0;
    private currentCharIndex: number = 0;

    private generatedLabels: cc.Label[] = [];
    private generatedNodes: cc.Node[] = [];

    private state: OpeningState = OpeningState.Idle;
    private isChangingParagraph: boolean = false;

    onLoad(): void {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    start(): void {
        if (!this.textRoot) {
            cc.error("OpeningScene: textRoot 尚未設定");
            return;
        }

        if (!this.lineTemplate) {
            cc.error("OpeningScene: lineTemplate 尚未設定");
            return;
        }

        this.lineTemplate.node.active = false;
        this.textRoot.opacity = 0;

        this.currentIndex = 0;
        this.playCurrentParagraph();
    }

    onDestroy(): void {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this.unschedule(this.typeNextCharacter);
        this.clearGeneratedLines();
    }

    private playCurrentParagraph(): void {
        if (this.currentIndex >= this.narrationTexts.length) {
            this.finishOpening();
            return;
        }

        this.isChangingParagraph = false;
        this.state = OpeningState.FadeIn;

        this.clearGeneratedLines();

        const rawText = this.narrationTexts[this.currentIndex].replace(/\\n/g, "\n");
        this.currentLines = rawText.split("\n");

        this.createLineLabels();

        this.currentLineIndex = 0;
        this.currentCharIndex = 0;

        this.textRoot.opacity = 0;

        cc.Tween.stopAllByTarget(this.textRoot);

        cc.tween(this.textRoot)
            .to(this.fadeInTime, { opacity: 255 })
            .call(() => {
                this.startTyping();
            })
            .start();
    }

    private createLineLabels(): void {
        const totalHeight = (this.currentLines.length - 1) * this.lineHeight;

        for (let i = 0; i < this.currentLines.length; i++) {
            const fullLine = this.currentLines[i];

            const lineNode = cc.instantiate(this.lineTemplate.node);
            lineNode.parent = this.textRoot;
            lineNode.active = true;

            lineNode.anchorX = 0;
            lineNode.anchorY = 0.5;

            const lineWidth = this.measureLineWidth(fullLine);

            lineNode.x = -lineWidth / 2;
            lineNode.y = totalHeight / 2 - i * this.lineHeight;

            lineNode.setContentSize(lineWidth + 10, this.lineHeight);

            const label = lineNode.getComponent(cc.Label);

            if (label) {
                label.string = "";
                label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
                label.verticalAlign = cc.Label.VerticalAlign.CENTER;
                label.overflow = cc.Label.Overflow.NONE;
                label.enableWrapText = false;
            }

            this.generatedNodes.push(lineNode);
            this.generatedLabels.push(label);
        }
    }

    private measureLineWidth(line: string): number {
        return Math.max(1, line.length * this.estimatedCharWidth);
    }

    private clearGeneratedLines(): void {
        for (let i = 0; i < this.generatedNodes.length; i++) {
            if (this.generatedNodes[i] && cc.isValid(this.generatedNodes[i])) {
                this.generatedNodes[i].destroy();
            }
        }

        this.generatedNodes = [];
        this.generatedLabels = [];
    }

    private startTyping(): void {
        if (this.state === OpeningState.Finished) {
            return;
        }

        this.state = OpeningState.Typing;

        this.currentLineIndex = 0;
        this.currentCharIndex = 0;

        this.unschedule(this.typeNextCharacter);
        this.schedule(this.typeNextCharacter, this.typeInterval);
    }

    private typeNextCharacter(): void {
        if (this.state !== OpeningState.Typing) {
            return;
        }

        if (this.currentLineIndex >= this.currentLines.length) {
            this.unschedule(this.typeNextCharacter);
            this.state = OpeningState.Waiting;
            return;
        }

        const currentLine = this.currentLines[this.currentLineIndex];
        const currentLabel = this.generatedLabels[this.currentLineIndex];

        if (!currentLabel) {
            this.moveToNextLine();
            return;
        }

        if (this.currentCharIndex < currentLine.length) {
            this.currentCharIndex++;
            currentLabel.string = currentLine.substring(0, this.currentCharIndex);
            return;
        }

        this.moveToNextLine();
    }

    private moveToNextLine(): void {
        this.currentLineIndex++;
        this.currentCharIndex = 0;

        if (this.currentLineIndex >= this.currentLines.length) {
            this.unschedule(this.typeNextCharacter);
            this.state = OpeningState.Waiting;
        }
    }

    private onKeyDown(event: cc.Event.EventKeyboard): void {
        if (event.keyCode !== cc.macro.KEY.space) {
            return;
        }

        if (this.state === OpeningState.Finished) {
            return;
        }

        if (this.state === OpeningState.Typing) {
            this.showFullCurrentText();
            return;
        }

        if (this.state === OpeningState.Waiting) {
            this.goToNextParagraph();
            return;
        }

        if (this.state === OpeningState.FadeIn) {
            cc.Tween.stopAllByTarget(this.textRoot);
            this.textRoot.opacity = 255;
            this.showFullCurrentText();
            return;
        }
    }

    private showFullCurrentText(): void {
        this.unschedule(this.typeNextCharacter);

        for (let i = 0; i < this.currentLines.length; i++) {
            if (this.generatedLabels[i]) {
                this.generatedLabels[i].string = this.currentLines[i];
            }
        }

        this.state = OpeningState.Waiting;
    }

    private goToNextParagraph(): void {
        if (this.isChangingParagraph) {
            return;
        }

        this.isChangingParagraph = true;

        this.unschedule(this.typeNextCharacter);
        cc.Tween.stopAllByTarget(this.textRoot);

        this.state = OpeningState.FadeOut;

        cc.tween(this.textRoot)
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
        cc.Tween.stopAllByTarget(this.textRoot);

        this.clearGeneratedLines();

        cc.director.loadScene(this.nextSceneName);
    }
}