const { ccclass, property } = cc._decorator;

@ccclass
export default class ScrollingBg extends cc.Component {

    @property({ tooltip: "滾動速度 (越近的圖層數字要越大)" })
    speed: number = 50; 

    @property({ tooltip: "圖片的寬度 (用來計算何時要接關)" })
    bgWidth: number = 960; 

    update (dt: number) {
        // 讓整個節點不斷往左移動
        this.node.x -= this.speed * dt;

        // 當往左移動超過一張圖片的寬度時，瞬間把它往右拉回原點，達成完美無縫接軌
        if (this.node.x <= -this.bgWidth) {
            this.node.x += this.bgWidth;
        }
    }
}