const { ccclass, property } = cc._decorator;

import GameProgress from "./GameProgress";

@ccclass
export default class Portal extends cc.Component {

    @property({
        type: [cc.SpriteFrame],
        tooltip: "Portal frames from sprite_00 to sprite_40"
    })
    portalFrames: cc.SpriteFrame[] = [];

    @property({
        tooltip: "Seconds per portal frame"
    })
    portalFrameInterval: number = 0.05;

    private fireboyInside: boolean = false;
    private watergirlInside: boolean = false;
    private fireboyNode: cc.Node | null = null;
    private watergirlNode: cc.Node | null = null;

    // Tracks which players have already committed to the portal.
    private fireboyEntered: boolean = false;
    private watergirlEntered: boolean = false;

    private portalSprite: cc.Sprite | null = null;
    private portalFrameIndex: number = 0;
    private portalElapsed: number = 0;
    private portalUnlocked: boolean = false;

    onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        const spriteNode = this.node.getChildByName("sprite_00");
        if (spriteNode) {
            this.portalSprite = spriteNode.getComponent(cc.Sprite);
        }

        this.applyPortalFrame(0);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    update(dt: number) {
        this.updatePortalAnimation(dt);
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
                this.recordAndLoadNextScene(sceneName);
            }
            return;
        }
    }

    private updatePortalAnimation(dt: number): void {
        if (!this.portalSprite || this.portalFrames.length === 0) {
            return;
        }

        if (!this.portalUnlocked && this.hasAnyPlayerWithKey()) {
            this.portalUnlocked = true;
        }

        if (!this.portalUnlocked) {
            this.portalFrameIndex = 0;
            this.portalElapsed = 0;
            this.applyPortalFrame(0);
            return;
        }

        const lastFrameIndex = this.portalFrames.length - 1;
        if (this.portalFrameIndex >= lastFrameIndex) {
            this.applyPortalFrame(lastFrameIndex);
            return;
        }

        this.portalElapsed += dt;
        if (this.portalElapsed < this.portalFrameInterval) {
            return;
        }

        this.portalElapsed = 0;
        this.portalFrameIndex = Math.min(this.portalFrameIndex + 1, lastFrameIndex);
        this.applyPortalFrame(this.portalFrameIndex);
    }

    private hasAnyPlayerWithKey(): boolean {
        const scene = cc.director.getScene();
        if (!scene) {
            return false;
        }

        const fireboy = this.findNodeByName(scene, "Fireboy");
        if (this.hasKeyAttached(fireboy)) {
            return true;
        }

        const watergirl = this.findNodeByName(scene, "Watergirl");
        return this.hasKeyAttached(watergirl);
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

    private applyPortalFrame(frameIndex: number): void {
        if (!this.portalSprite || this.portalFrames.length === 0) {
            return;
        }

        const clampedIndex = Math.max(0, Math.min(frameIndex, this.portalFrames.length - 1));
        const frame = this.portalFrames[clampedIndex];
        if (frame) {
            this.portalSprite.spriteFrame = frame;
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

    private recordAndLoadNextScene(sceneName: string): void {
        const levelNumber = this.getLevelNumber(sceneName);

        if (levelNumber > 0) {
            GameProgress.recordCurrentLevelResult(levelNumber);
        }

        if (sceneName === "Level2") {
            cc.director.loadScene("Ending");
            return;
        }

        cc.director.loadScene("LevelSelect");
    }

    private getLevelNumber(sceneName: string): number {
        if (sceneName === "Level1" || sceneName === "testing scene 1") {
            return 1;
        }

        if (sceneName === "Level2") {
            return 2;
        }

        return 0;
    }
}