const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerMovement extends cc.Component {

    @property
    speed: number = 200;

    @property
    jumpForce: number = 450;

    @property
    gravity: number = 1200;

    private hori: number = 0;
    private velocityY: number = 0;
    private isGrounded: boolean = false;
    private wantJump: boolean = false;

    private anim: cc.Animation = null;

    onLoad() {
        cc.director.getCollisionManager().enabled = true;

        this.anim = this.getComponent(cc.Animation);

        cc.systemEvent.on(
            cc.SystemEvent.EventType.KEY_DOWN,
            this.onKeyDown,
            this
        );

        cc.systemEvent.on(
            cc.SystemEvent.EventType.KEY_UP,
            this.onKeyUp,
            this
        );
    }

    onDestroy() {
        cc.systemEvent.off(
            cc.SystemEvent.EventType.KEY_DOWN,
            this.onKeyDown,
            this
        );

        cc.systemEvent.off(
            cc.SystemEvent.EventType.KEY_UP,
            this.onKeyUp,
            this
        );
    }

    update(dt: number) {

        // Horizontal movement
        this.node.x += this.hori * this.speed * dt;

        // Jump
        if (this.wantJump && this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
            this.playAnim("jump");
        }

        // Gravity
        this.velocityY -= this.gravity * dt;

        // Vertical movement
        this.node.y += this.velocityY * dt;

        this.wantJump = false;
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {

        switch (event.keyCode) {

            case cc.macro.KEY.a:
                this.hori = -1;
                this.node.scaleX = -2;

                if (this.isGrounded) {
                    this.playAnim("run");
                }
                break;

            case cc.macro.KEY.d:
                this.hori = 1;
                this.node.scaleX = 2;

                if (this.isGrounded) {
                    this.playAnim("run");
                }
                break;

            case cc.macro.KEY.w:
                this.wantJump = true;
                break;
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard) {

        switch (event.keyCode) {

            case cc.macro.KEY.a:
            case cc.macro.KEY.d:

                this.hori = 0;

                if (this.isGrounded) {
                    this.playAnim("idle");
                }
                break;
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {

        if (other.node.group === "ground") {

            this.isGrounded = true;
            this.velocityY = 0;

            this.node.y =
                other.node.y +
                other.node.height / 2 +
                10;

            if (this.hori === 0) {
                this.playAnim("idle");
            } else {
                this.playAnim("run");
            }
        }
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider) {

        if (other.node.group === "ground") {

            this.isGrounded = true;
            this.velocityY = 0;

            this.node.y =
                other.node.y +
                other.node.height / 2 +
                10;
        }
    }

    onCollisionExit(other: cc.Collider, self: cc.Collider) {

        if (other.node.group === "ground") {
            this.isGrounded = false;
        }
    }

    private playAnim(state: string) {

        if (!this.anim) return;

        switch (state) {

            case "idle":
                this.anim.play("fire_idle");
                break;

            case "run":
                this.anim.play("fire_run");
                break;

            case "jump":
                this.anim.play("fire_jump");
                break;
        }
    }
}