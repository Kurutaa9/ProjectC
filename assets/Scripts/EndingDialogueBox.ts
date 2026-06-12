const { ccclass, property } = cc._decorator;

export enum EndingDialogueState {
    Hidden = 0,
    FadingIn = 1,
    Typing = 2,
    Waiting = 3,
    FadingOut = 4
}

@ccclass("EndingDialogueLine")
export class EndingDialogueLine {

    @property
    speakerName: string = "";

    @property({
        multiline: true
    })
    content: string = "";

    @property(cc.SpriteFrame)
    portraitFrame: cc.SpriteFrame = null;
}

@ccclass
export default class EndingDialogueBox extends cc.Component {

    @property(cc.Node)
    darkOverlay: cc.Node = null;

    @property(cc.Node)
    dialogueRoot: cc.Node = null;

    @property(cc.Sprite)
    portraitSprite: cc.Sprite = null;

    @property(cc.Label)
    speakerNameLabel: cc.Label = null;

    @property(cc.Label)
    contentLabel: cc.Label = null;

    @property(cc.Label)
    promptLabel: cc.Label = null;

    @property
    promptText: string = "Press SPACE to continue";

    @property
    overlayOpacity: number = 180;

    @property
    fadeTime: number = 0.35;

    @property
    typeInterval: number = 0.035;

    private state: EndingDialogueState = EndingDialogueState.Hidden;

    private lines: EndingDialogueLine[] = [];
    private currentLineIndex: number = 0;
    private currentCharIndex: number = 0;
    private currentText: string = "";

    private onCompleteCallback: Function = null;
    private isPlaying: boolean = false;

    onLoad(): void {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    start(): void {
        this.hideImmediately();
    }

    onDestroy(): void {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this.unschedule(this.typeNextCharacter);
    }

    public play(lines: EndingDialogueLine[], onComplete: Function): void {
        if (!lines || lines.length === 0) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        this.lines = lines;
        this.onCompleteCallback = onComplete;
        this.currentLineIndex = 0;
        this.currentCharIndex = 0;
        this.isPlaying = true;

        this.showDialogueUI(() => {
            this.showCurrentLine();
        });
    }

    private hideImmediately(): void {
        this.isPlaying = false;
        this.state = EndingDialogueState.Hidden;

        if (this.darkOverlay) {
            this.darkOverlay.active = false;
            this.darkOverlay.opacity = 0;
        }

        if (this.dialogueRoot) {
            this.dialogueRoot.active = false;
            this.dialogueRoot.opacity = 0;
        }

        if (this.contentLabel) {
            this.contentLabel.string = "";
        }

        if (this.promptLabel) {
            this.promptLabel.string = this.promptText;
        }
    }

    private showDialogueUI(onShown: Function): void {
        this.state = EndingDialogueState.FadingIn;

        if (this.darkOverlay) {
            this.darkOverlay.active = true;
            this.darkOverlay.opacity = 0;
            cc.Tween.stopAllByTarget(this.darkOverlay);

            cc.tween(this.darkOverlay)
                .to(this.fadeTime, { opacity: this.overlayOpacity })
                .start();
        }

        if (this.dialogueRoot) {
            this.dialogueRoot.active = true;
            this.dialogueRoot.opacity = 0;
            cc.Tween.stopAllByTarget(this.dialogueRoot);

            cc.tween(this.dialogueRoot)
                .to(this.fadeTime, { opacity: 255 })
                .call(() => {
                    if (onShown) {
                        onShown();
                    }
                })
                .start();
        } else {
            if (onShown) {
                onShown();
            }
        }
    }

    private showCurrentLine(): void {
        if (this.currentLineIndex >= this.lines.length) {
            this.finishDialogue();
            return;
        }

        const line = this.lines[this.currentLineIndex];

        this.currentText = line.content.replace(/\\n/g, "\n");
        this.currentCharIndex = 0;

        if (this.portraitSprite) {
            this.portraitSprite.spriteFrame = line.portraitFrame;
        }

        if (this.speakerNameLabel) {
            this.speakerNameLabel.string = line.speakerName;
            this.speakerNameLabel.node.active = line.speakerName !== "";
        }

        if (this.contentLabel) {
            this.contentLabel.string = "";
        }

        if (this.promptLabel) {
            this.promptLabel.string = this.promptText;
            this.promptLabel.node.opacity = 180;
        }

        this.state = EndingDialogueState.Typing;

        this.unschedule(this.typeNextCharacter);
        this.schedule(this.typeNextCharacter, this.typeInterval);
    }

    private typeNextCharacter(): void {
        if (this.state !== EndingDialogueState.Typing) {
            return;
        }

        if (this.currentCharIndex >= this.currentText.length) {
            this.unschedule(this.typeNextCharacter);
            this.state = EndingDialogueState.Waiting;
            return;
        }

        this.currentCharIndex++;

        if (this.contentLabel) {
            this.contentLabel.string = this.currentText.substring(0, this.currentCharIndex);
        }
    }

    private onKeyDown(event: cc.Event.EventKeyboard): void {
        if (!this.isPlaying) {
            return;
        }

        if (event.keyCode !== cc.macro.KEY.space) {
            return;
        }

        if (this.state === EndingDialogueState.Typing) {
            this.showFullCurrentLine();
            return;
        }

        if (this.state === EndingDialogueState.Waiting) {
            this.goToNextLine();
            return;
        }
    }

    private showFullCurrentLine(): void {
        this.unschedule(this.typeNextCharacter);

        this.currentCharIndex = this.currentText.length;

        if (this.contentLabel) {
            this.contentLabel.string = this.currentText;
        }

        this.state = EndingDialogueState.Waiting;
    }

    private goToNextLine(): void {
        this.currentLineIndex++;

        if (this.currentLineIndex >= this.lines.length) {
            this.finishDialogue();
            return;
        }

        this.showCurrentLine();
    }

    private finishDialogue(): void {
        this.unschedule(this.typeNextCharacter);

        this.state = EndingDialogueState.FadingOut;

        if (this.darkOverlay) {
            cc.Tween.stopAllByTarget(this.darkOverlay);

            cc.tween(this.darkOverlay)
                .to(this.fadeTime, { opacity: 0 })
                .call(() => {
                    this.darkOverlay.active = false;
                })
                .start();
        }

        if (this.dialogueRoot) {
            cc.Tween.stopAllByTarget(this.dialogueRoot);

            cc.tween(this.dialogueRoot)
                .to(this.fadeTime, { opacity: 0 })
                .call(() => {
                    this.dialogueRoot.active = false;
                    this.isPlaying = false;
                    this.state = EndingDialogueState.Hidden;

                    if (this.onCompleteCallback) {
                        const callback = this.onCompleteCallback;
                        this.onCompleteCallback = null;
                        callback();
                    }
                })
                .start();
        } else {
            this.isPlaying = false;
            this.state = EndingDialogueState.Hidden;

            if (this.onCompleteCallback) {
                const callback = this.onCompleteCallback;
                this.onCompleteCallback = null;
                callback();
            }
        }
    }

    public isDialoguePlaying(): boolean {
        return this.isPlaying;
    }
}