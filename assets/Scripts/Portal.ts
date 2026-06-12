const { ccclass } = cc._decorator;

@ccclass
export default class Portal extends cc.Component {

    private fireboyInside: boolean = false;
    private watergirlInside: boolean = false;
    private fireboyNode: cc.Node | null = null;
    private watergirlNode: cc.Node | null = null;

    // Tracks which players have already committed to the portal.
    private fireboyEntered: boolean = false;
    private watergirlEntered: boolean = false;

    onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {

        if (otherCollider.node.name !== "Fireboy" && otherCollider.node.name !== "Watergirl") {
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
        const isInteractKey =
            event.keyCode === cc.macro.KEY.e ||
            event.keyCode === cc.macro.KEY.enter ||
            event.keyCode === 13;

        if (!isInteractKey) {
            return;
        }

        const sceneName = cc.director.getScene().name;

        if (sceneName === "Level1" || sceneName === "testing scene 1" || sceneName === "Level2") {
            if (!this.fireboyEntered && this.fireboyInside && this.hasKeyAttached(this.fireboyNode)) {
                this.fireboyEntered = true;
                if (this.fireboyNode) {
                    this.fireboyNode.active = false;
                }
            }

            if (!this.watergirlEntered && this.watergirlInside && this.hasKeyAttached(this.watergirlNode)) {
                this.watergirlEntered = true;
                if (this.watergirlNode) {
                    this.watergirlNode.active = false;
                }
            }

            if (this.fireboyEntered && this.watergirlEntered) {
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

    private loadLevelSelect(): void {
        const currentScene = cc.director.getScene();
        const currentSceneName = currentScene ? currentScene.name : "";

        if (currentSceneName === "Level2") {
            cc.director.loadScene("Ending");
            return;
        }

        cc.director.loadScene("LevelSelect");
    }
}