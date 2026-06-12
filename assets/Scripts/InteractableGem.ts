const { ccclass } = cc._decorator;

@ccclass
export default class InteractableGem extends cc.Component {

    private pickedUp: boolean = false;

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.pickedUp) {
            return;
        }

        const playerNode = otherCollider.node;

        if (!playerNode || (playerNode.name !== "Fireboy" && playerNode.name !== "Watergirl")) {
            return;
        }

        const playerKeyNode = this.findPlayerKeyNode(playerNode);

        if (!playerKeyNode) {
            return;
        }

        this.pickedUp = true;
        playerKeyNode.active = true;
        this.node.destroy();
    }

    private findPlayerKeyNode(playerNode: cc.Node): cc.Node | null {
        if (!playerNode) {
            return null;
        }

        const directChild = playerNode.getChildByName("Player_key");
        if (directChild) {
            return directChild;
        }

        for (let i = 0; i < playerNode.childrenCount; i++) {
            const child = playerNode.children[i];
            if (child.name.toLowerCase().indexOf("key") !== -1) {
                return child;
            }
        }

        return null;
    }
}