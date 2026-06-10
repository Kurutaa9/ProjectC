const { ccclass } = cc._decorator;

@ccclass
export default class InteractableGem extends cc.Component {

    private fireboyInside = false;
    private watergirlInside = false;

    onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onBeginContact(contact, selfCollider, otherCollider) {

        if (otherCollider.node.name === "Fireboy") {
            this.fireboyInside = true;
        }

        if (otherCollider.node.name === "Watergirl") {
            this.watergirlInside = true;
        }
    }

    onEndContact(contact, selfCollider, otherCollider) {

        if (otherCollider.node.name === "Fireboy") {
            this.fireboyInside = false;
        }

        if (otherCollider.node.name === "Watergirl") {
            this.watergirlInside = false;
        }
    }

    onKeyDown(event: cc.Event.EventKeyboard) {

        // Fireboy uses E

        if (
            event.keyCode === cc.macro.KEY.e &&
            this.fireboyInside
        ) {
            this.node.destroy();
        }

        // Watergirl uses ENTER

        if (
            event.keyCode === cc.macro.KEY.enter &&
            this.watergirlInside
        ) {
            this.node.destroy();
        }
    }
}