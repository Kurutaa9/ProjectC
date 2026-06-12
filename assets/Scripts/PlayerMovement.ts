const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerMovement extends cc.Component {
    @property speed: number = 200;
    @property jumpForce: number = 900;

    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null;
    private moveX: number = 0;
    private groundCount: number = 0;

    onLoad() {
        cc.director.getPhysicsManager().enabled = true;
        cc.director.getPhysicsManager().gravity = cc.v2(0, -900);

        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    update(dt: number) {
        if (!this.rb) return;

        const v = this.rb.linearVelocity;
        this.rb.linearVelocity = cc.v2(this.moveX * this.speed, v.y);

        if (this.groundCount <= 0) this.playAnim("fire_jump");
        else if (this.moveX !== 0) this.playAnim("fire_run");
        else this.playAnim("fire_idle");
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        if (!this.rb) return;

        if (event.keyCode === cc.macro.KEY.a) {
            this.moveX = -1;
            this.node.scaleX = -Math.abs(this.node.scaleX);
        }

        if (event.keyCode === cc.macro.KEY.d) {
            this.moveX = 1;
            this.node.scaleX = Math.abs(this.node.scaleX);
        }

        if (event.keyCode === cc.macro.KEY.w || event.keyCode === cc.macro.KEY.space) {
            cc.log("Jump key pressed");

            const v = this.rb.linearVelocity;

            if (this.groundCount > 0 || Math.abs(v.y) < 5) {
                this.rb.linearVelocity = cc.v2(v.x, this.jumpForce);
                this.groundCount = 0;
                cc.log("JUMP");
            }
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

    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (other.node.group === "ground") {
            this.groundCount++;
            cc.log("touch ground", this.groundCount);
        }
    }

    onEndContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (other.node.group === "ground") {
            this.groundCount = Math.max(0, this.groundCount - 1);
            cc.log("leave ground", this.groundCount);
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