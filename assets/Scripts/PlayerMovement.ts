const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerMovement extends cc.Component {
    @property speed: number = 200;
    @property jumpForce: number = 700;

    @property
    useArrowKeys: boolean = false;

    private rb: cc.RigidBody = null;
    private anim: cc.Animation = null;
    private moveX: number = 0;

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

        const grounded = this.isGrounded();

        if (!grounded) this.playAnim("fire_jump");
        else if (this.moveX !== 0) this.playAnim("fire_run");
        else this.playAnim("fire_idle");
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
            if (this.isGrounded()) {
                const v = this.rb.linearVelocity;
                this.rb.linearVelocity = cc.v2(v.x, this.jumpForce);
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

    private isGrounded(): boolean {
        const start = this.node.convertToWorldSpaceAR(cc.v2(0, -8));
        const end = cc.v2(start.x, start.y - 18);

        const results = cc.director
            .getPhysicsManager()
            .rayCast(start, end, cc.RayCastType.Closest);

        if (results.length <= 0) return false;

        return results[0].collider.node.group === "ground";
    }

    private playAnim(name: string) {
        if (!this.anim) return;

        const current = this.anim.currentClip ? this.anim.currentClip.name : "";

        if (current !== name) {
            this.anim.play(name);
        }
    }
}