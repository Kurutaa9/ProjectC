const { ccclass, property } = cc._decorator;

@ccclass
export default class Lever extends cc.Component {
    @property({
        type: [cc.SpriteFrame],
        tooltip: "Drag the 4 lever sprites here in order"
    })
    leverFrames: cc.SpriteFrame[] = [];

    @property
    isPulled: boolean = false;

    private sprite: cc.Sprite = null;
    private isAnimating: boolean = false;
    private playersInZone: number = 0;

    onLoad() {
        cc.director.getCollisionManager().enabled = true;

        this.sprite = this.getComponent(cc.Sprite);

        if (!this.sprite) {
            cc.error("Lever script requires a Sprite component on the node!");
            return;
        }

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        this.updateVisual();
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        if (event.keyCode === cc.macro.KEY.e && this.playersInZone > 0 && !this.isAnimating) {
            this.onInteract();
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if (other.node.getComponent("PlayerMovement")) {
            this.playersInZone++;
        }
    }

    onCollisionExit(other: cc.Collider, self: cc.Collider) {
        if (other.node.getComponent("PlayerMovement")) {
            this.playersInZone = Math.max(0, this.playersInZone - 1);
        }
    }

    private onInteract() {
        this.isPulled = !this.isPulled;
        this.playAnimation();
    }

    private playAnimation() {
        if (!this.sprite || this.leverFrames.length === 0) return;

        this.isAnimating = true;

        const framesToPlay = this.isPulled
            ? [0, 1, 2, 3]
            : [3, 2, 1, 0];

        this.unscheduleAllCallbacks();

        let currentFrameIndex = 0;

        this.schedule(() => {
            const frame = this.leverFrames[framesToPlay[currentFrameIndex]];

            if (frame) {
                this.sprite.spriteFrame = frame;
            }

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
}