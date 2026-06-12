const { ccclass, property } = cc._decorator;

@ccclass
export default class CameraFollow extends cc.Component {
    @property(cc.Node)
    target: cc.Node = null;

    @property
    minX: number = 480;

    @property
    maxX: number = 1120;

    @property
    minY: number = 320;

    @property
    maxY: number = 320;

    update(dt: number) {
        if (!this.target) return;

        const targetX = this.target.x;
        const targetY = this.target.y;

        const x = cc.misc.clampf(targetX, this.minX, this.maxX);
        const y = cc.misc.clampf(targetY, this.minY, this.maxY);

        this.node.setPosition(x, y);
    }
}