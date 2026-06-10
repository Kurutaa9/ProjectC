const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerMovement extends cc.Component {

    @property
    speed: number = 180;

    @property
    jumpForce: number = 260;

    @property
    useWASD: boolean = true;

    private moveX = 0;
    private isGrounded = false;

    private anim: cc.Animation = null;
    private rb: cc.RigidBody = null;

    onLoad() {
        this.anim = this.getComponent(cc.Animation);
        this.rb = this.getComponent(cc.RigidBody);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {

        // FIREBOY (WASD)

        if (this.useWASD) {

            if (event.keyCode === cc.macro.KEY.a) {
                this.moveX = -1;
                this.node.scaleX = -2;
                this.anim.play("fire_run");
            }

            if (event.keyCode === cc.macro.KEY.d) {
                this.moveX = 1;
                this.node.scaleX = 2;
                this.anim.play("fire_run");
            }

            if (event.keyCode === cc.macro.KEY.w && this.isGrounded) {
                this.isGrounded = false;
                this.anim.play("fire_jump");

                this.rb.linearVelocity = cc.v2(
                    this.rb.linearVelocity.x,
                    this.jumpForce
                );
            }

        }

        // WATERGIRL (ARROWS)

        else {

            if (event.keyCode === cc.macro.KEY.left) {
                this.moveX = -1;
                this.node.scaleX = -2;
                this.anim.play("water_run");
            }

            if (event.keyCode === cc.macro.KEY.right) {
                this.moveX = 1;
                this.node.scaleX = 2;
                this.anim.play("water_run");
            }

            if (event.keyCode === cc.macro.KEY.up && this.isGrounded) {
                this.isGrounded = false;
                this.anim.play("water_jump");

                this.rb.linearVelocity = cc.v2(
                    this.rb.linearVelocity.x,
                    this.jumpForce
                );
            }
        }
    }

    onKeyUp(event: cc.Event.EventKeyboard) {

        if (this.useWASD) {

            if (
                event.keyCode === cc.macro.KEY.a ||
                event.keyCode === cc.macro.KEY.d
            ) {

                this.moveX = 0;

                if (this.isGrounded) {
                    this.anim.play("fire_idle");
                }
            }

        } else {

            if (
                event.keyCode === cc.macro.KEY.left ||
                event.keyCode === cc.macro.KEY.right
            ) {

                this.moveX = 0;

                if (this.isGrounded) {
                    this.anim.play("water_idle");
                }
            }
        }
    }

    onBeginContact(contact, selfCollider, otherCollider) {
        if (otherCollider.tag === 10) {
            otherCollider.node.destroy();
            return;
        }

        this.isGrounded = true;

        if (this.moveX === 0) {
            this.anim.play("fire_idle");
        } else {
            this.anim.play("fire_run");
        }
    }

    update(dt: number) {
        this.rb.linearVelocity = cc.v2(
            this.moveX * this.speed,
            this.rb.linearVelocity.y
        );
    }
}