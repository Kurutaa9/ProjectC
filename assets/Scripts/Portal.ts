const { ccclass } = cc._decorator;

import Lever from "./Lever";

@ccclass
export default class Portal extends cc.Component {

    private fireboyInside: boolean = false;
    private watergirlInside: boolean = false;
    private fireboyNode: cc.Node | null = null;
    private watergirlNode: cc.Node | null = null;

    onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {

        const sceneName = cc.director.getScene().name;

        if (otherCollider.node.name !== "Fireboy" && otherCollider.node.name !== "Watergirl") {
            return;
        }

        if (sceneName === "Level2" && this.isLeverPulled()) {
            this.loadLevelSelect();
            return;
        }

        if (otherCollider.node.name === "Fireboy") {
            this.fireboyInside = true;
            this.fireboyNode = otherCollider.node;
        }

        if (otherCollider.node.name === "Watergirl") {
            this.watergirlInside = true;
            this.watergirlNode = otherCollider.node;
        }
    }

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {

        if (otherCollider.node.name === "Fireboy") {
            this.fireboyInside = false;
            this.fireboyNode = null;
        }

        if (otherCollider.node.name === "Watergirl") {
            this.watergirlInside = false;
            this.watergirlNode = null;
        }
    }

    private onKeyDown(event: cc.Event.EventKeyboard): void {
        if (event.keyCode !== cc.macro.KEY.e) {
            return;
        }

        const sceneName = cc.director.getScene().name;

        if (sceneName === "Level1" || sceneName === "testing scene 1") {
            if ((this.fireboyInside && this.hasKeyAttached(this.fireboyNode)) || (this.watergirlInside && this.hasKeyAttached(this.watergirlNode))) {
                this.loadLevelSelect();
            }
            return;
        }
    }

    private hasKeyAttached(node: cc.Node | null): boolean {
        if (!node) {
            return false;
        }

        if (!node.active) {
            return false;
        }

        if (node.name.toLowerCase().indexOf("key") !== -1) {
            return true;
        }

        for (let i = 0; i < node.childrenCount; i++) {
            if (this.hasKeyAttached(node.children[i])) {
                return true;
            }
        }

        return false;
    }

    private isLeverPulled(): boolean {
        const scene = cc.director.getScene();
        if (!scene) {
            return false;
        }

        const leverNode = this.findNodeByName(scene, "Lever");
        if (!leverNode) {
            return false;
        }

        const lever = leverNode.getComponent(Lever);
        return !!lever && lever.isPulled;
    }

    private findNodeByName(root: cc.Node, targetName: string): cc.Node | null {
        if (!root) {
            return null;
        }

        if (root.name === targetName) {
            return root;
        }

        for (let i = 0; i < root.childrenCount; i++) {
            const match = this.findNodeByName(root.children[i], targetName);
            if (match) {
                return match;
            }
        }

        return null;
    }

    private loadLevelSelect(): void {
        cc.director.loadScene("LevelSelect");
    }
}