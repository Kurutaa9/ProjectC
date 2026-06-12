const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerMovement extends cc.Component {
    @property
    speed: number = 200;

    @property
    jumpForce: number = 450;

    @property
    gravity: number = 1200;

    private moveX: number = 0;
    private velocityY: number = 0;
    private isGrounded: boolean = false;
    private anim: cc.Animation = null;

    onLoad() {
        cc.director.getCollisionManager().enabled = true;

        this.anim = this.getComponent(cc.Animation);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    update(dt: number) {
        // left / right
        this.node.x += this.moveX * this.speed * dt;

        // gravity
        this.velocityY -= this.gravity * dt;
        this.node.y += this.velocityY * dt;

        // animation
        if (!this.isGrounded) {
            this.playAnim("fire_jump");
        } else if (this.moveX !== 0) {
            this.playAnim("fire_run");
        } else {
            this.playAnim("fire_idle");
        }
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        if (event.keyCode === cc.macro.KEY.a) {
            this.moveX = -1;
            this.node.scaleX = -Math.abs(this.node.scaleX);
        }

        if (event.keyCode === cc.macro.KEY.d) {
            this.moveX = 1;
            this.node.scaleX = Math.abs(this.node.scaleX);
        }

        if (event.keyCode === cc.macro.KEY.w && this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        if (event.keyCode === cc.macro.KEY.a && this.moveX < 0) {
            this.moveX = 0;
        }

        if (event.keyCode === cc.macro.KEY.d && this.moveX > 0) {
            this.moveX = 0;
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        this.handleGroundCollision(other, self);
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider) {
        this.handleGroundCollision(other, self);
    }

    onCollisionExit(other: cc.Collider, self: cc.Collider) {
        if (other.node.group === "ground") {
            this.isGrounded = false;
        }
    }

    private handleGroundCollision(other: cc.Collider, self: cc.Collider) {
        if (other.node.group !== "ground") return;

        // only land when falling
        if (this.velocityY <= 0) {
            this.isGrounded = true;
            this.velocityY = 0;

            const groundTop = other.node.y + other.node.height / 2;
            const playerHalfHeight = self.node.height / 2;

            this.node.y = groundTop + playerHalfHeight;
        }
    }

    private playAnim(name: string) {
        if (!this.anim) return;

        const current = this.anim.currentClip ? this.anim.currentClip.name : "";

        if (current !== name) {
            this.anim.play(name);
        }
    }
}