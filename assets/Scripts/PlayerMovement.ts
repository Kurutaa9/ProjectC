const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerMovement extends cc.Component {

    @property
    speed: number = 200;

    @property
    jumpForce: number = 420;

    @property
    gravity: number = 1200;

    @property
    useWASD: boolean = true;

    private hori: number = 0;
    private velocityY: number = 0;
    private isGrounded: boolean = false;
    private wantJump: boolean = false;
    private anim: cc.Animation = null;

    onLoad() {
        this.anim = this.getComponent(cc.Animation);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    update(dt: number) {
        this.node.x += this.hori * this.speed * dt;

        this.velocityY -= this.gravity * dt;
        this.node.y += this.velocityY * dt;

        if (this.wantJump && this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
            this.playAnim("jump");
        }

        this.wantJump = false;
    }

    private onKeyDown(evt: cc.Event.EventKeyboard) {
        if (this.useWASD) {
            if (evt.keyCode === cc.macro.KEY.a) {
                this.hori = -1;
                this.node.scaleX = -2;
                if (this.isGrounded) this.playAnim("run");
            }

            if (evt.keyCode === cc.macro.KEY.d) {
                this.hori = 1;
                this.node.scaleX = 2;
                if (this.isGrounded) this.playAnim("run");
            }

            if (evt.keyCode === cc.macro.KEY.w) {
                this.wantJump = true;
            }
        } else {
            if (evt.keyCode === cc.macro.KEY.left) {
                this.hori = -1;
                this.node.scaleX = -2;
                if (this.isGrounded) this.playAnim("run");
            }

            if (evt.keyCode === cc.macro.KEY.right) {
                this.hori = 1;
                this.node.scaleX = 2;
                if (this.isGrounded) this.playAnim("run");
            }

            if (evt.keyCode === cc.macro.KEY.up) {
                this.wantJump = true;
            }
        }
    }

    private onKeyUp(evt: cc.Event.EventKeyboard) {
        if (
            evt.keyCode === cc.macro.KEY.a ||
            evt.keyCode === cc.macro.KEY.d ||
            evt.keyCode === cc.macro.KEY.left ||
            evt.keyCode === cc.macro.KEY.right
        ) {
            this.hori = 0;

            if (this.isGrounded) {
                this.playAnim("idle");
            }
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if (other.node.group === "ground") {
            this.isGrounded = true;
            this.velocityY = 0;
        }
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider) {
        if (other.node.group === "ground") {
            this.isGrounded = true;
            this.velocityY = 0;
        }
    }

    onCollisionExit(other: cc.Collider, self: cc.Collider) {
        if (other.node.group === "ground") {
            this.isGrounded = false;
        }
    }

    private playAnim(state: string) {
        if (!this.anim) return;

        if (this.useWASD) {
            if (state === "idle") this.anim.play("fire_idle");
            if (state === "run") this.anim.play("fire_run");
            if (state === "jump") this.anim.play("fire_jump");
        } else {
            if (state === "idle") this.anim.play("water_idle");
            if (state === "run") this.anim.play("water_run");
            if (state === "jump") this.anim.play("water_jump");
        }
    }
}