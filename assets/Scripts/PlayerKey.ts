const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerKey extends cc.Component {

    @property(cc.Vec2)
    followOffset: cc.Vec2 = cc.v2(0, 26);

    onLoad() {
        this.node.active = false;
    }

    public attachTo(playerNode: cc.Node): void {
        if (!playerNode) {
            return;
        }

        this.node.parent = playerNode;
        this.node.setPosition(this.followOffset);
        this.node.zIndex = 999;
        this.node.active = true;
    }

    lateUpdate(): void {
        if (!this.node.active || !this.node.parent) {
            return;
        }

        this.node.setPosition(this.followOffset);
        this.node.zIndex = 999;
    }
}