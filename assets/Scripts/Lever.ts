const { ccclass, property } = cc._decorator;

@ccclass
export default class Lever extends cc.Component {
    @property({ type: [cc.SpriteFrame] })
    leverFrames: cc.SpriteFrame[] = [];

    @property
    isPulled: boolean = false;

    @property(cc.Node)
    appearing: cc.Node | null = null;

    @property(cc.Node)
    appearFxNode: cc.Node | null = null;

    @property([cc.SpriteFrame])
    appearFxFrames: cc.SpriteFrame[] = [];

    @property
    appearFxFrameInterval: number = 0.05;

    @property
    appearFxScale: number = 1;

    @property(cc.Node)
    leverFxNode: cc.Node | null = null;

    @property([cc.SpriteFrame])
    leverFxFrames: cc.SpriteFrame[] = [];

    @property
    leverFxFrameInterval: number = 0.05;

    @property
    leverFxScale: number = 1;

    private sprite: cc.Sprite | null = null;
    private appearFxSprite: cc.Sprite | null = null;
    private leverFxSprite: cc.Sprite | null = null;

    private isAnimating: boolean = false;
    private playersInZone: number = 0;

    private isAppearFxPlaying: boolean = false;
    private appearFxFrameIndex: number = 0;
    private appearFxElapsed: number = 0;

    private isLeverFxPlaying: boolean = false;
    private leverFxFrameIndex: number = 0;
    private leverFxElapsed: number = 0;

    onLoad() {
        cc.director.getPhysicsManager().enabled = true;

        this.sprite = this.getComponent(cc.Sprite);

        if (this.appearFxNode) {
            this.appearFxSprite = this.appearFxNode.getComponent(cc.Sprite);
            this.appearFxNode.active = false;
        }

        if (this.leverFxNode) {
            this.leverFxSprite = this.leverFxNode.getComponent(cc.Sprite);
            this.leverFxNode.active = false;
        }

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        // Always start unpulled and hidden
        this.isPulled = false;

        if (this.appearing) {
            this.appearing.active = false;
        }

        this.updateVisual();
    }

    update(dt: number) {
        this.updateAppearFx(dt);
        this.updateLeverFx(dt);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        const isInteractKey =
            event.keyCode === cc.macro.KEY.e ||
            event.keyCode === cc.macro.KEY.enter ||
            event.keyCode === 13;

        if (isInteractKey && this.playersInZone > 0 && !this.isAnimating) {
            this.onInteract();
        }
    }

    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (other.node.getComponent("PlayerMovement")) {
            this.playersInZone++;
        }
    }

    onEndContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (other.node.getComponent("PlayerMovement")) {
            this.playersInZone = Math.max(0, this.playersInZone - 1);
        }
    }

    private onInteract() {
        this.isPulled = !this.isPulled;

        this.playLeverFx();

        if (this.appearing) {
            this.appearing.active = this.isPulled;
        }

        if (this.isPulled) {
            this.playAppearFx();
        } else if (this.appearFxNode) {
            this.isAppearFxPlaying = false;
            this.appearFxNode.active = false;
        }

        this.playAnimation();
    }

    private playAnimation() {
        if (!this.sprite || this.leverFrames.length === 0) return;

        this.isAnimating = true;

        const framesToPlay = this.isPulled ? [0, 1, 2, 3] : [3, 2, 1, 0];
        let currentFrameIndex = 0;

        this.unscheduleAllCallbacks();

        this.schedule(() => {
            const frame = this.leverFrames[framesToPlay[currentFrameIndex]];
            if (frame) this.sprite.spriteFrame = frame;

            currentFrameIndex++;

            if (currentFrameIndex >= framesToPlay.length) {
                this.isAnimating = false;
                this.updateVisual();
            }
        }, 0.05, framesToPlay.length - 1, 0);
    }

    private updateVisual() {
        if (!this.sprite || this.leverFrames.length === 0) return;

        this.sprite.spriteFrame = this.isPulled
            ? this.leverFrames[this.leverFrames.length - 1]
            : this.leverFrames[0];
    }

    private playAppearFx() {
        if (!this.appearFxNode || !this.appearFxSprite || this.appearFxFrames.length === 0) return;

        this.isAppearFxPlaying = true;
        this.appearFxFrameIndex = 0;
        this.appearFxElapsed = 0;

        this.appearFxNode.scaleX = this.appearFxScale;
        this.appearFxNode.scaleY = this.appearFxScale;
        this.appearFxSprite.spriteFrame = this.appearFxFrames[0];
        this.appearFxNode.active = true;
    }

    private updateAppearFx(dt: number) {
        if (!this.isAppearFxPlaying) return;
        if (!this.appearFxNode || !this.appearFxSprite || this.appearFxFrames.length === 0) return;

        this.appearFxElapsed += dt;
        if (this.appearFxElapsed < this.appearFxFrameInterval) return;

        this.appearFxElapsed = 0;
        this.appearFxFrameIndex++;

        if (this.appearFxFrameIndex >= this.appearFxFrames.length) {
            this.isAppearFxPlaying = false;
            this.appearFxNode.active = false;
            return;
        }

        this.appearFxSprite.spriteFrame = this.appearFxFrames[this.appearFxFrameIndex];
    }

    private playLeverFx() {
        if (!this.leverFxNode || !this.leverFxSprite || this.leverFxFrames.length === 0) return;

        this.isLeverFxPlaying = true;
        this.leverFxFrameIndex = 0;
        this.leverFxElapsed = 0;

        this.leverFxNode.scaleX = this.leverFxScale;
        this.leverFxNode.scaleY = this.leverFxScale;
        this.leverFxSprite.spriteFrame = this.leverFxFrames[0];
        this.leverFxNode.active = true;
    }

    private updateLeverFx(dt: number) {
        if (!this.isLeverFxPlaying) return;
        if (!this.leverFxNode || !this.leverFxSprite || this.leverFxFrames.length === 0) return;

        this.leverFxElapsed += dt;
        if (this.leverFxElapsed < this.leverFxFrameInterval) return;

        this.leverFxElapsed = 0;
        this.leverFxFrameIndex++;

        if (this.leverFxFrameIndex >= this.leverFxFrames.length) {
            this.isLeverFxPlaying = false;
            this.leverFxNode.active = false;
            return;
        }

        this.leverFxSprite.spriteFrame = this.leverFxFrames[this.leverFxFrameIndex];
    }
}