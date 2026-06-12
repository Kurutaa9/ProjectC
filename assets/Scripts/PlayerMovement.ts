const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerMovement extends cc.Component {
    @property speed: number = 200;
    @property jumpForce: number = 700;

    @property
    useArrowKeys: boolean = false;

    @property(cc.AudioClip)
    runSound: cc.AudioClip = null;

    @property(cc.AudioClip)
    jumpSound: cc.AudioClip = null;

    @property(cc.Node)
    sprintDustNode: cc.Node | null = null;

    @property([cc.SpriteFrame])
    sprintDustFrames: cc.SpriteFrame[] = [];

    @property
    sprintDustFrameInterval: number = 0.04;

    @property
    sprintDustOffsetX: number = -10;

    @property
    sprintDustOffsetY: number = -18;

    private rb: cc.RigidBody | null = null;
    private anim: cc.Animation | null = null;
    private sprintDustSprite: cc.Sprite | null = null;

    private moveX: number = 0;
    private inQuicksand: boolean = false;
    private quicksandCount: number = 0;
    private prevMoveX: number = 0;
    private prevGrounded: boolean = false;

    private dustPlaying: boolean = false;
    private dustElapsed: number = 0;
    private dustFrameIndex: number = 0;

    private runAudioId: number = -1;
    private wasRunning: boolean = false;

    onLoad() {
        cc.director.getPhysicsManager().enabled = true;
        cc.director.getPhysicsManager().gravity = cc.v2(0, -900);

        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);

        if (this.sprintDustNode) {
            this.sprintDustSprite = this.sprintDustNode.getComponent(cc.Sprite);
            this.sprintDustNode.active = false;
        }

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        this.stopRunSound();
    }

    update(dt: number) {
        if (!this.rb) return;

        const grounded = this.isGrounded();
        const v = this.rb.linearVelocity;

        let xSpeed = this.moveX * this.speed;
        let ySpeed = v.y;

        if (this.inQuicksand) {
            xSpeed = this.moveX * (this.speed * 0.45);
            ySpeed = Math.max(v.y, -15);
        } else if (!grounded && this.isTouchingWall() && ySpeed < -120) {
            ySpeed = -120;
        }

        this.rb.linearVelocity = cc.v2(xSpeed, ySpeed);

        if (this.inQuicksand) {
            this.playAnim("fire_idle");
        } else if (!grounded) {
            this.playAnim("fire_jump");
        } else if (this.moveX !== 0) {
            this.playAnim("fire_run");
        } else {
            this.playAnim("fire_idle");
        }

        const runningNow = grounded && this.moveX !== 0 && !this.inQuicksand;

        if (runningNow && !this.wasRunning) {
            this.startRunSound();
        }

        if (!runningNow && this.wasRunning) {
            this.stopRunSound();
        }

        this.wasRunning = runningNow;

        const startedSprint =
            grounded &&
            this.prevGrounded &&
            !this.inQuicksand &&
            this.prevMoveX === 0 &&
            this.moveX !== 0;

        if (startedSprint) {
            this.playSprintDust();
        }

        this.updateSprintDust(dt);

        this.prevMoveX = this.moveX;
        this.prevGrounded = grounded;
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        if (!this.rb) return;

        const leftKey = this.useArrowKeys ? cc.macro.KEY.left : cc.macro.KEY.a;
        const rightKey = this.useArrowKeys ? cc.macro.KEY.right : cc.macro.KEY.d;
        const jumpKey = this.useArrowKeys ? cc.macro.KEY.up : cc.macro.KEY.w;

        if (event.keyCode === leftKey) {
            this.moveX = -1;
            this.node.scaleX = -Math.abs(this.node.scaleX);
        }

        if (event.keyCode === rightKey) {
            this.moveX = 1;
            this.node.scaleX = Math.abs(this.node.scaleX);
        }

        if (event.keyCode === jumpKey) {
            if (this.isGrounded() && !this.inQuicksand) {
                const v = this.rb.linearVelocity;
                this.rb.linearVelocity = cc.v2(v.x, this.jumpForce);

                this.stopRunSound();

                if (this.jumpSound) {
                    cc.audioEngine.playEffect(this.jumpSound, false);
                }
            }
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        const leftKey = this.useArrowKeys ? cc.macro.KEY.left : cc.macro.KEY.a;
        const rightKey = this.useArrowKeys ? cc.macro.KEY.right : cc.macro.KEY.d;

        if (event.keyCode === leftKey && this.moveX < 0) {
            this.moveX = 0;
        }

        if (event.keyCode === rightKey && this.moveX > 0) {
            this.moveX = 0;
        }
    }

    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (other.node.group === "quicksand") {
            this.quicksandCount++;
            this.inQuicksand = true;
            this.stopRunSound();
        }
    }

    onEndContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (other.node.group === "quicksand") {
            this.quicksandCount = Math.max(0, this.quicksandCount - 1);
            this.inQuicksand = this.quicksandCount > 0;
        }
    }

    onPreSolve(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (other.node.group !== "Platform") return;
        if (!this.rb) return;

        const playerBottom = this.node.y - this.node.height / 2;
        const platformTop = other.node.y + other.node.height / 2;
        const v = this.rb.linearVelocity;

        if (playerBottom < platformTop || v.y > 0) {
            contact.disabled = true;
        }
    }

    private isGrounded(): boolean {
        const start = this.node.convertToWorldSpaceAR(cc.v2(0, -8));
        const end = cc.v2(start.x, start.y - 18);

        const results = cc.director
            .getPhysicsManager()
            .rayCast(start, end, cc.RayCastType.Closest);

        if (results.length <= 0) return false;

        const group = results[0].collider.node.group;
        return group === "ground" || group === "Platform";
    }

    private isTouchingWall(): boolean {
        const center = this.node.convertToWorldSpaceAR(cc.v2(0, 0));

        const rightEnd = cc.v2(center.x + 14, center.y);
        const leftEnd = cc.v2(center.x - 14, center.y);

        const physics = cc.director.getPhysicsManager();

        const rightHits = physics.rayCast(center, rightEnd, cc.RayCastType.Closest);
        const leftHits = physics.rayCast(center, leftEnd, cc.RayCastType.Closest);

        if (rightHits.length > 0 && rightHits[0].collider.node.group === "wall") return true;
        if (leftHits.length > 0 && leftHits[0].collider.node.group === "wall") return true;

        return false;
    }

    private startRunSound() {
        if (!this.runSound) return;
        if (this.runAudioId !== -1) return;

        this.runAudioId = cc.audioEngine.playEffect(this.runSound, true);
    }

    private stopRunSound() {
        if (this.runAudioId !== -1) {
            cc.audioEngine.stopEffect(this.runAudioId);
            this.runAudioId = -1;
        }
    }

    private playAnim(name: string) {
        if (!this.anim) return;

        const current = this.anim.currentClip ? this.anim.currentClip.name : "";

        if (current !== name) {
            this.anim.play(name);
        }
    }

    private playSprintDust() {
        if (!this.sprintDustNode || !this.sprintDustSprite || this.sprintDustFrames.length === 0) return;

        this.dustPlaying = true;
        this.dustElapsed = 0;
        this.dustFrameIndex = 0;

        const face = this.node.scaleX >= 0 ? 1 : -1;
        const dustIsChildOfPlayer = this.sprintDustNode.parent === this.node;

        if (dustIsChildOfPlayer) {
            this.sprintDustNode.setPosition(this.sprintDustOffsetX, this.sprintDustOffsetY);
            this.sprintDustNode.scaleX = 1;
        } else {
            this.sprintDustNode.setPosition(face * this.sprintDustOffsetX, this.sprintDustOffsetY);
            this.sprintDustNode.scaleX = face;
        }

        this.sprintDustSprite.spriteFrame = this.sprintDustFrames[0];
        this.sprintDustNode.active = true;
    }

    private updateSprintDust(dt: number) {
        if (!this.dustPlaying) return;

        if (!this.sprintDustNode || !this.sprintDustSprite || this.sprintDustFrames.length === 0) {
            this.dustPlaying = false;
            return;
        }

        this.dustElapsed += dt;
        if (this.dustElapsed < this.sprintDustFrameInterval) return;

        this.dustElapsed = 0;
        this.dustFrameIndex++;

        if (this.dustFrameIndex >= this.sprintDustFrames.length) {
            this.dustPlaying = false;
            this.sprintDustNode.active = false;
            return;
        }

        this.sprintDustSprite.spriteFrame = this.sprintDustFrames[this.dustFrameIndex];
    }
}