const { ccclass, property } = cc._decorator;

enum EndingState {
    Exploring = 0,
    Revealing = 1,
    Completed = 2
}

@ccclass
export default class EndingScene extends cc.Component {

    @property(cc.Node)
    worldRoot: cc.Node = null;

    @property(cc.Node)
    shakeNode: cc.Node = null;

    @property(cc.Node)
    chestNode: cc.Node = null;

    @property(cc.SpriteFrame)
    chestClosedFrame: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    chestOpenedFrame: cc.SpriteFrame = null;

    @property(cc.Node)
    flashNode: cc.Node = null;

    @property(cc.Node)
    elementCoreNode: cc.Node = null;

    @property(cc.SpriteFrame)
    elementCoreFrame: cc.SpriteFrame = null;

    @property(cc.Label)
    resultLabel: cc.Label = null;

    @property(cc.Label)
    promptLabel: cc.Label = null;

    // 方法一：直接拖音效檔案進來
    @property(cc.AudioClip)
    openChestAudio: cc.AudioClip = null;

    // 方法二：可選。若你想用 AudioSource 播放，可以接這個。
    @property(cc.AudioSource)
    openChestAudioSource: cc.AudioSource = null;

    @property
    menuSceneName: string = "Menu";

    @property
    resultText: string = "ELEMENT CORE OBTAINED!\nTRIAL COMPLETE!";

    @property
    promptText: string = "Press SPACE to return to Menu";

    // 閃爍次數
    @property
    flashTimes: number = 5;

    // 每次閃白停留時間
    @property
    flashOnTime: number = 0.12;

    // 每次閃白消失時間
    @property
    flashOffTime: number = 0.18;

    // 搖晃總時間
    @property
    shakeDuration: number = 1.2;

    // 搖晃強度
    @property
    shakeStrength: number = 14;

    // 搖晃每一步的時間
    @property
    shakeStepTime: number = 0.05;

    // Element Core 出現前等待時間
    @property
    elementCoreRevealDelay: number = 0.45;

    // Element Core 漸入時間
    @property
    elementCoreFadeTime: number = 1.4;

    // Element Core 從上方落下的距離
    @property
    elementCoreMoveDistance: number = 100;

    // 成功文字出現延遲
    @property
    resultLabelDelay: number = 0.85;

    // 成功文字漸入時間
    @property
    resultLabelFadeTime: number = 0.8;

    // Press Space 文字出現延遲
    @property
    promptLabelDelay: number = 2.2;

    // Press Space 文字漸入時間
    @property
    promptLabelFadeTime: number = 0.7;

    private state: EndingState = EndingState.Exploring;

    private elementCoreTargetY: number = 0;

    onLoad(): void {
        cc.director.getCollisionManager().enabled = true;

        // 如果你有用 PhysicsBoxCollider / RigidBody，這行需要開。
        cc.director.getPhysicsManager().enabled = true;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    start(): void {
        this.initEndingScene();
    }

    onDestroy(): void {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private initEndingScene(): void {
        this.state = EndingState.Exploring;

        if (!this.shakeNode) {
            this.shakeNode = this.worldRoot;
        }

        if (this.chestNode) {
            const chestSprite = this.chestNode.getComponent(cc.Sprite);

            if (chestSprite && this.chestClosedFrame) {
                chestSprite.spriteFrame = this.chestClosedFrame;
            }
        }

        if (this.flashNode) {
            this.flashNode.active = true;
            this.flashNode.opacity = 0;
        }

        if (this.elementCoreNode) {
            this.elementCoreNode.active = true;

            this.elementCoreTargetY = this.elementCoreNode.y;
            this.elementCoreNode.y = this.elementCoreTargetY + this.elementCoreMoveDistance;
            this.elementCoreNode.opacity = 0;

            const elementCoreSprite = this.elementCoreNode.getComponent(cc.Sprite);

            if (elementCoreSprite && this.elementCoreFrame) {
                elementCoreSprite.spriteFrame = this.elementCoreFrame;
            }
        }

        if (this.resultLabel) {
            this.resultLabel.string = this.resultText;
            this.resultLabel.node.opacity = 0;
        }

        if (this.promptLabel) {
            this.promptLabel.string = this.promptText;
            this.promptLabel.node.opacity = 0;
        }
    }

    public startEndingSequence(): void {
        if (this.state !== EndingState.Exploring) {
            return;
        }

        this.state = EndingState.Revealing;

        // 重點 1：音效放在最前面，碰到寶箱後立刻播放
        this.playOpenChestAudio();

        this.openChest();
        this.playFlashEffect();
        this.playShakeEffect();

        // 重點 2：Core 稍微晚一點出現，讓閃爍和搖晃先發生
        this.scheduleOnce(() => {
            this.showElementCoreAndResult();
        }, this.elementCoreRevealDelay);
    }

    public hasEndingStarted(): boolean {
        return this.state !== EndingState.Exploring;
    }

    private openChest(): void {
        if (!this.chestNode) {
            return;
        }

        const chestSprite = this.chestNode.getComponent(cc.Sprite);

        if (chestSprite && this.chestOpenedFrame) {
            chestSprite.spriteFrame = this.chestOpenedFrame;
        }
    }

    private playOpenChestAudio(): void {
        // 優先使用 AudioSource，如果你有接的話
        if (this.openChestAudioSource) {
            this.openChestAudioSource.stop();
            this.openChestAudioSource.play();
            return;
        }

        // 沒有 AudioSource 就用 AudioClip
        if (this.openChestAudio) {
            cc.audioEngine.playEffect(this.openChestAudio, false);
        }
    }

    private playFlashEffect(): void {
        if (!this.flashNode) {
            return;
        }

        this.flashNode.active = true;
        this.flashNode.opacity = 0;

        cc.Tween.stopAllByTarget(this.flashNode);

        let flashTween = cc.tween(this.flashNode);

        for (let i = 0; i < this.flashTimes; i++) {
            flashTween = flashTween
                .to(this.flashOnTime, { opacity: 220 })
                .to(this.flashOffTime, { opacity: 0 });
        }

        flashTween.start();
    }

    private playShakeEffect(): void {
        const target = this.shakeNode;

        if (!target) {
            return;
        }

        cc.Tween.stopAllByTarget(target);

        const originX = target.x;
        const originY = target.y;

        const steps = Math.max(1, Math.floor(this.shakeDuration / this.shakeStepTime));

        let shakeTween = cc.tween(target);

        for (let i = 0; i < steps; i++) {
            const randomX = originX + (Math.random() * 2 - 1) * this.shakeStrength;
            const randomY = originY + (Math.random() * 2 - 1) * this.shakeStrength;

            shakeTween = shakeTween.to(this.shakeStepTime, {
                x: randomX,
                y: randomY
            });
        }

        shakeTween
            .to(0.1, {
                x: originX,
                y: originY
            })
            .start();
    }

    private showElementCoreAndResult(): void {
        if (this.elementCoreNode) {
            cc.Tween.stopAllByTarget(this.elementCoreNode);

            this.elementCoreNode.active = true;
            this.elementCoreNode.opacity = 0;
            this.elementCoreNode.y = this.elementCoreTargetY + this.elementCoreMoveDistance;

            cc.tween(this.elementCoreNode)
                .to(this.elementCoreFadeTime, {
                    opacity: 255,
                    y: this.elementCoreTargetY
                }, {
                    easing: "quadOut"
                })
                .start();
        }

        if (this.resultLabel) {
            cc.Tween.stopAllByTarget(this.resultLabel.node);

            cc.tween(this.resultLabel.node)
                .delay(this.resultLabelDelay)
                .to(this.resultLabelFadeTime, { opacity: 255 })
                .start();
        }

        if (this.promptLabel) {
            cc.Tween.stopAllByTarget(this.promptLabel.node);

            cc.tween(this.promptLabel.node)
                .delay(this.promptLabelDelay)
                .to(this.promptLabelFadeTime, { opacity: 255 })
                .call(() => {
                    this.state = EndingState.Completed;
                })
                .start();
        } else {
            this.scheduleOnce(() => {
                this.state = EndingState.Completed;
            }, this.promptLabelDelay);
        }
    }

    private onKeyDown(event: cc.Event.EventKeyboard): void {
        if (event.keyCode !== cc.macro.KEY.space) {
            return;
        }

        if (this.state !== EndingState.Completed) {
            return;
        }

        cc.director.loadScene(this.menuSceneName);
    }
}