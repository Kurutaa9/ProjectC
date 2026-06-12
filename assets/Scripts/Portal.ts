const { ccclass } = cc._decorator;

@ccclass
export default class Portal extends cc.Component {

    private fireboyInside: boolean = false;
    private watergirlInside: boolean = false;

    onBeginContact(contact, selfCollider, otherCollider) {

        if (otherCollider.node.name === "Fireboy") {
            this.fireboyInside = true;
        }

        if (otherCollider.node.name === "Watergirl") {
            this.watergirlInside = true;
        }

        this.checkWin();
    }

    onEndContact(contact, selfCollider, otherCollider) {

        if (otherCollider.node.name === "Fireboy") {
            this.fireboyInside = false;
        }

        if (otherCollider.node.name === "Watergirl") {
            this.watergirlInside = false;
        }
    }

    checkWin() {

        if (this.fireboyInside && this.watergirlInside) {

            cc.log("LEVEL COMPLETE");

            cc.director.loadScene("LevelSelect");
        }
    }
}