const {ccclass, property} = cc._decorator;

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
        this.sprite = this.getComponent(cc.Sprite);
        if (!this.sprite) {
            cc.error("Lever script requires a Sprite component on the node!");
        }

        // Add keyboard event listener to trigger the lever pull
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        
        // Ensure visual state matches property on start
        this.updateVisual();
    }

    onDestroy() {
        // Remove keyboard event listener to prevent memory leaks
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        // Only interact if a player is in the zone and animation is not playing
        if (this.playersInZone > 0 && !this.isAnimating) {
            if (event.keyCode === cc.macro.KEY.e || event.keyCode === cc.macro.KEY.slash) {
                this.onInteract();
            }
        }
    }

    // Physics 2D Contact Callbacks
    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (otherCollider.node.getComponent("PlayerMovement")) {
            this.playersInZone++;
        }
    }

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (otherCollider.node.getComponent("PlayerMovement")) {
            this.playersInZone--;
        }
    }

    // Normal 2D Collision Callbacks (in case you use standard colliders instead of physics)
    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if (other.node.getComponent("PlayerMovement")) {
            this.playersInZone++;
        }
    }

    onCollisionExit(other: cc.Collider, self: cc.Collider) {
        if (other.node.getComponent("PlayerMovement")) {
            this.playersInZone--;
        }
    }

    onInteract() {
        this.isPulled = !this.isPulled;
        this.playAnimation();
    }

    playAnimation() {
        if (this.leverFrames.length === 0) return;
        
        this.isAnimating = true;
        
        let framesToPlay = this.isPulled ? 
            [0, 1, 2, 3] : // Pulling down (1 -> 4)
            [3, 2, 1, 0];  // Pulling up (4 -> 1)
            
        this.unscheduleAllCallbacks();
        
        let currentFrameIndex = 0;
        
        // Schedule a callback to change the sprite frame rapidly like an animation
        this.schedule(() => {
            let frameRef = this.leverFrames[framesToPlay[currentFrameIndex]];
            if (frameRef) {
                this.sprite.spriteFrame = frameRef;
            }
            
            currentFrameIndex++;
            
            // Finished animating
            if (currentFrameIndex >= framesToPlay.length) {
                this.isAnimating = false;
            }
        }, 0.05, framesToPlay.length - 1, 0); 
    }

    updateVisual() {
        if (this.leverFrames.length === 0 || !this.sprite) return;
        // Set to the first frame if not pulled, or the last frame if pulled
        this.sprite.spriteFrame = this.isPulled ? 
            this.leverFrames[this.leverFrames.length - 1] : 
            this.leverFrames[0];
    }
}
