const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelItem extends cc.Component {

    @property(cc.Label)
    levelLabel: cc.Label = null;

    @property(cc.Node)
    lockIcon: cc.Node = null;

    @property([cc.Node])
    starNodes: cc.Node[] = [];

    @property(cc.SpriteFrame)
    yellowStarFrame: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    blackStarFrame: cc.SpriteFrame = null;

    @property(cc.Button)
    button: cc.Button = null;

    private levelNumber: number = 1;
    private clickCallback: Function = null;

    public setup(
        levelNumber: number,
        isUnlocked: boolean,
        stars: number,
        shouldPlayUnlockAnimation: boolean,
        clickCallback: Function
    ): void {
        this.levelNumber = levelNumber;
        this.clickCallback = clickCallback;

        if (!this.button) {
            this.button = this.getComponent(cc.Button);
        }

        if (this.levelLabel) {
            this.levelLabel.string = levelNumber.toString();
        }

        this.node.off("click", this.onClick, this);
        this.node.on("click", this.onClick, this);

        if (shouldPlayUnlockAnimation) {
            this.showLockedVisual();
            this.button.interactable = false;

            this.scheduleOnce(() => {
                this.playUnlockAnimation(stars);
            }, 0.3);
        } else {
            this.setUnlockedState(isUnlocked, stars);
        }
    }

    private setUnlockedState(isUnlocked: boolean, stars: number): void {
        if (this.button) {
            this.button.interactable = isUnlocked;
        }

        if (this.lockIcon) {
            this.lockIcon.active = !isUnlocked;
            this.lockIcon.opacity = 255;
            this.lockIcon.scale = 1;
        }

        if (isUnlocked) {
            this.updateStars(stars);
            this.setItemGray(false);
        } else {
            this.updateStars(0);
            this.setItemGray(true);
        }

        // 讓 lock icon 維持正常顏色，不要跟著變灰
        if (this.lockIcon) {
            this.lockIcon.color = new cc.Color(255, 255, 255, 255);
        }
    }

    private showLockedVisual(): void {
        if (this.lockIcon) {
            this.lockIcon.active = true;
            this.lockIcon.opacity = 255;
            this.lockIcon.scale = 1;
        }

        this.updateStars(0);
        this.setItemGray(true);

        // 讓 lock icon 維持正常顏色
        if (this.lockIcon) {
            this.lockIcon.color = new cc.Color(255, 255, 255, 255);
        }
    }

    private updateStars(stars: number): void {
        for (let i = 0; i < this.starNodes.length; i++) {
            const starNode = this.starNodes[i];

            if (!starNode) {
                continue;
            }

            starNode.active = true;

            const starSprite = starNode.getComponent(cc.Sprite);

            if (!starSprite) {
                cc.warn("Star node 上沒有 cc.Sprite component");
                continue;
            }

            if (i < stars) {
                starSprite.spriteFrame = this.yellowStarFrame;
            } else {
                starSprite.spriteFrame = this.blackStarFrame;
            }

            starNode.opacity = 255;
        }
    }

    private playUnlockAnimation(stars: number): void {
        if (!this.lockIcon) {
            this.setUnlockedState(true, stars);
            return;
        }

        this.node.scale = 1;

        cc.tween(this.node)
            .to(0.15, { scale: 1.12 })
            .to(0.15, { scale: 1 })
            .start();

        cc.tween(this.lockIcon)
            .to(0.15, { scale: 1.25 })
            .to(0.2, { scale: 0, opacity: 0 })
            .call(() => {
                this.lockIcon.active = false;
                this.lockIcon.scale = 1;
                this.lockIcon.opacity = 255;

                if (this.button) {
                    this.button.interactable = true;
                }

                this.updateStars(stars);
                this.setItemGray(false);
            })
            .start();
    }

    private onClick(): void {
        if (!this.button || !this.button.interactable) {
            return;
        }

        if (this.clickCallback) {
            this.clickCallback(this.levelNumber);
        }
    }
    private setItemGray(isGray: boolean): void {
    const targetColor = isGray
        ? new cc.Color(120, 120, 120, 255)
        : new cc.Color(255, 255, 255, 255);

    this.applyColorRecursively(this.node, targetColor);
}

    private applyColorRecursively(node: cc.Node, color: cc.Color): void {
        if (!node) {
            return;
        }

        node.color = color;

        for (let i = 0; i < node.childrenCount; i++) {
            this.applyColorRecursively(node.children[i], color);
        }
    }
}