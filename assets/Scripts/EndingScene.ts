const { ccclass, property } = cc._decorator;

import EndingDialogueBox, { EndingDialogueLine } from "./EndingDialogueBox";

enum EndingState {
    IntroDialogue = 0,
    Exploring = 1,
    Revealing = 2,
    PostChestDialogue = 3,
    Completed = 4
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

    @property(cc.AudioClip)
    openChestAudio: cc.AudioClip = null;

    @property(cc.AudioSource)
    openChestAudioSource: cc.AudioSource = null;

    @property(EndingDialogueBox)
    dialogueBox: EndingDialogueBox = null;

    @property([EndingDialogueLine])
    introDialogues: EndingDialogueLine[] = [];

    @property([EndingDialogueLine])
    afterChestDialogues: EndingDialogueLine[] = [];

    @property
    menuSceneName: string = "Menu";

    @property
    resultText: string = "ELEMENT CORE OBTAINED!\nTRIAL COMPLETE!";

    @property
    promptText: string = "Press SPACE to return to Menu";

    @property
    flashTimes: number = 5;

    @property
    flashOnTime: number = 0.12;

    @property
    flashOffTime: number = 0.18;

    @property
    shakeDuration: number = 1.2;

    @property
    shakeStrength: number = 14;

    @property
    shakeStepTime: number = 0.05;

    @property
    elementCoreFadeTime: number = 1.4;

    @property
    elementCoreMoveDistance: number = 100;

    @property
    resultLabelDelay: number = 0.85;

    @property
    resultLabelFadeTime: number = 0.8;

    @property
    promptLabelDelay: number = 5;

    @property
    promptLabelFadeTime: number = 0.7;

    @property([cc.Node])
    characterNodes: cc.Node[] = [];

    @property
    restoreCharacterYOffset: number = 4;
    @property
    autoWalkSpeed: number = 60;
    @property
    chestTriggerDistance: number = 45;

    private charactersFrozen: boolean = false;
    private frozenCharacterPositions: cc.Vec2[] = [];
    private originalGravityScales: number[] = [];
    private originalRigidBodyTypes: number[] = [];
    private state: EndingState = EndingState.IntroDialogue;

    private elementCoreTargetY: number = 0;

    onLoad(): void {
        cc.director.getCollisionManager().enabled = true;
        cc.director.getPhysicsManager().enabled = true;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    start(): void {
        this.initEndingScene();
        this.startIntroDialogue();
    }

    onDestroy(): void {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private initEndingScene(): void {
        this.state = EndingState.IntroDialogue;

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

    private startIntroDialogue(): void {
        this.state = EndingState.IntroDialogue;

        this.setCharactersFrozen(true);

        if (this.dialogueBox && this.introDialogues.length > 0) {
            this.dialogueBox.play(this.introDialogues, () => {
                this.setCharactersFrozen(false);
                this.state = EndingState.Exploring;
            });
        } else {
            this.setCharactersFrozen(false);
            this.state = EndingState.Exploring;
        }
    }

    public startEndingSequence(): void {
        if (this.state !== EndingState.Exploring) {
            return;
        }

        this.state = EndingState.Revealing;
        this.setCharactersFrozen(true);

        this.playOpenChestAudio();
        this.openChest();
        this.playFlashEffect();
        this.playShakeEffect();

        const waitTime = this.getFlashTotalTime();

        this.scheduleOnce(() => {
            this.startPostChestDialogue();
        }, waitTime);
    }

    private startPostChestDialogue(): void {
        this.state = EndingState.PostChestDialogue;

        this.setCharactersFrozen(true);

        if (this.dialogueBox && this.afterChestDialogues.length > 0) {
            this.dialogueBox.play(this.afterChestDialogues, () => {
                this.showElementCoreAndResult();
            });
        } else {
            this.showElementCoreAndResult();
        }
    }

    public hasEndingStarted(): boolean {
        return this.state !== EndingState.Exploring;
    }

    private getFlashTotalTime(): number {
        return this.flashTimes * (this.flashOnTime + this.flashOffTime);
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
        if (this.openChestAudioSource) {
            this.openChestAudioSource.stop();
            this.openChestAudioSource.play();
            return;
        }

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

    private setCharactersFrozen(frozen: boolean): void {
        this.charactersFrozen = frozen;

        if (frozen) {
            this.frozenCharacterPositions = [];
            this.originalRigidBodyTypes = [];
            this.originalGravityScales = [];

            for (let i = 0; i < this.characterNodes.length; i++) {
                const character = this.characterNodes[i];

                if (!character) {
                    continue;
                }

                this.frozenCharacterPositions[i] = cc.v2(character.x, character.y);

                const rigidBody = character.getComponent(cc.RigidBody);

                if (rigidBody) {
                    this.originalRigidBodyTypes[i] = rigidBody.type;
                    this.originalGravityScales[i] = rigidBody.gravityScale;

                    rigidBody.linearVelocity = cc.v2(0, 0);
                    rigidBody.angularVelocity = 0;
                    rigidBody.gravityScale = 0;

                    // 對話期間完全固定
                    rigidBody.type = cc.RigidBodyType.Static;

                    this.syncRigidBodyDirect(rigidBody);
                }
            }

            return;
        }

        // 對話結束後：恢復成可移動狀態，但不要恢復重力
        for (let i = 0; i < this.characterNodes.length; i++) {
            const character = this.characterNodes[i];

            if (!character) {
                continue;
            }

            if (this.frozenCharacterPositions[i]) {
                character.x = this.frozenCharacterPositions[i].x;
                character.y = this.frozenCharacterPositions[i].y + this.restoreCharacterYOffset;
            }

            const rigidBody = character.getComponent(cc.RigidBody);

            if (rigidBody) {
                rigidBody.linearVelocity = cc.v2(0, 0);
                rigidBody.angularVelocity = 0;

                // Ending Scene 不恢復重力，避免角色掉下去
                rigidBody.gravityScale = 0;

                // 用 Kinematic 讓角色可以被程式移動，但不受重力影響
                rigidBody.type = cc.RigidBodyType.Kinematic;

                this.syncRigidBodyDirect(rigidBody);
            }
        }

        this.frozenCharacterPositions = [];
        this.originalGravityScales = [];
        this.originalRigidBodyTypes = [];
    }

    private syncRigidBodyDirect(rigidBody: cc.RigidBody): void {
        if (!rigidBody) {
            return;
        }

        const body: any = rigidBody as any;

        if (body.syncPosition) {
            body.syncPosition(true);
        }

        if (body.syncRotation) {
            body.syncRotation(true);
        }
    }

    update(dt: number): void {
        if (this.charactersFrozen) {
            this.keepCharactersFrozen();
            return;
        }

        if (this.state === EndingState.Exploring) {
            this.autoWalkCharacters(dt);
            this.checkChestReached();
        }
    }

    private keepCharactersFrozen(): void {
        for (let i = 0; i < this.characterNodes.length; i++) {
            const character = this.characterNodes[i];

            if (!character || !this.frozenCharacterPositions[i]) {
                continue;
            }

            character.x = this.frozenCharacterPositions[i].x;
            character.y = this.frozenCharacterPositions[i].y;

            const rigidBody = character.getComponent(cc.RigidBody);

            if (rigidBody) {
                rigidBody.linearVelocity = cc.v2(0, 0);
                rigidBody.angularVelocity = 0;
                rigidBody.gravityScale = 0;

                this.syncRigidBodyDirect(rigidBody);
            }
        }
    }

    private autoWalkCharacters(dt: number): void {
        for (let i = 0; i < this.characterNodes.length; i++) {
            const character = this.characterNodes[i];

            if (!character) {
                continue;
            }

            character.x += this.autoWalkSpeed * dt;

            const rigidBody = character.getComponent(cc.RigidBody);

            if (rigidBody) {
                rigidBody.linearVelocity = cc.v2(0, 0);
                rigidBody.angularVelocity = 0;
                rigidBody.gravityScale = 0;
                this.syncRigidBodyDirect(rigidBody);
            }
        }
    }
    private checkChestReached(): void {
        if (this.state !== EndingState.Exploring) {
            return;
        }

        if (!this.chestNode) {
            return;
        }

        for (let i = 0; i < this.characterNodes.length; i++) {
            const character = this.characterNodes[i];

            if (!character) {
                continue;
            }

            const distanceX = Math.abs(character.x - this.chestNode.x);
            const distanceY = Math.abs(character.y - this.chestNode.y);

            if (distanceX <= this.chestTriggerDistance && distanceY <= 120) {
                this.startEndingSequence();
                return;
            }
        }
    }
}
