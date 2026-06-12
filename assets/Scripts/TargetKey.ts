const { ccclass, property } = cc._decorator;

import PlayerKey from "./PlayerKey";

@ccclass
export default class TargetKey extends cc.Component {

    @property(cc.Prefab)
    playerKeyPrefab: cc.Prefab = null;

    private collected: boolean = false;

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider): void {
        if (this.collected) {
            return;
        }

        const playerNode = otherCollider.node;
        if (!this.isPlayerNode(playerNode)) {
            return;
        }

        if (this.playerAlreadyHasKey(playerNode)) {
            return;
        }

        const playerKeyNode = this.resolvePlayerKeyNode(playerNode);
        if (!playerKeyNode) {
            cc.warn("TargetKey: 找不到 Player_key prefab/node");
            return;
        }

        this.collected = true;
        this.attachKeyToPlayer(playerKeyNode, playerNode);
        this.node.destroy();
    }

    private isPlayerNode(node: cc.Node): boolean {
        return !!node && (node.name === "Fireboy" || node.name === "Watergirl");
    }

    private resolvePlayerKeyNode(playerNode: cc.Node): cc.Node | null {
        const directChild = playerNode.getChildByName("Player_key");
        if (directChild) {
            return directChild;
        }

        const scene = cc.director.getScene();
        if (scene) {
            const sceneKey = this.findNodeByName(scene, "Player_key");
            if (sceneKey) {
                return sceneKey;
            }
        }

        if (this.playerKeyPrefab) {
            const newKey = cc.instantiate(this.playerKeyPrefab);
            newKey.name = "Player_key";
            cc.director.getScene().addChild(newKey);
            return newKey;
        }

        return null;
    }

    private attachKeyToPlayer(playerKeyNode: cc.Node, playerNode: cc.Node): void {
        const playerKey = playerKeyNode.getComponent(PlayerKey);
        if (playerKey) {
            playerKey.attachTo(playerNode);
            return;
        }

        playerKeyNode.parent = playerNode;
        playerKeyNode.setPosition(0, playerNode.height * 0.75);
        playerKeyNode.zIndex = 999;
        playerKeyNode.active = true;
    }

    private playerAlreadyHasKey(playerNode: cc.Node): boolean {
        for (let i = 0; i < playerNode.childrenCount; i++) {
            const child = playerNode.children[i];
            if (child.active && child.name.toLowerCase().indexOf("key") !== -1) {
                return true;
            }
        }
        return false;
    }

    private findNodeByName(root: cc.Node, targetName: string): cc.Node | null {
        if (!root) {
            return null;
        }

        if (root.name === targetName) {
            return root;
        }

        for (let i = 0; i < root.childrenCount; i++) {
            const child = root.children[i];
            const match = this.findNodeByName(child, targetName);
            if (match) {
                return match;
            }
        }

        return null;
    }
}