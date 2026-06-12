const { ccclass } = cc._decorator;

@ccclass
export default class Spike extends cc.Component {

    onLoad() {
        cc.director.getPhysicsManager().enabled = true;
        cc.log("Spike loaded:", this.node.name);
    }

    onBeginContact(
        contact: cc.PhysicsContact,
        self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        cc.log("SPIKE CONTACT!");
        cc.log("Other Node:", other.node.name);

        const player = other.node.getComponent("PlayerMovement");

        if (player) {
            cc.log("PLAYER DIED!");
            cc.director.loadScene("LevelSelect");
        } else {
            cc.log("Not PlayerMovement");
        }
    }
}