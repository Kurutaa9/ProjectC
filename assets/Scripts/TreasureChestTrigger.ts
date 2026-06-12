const { ccclass, property } = cc._decorator;

import EndingScene from "./EndingScene";

@ccclass
export default class TreasureChestTrigger extends cc.Component {

    @property(EndingScene)
    endingScene: EndingScene = null;

    @property
    playerGroupName: string = "player";

    @property([cc.String])
    playerNodeNames: string[] = [
        "Player",
        "FireHero",
        "WaterHero",
        "Fire",
        "Water"
    ];

    private hasTriggered: boolean = false;

    onCollisionEnter(other: cc.Collider, self: cc.Collider): void {
        this.tryTrigger(other.node);
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider): void {
        this.tryTrigger(otherCollider.node);
    }

    private tryTrigger(otherNode: cc.Node): void {
        if (this.hasTriggered) {
            return;
        }

        if (!otherNode) {
            return;
        }

        if (!this.isPlayerNode(otherNode)) {
            return;
        }

        this.hasTriggered = true;

        if (this.endingScene) {
            this.endingScene.startEndingSequence();
        }
    }

    private isPlayerNode(node: cc.Node): boolean {
        let current: cc.Node = node;

        while (current) {
            if (this.playerGroupName && current.group === this.playerGroupName) {
                return true;
            }

            for (let i = 0; i < this.playerNodeNames.length; i++) {
                if (current.name === this.playerNodeNames[i]) {
                    return true;
                }
            }

            current = current.parent;
        }

        return false;
    }
}