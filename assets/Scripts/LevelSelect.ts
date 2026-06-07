const { ccclass, property } = cc._decorator;

import GameProgress from "./GameProgress";
import LevelItem from "./LevelItem";

@ccclass
export default class LevelSelect extends cc.Component {

    @property([LevelItem])
    levelItems: LevelItem[] = [];

    @property([cc.String])
    levelSceneNames: string[] = [
        "Level1",
        "Level2",
        "Level3",
        "Level4",
        "Level5"
    ];

    start(): void {
        this.refreshLevelItems();
    }

    private refreshLevelItems(): void {
        GameProgress.init();

        const unlockedLevel = GameProgress.getUnlockedLevel();
        const justUnlockedLevel = GameProgress.getJustUnlockedLevel();

        for (let i = 0; i < this.levelItems.length; i++) {
            const levelNumber = i + 1;
            const item = this.levelItems[i];

            if (!item) {
                continue;
            }

            const isUnlocked = levelNumber <= unlockedLevel;
            const stars = GameProgress.getStars(levelNumber);
            const shouldPlayUnlockAnimation = levelNumber === justUnlockedLevel;

            item.setup(
                levelNumber,
                isUnlocked,
                stars,
                shouldPlayUnlockAnimation,
                this.goToLevel.bind(this)
            );
        }

        if (justUnlockedLevel > 0) {
            GameProgress.clearJustUnlockedLevel();
        }
    }

    private goToLevel(levelNumber: number): void {
        const sceneName = this.levelSceneNames[levelNumber - 1];

        if (!sceneName) {
            cc.warn("找不到對應的關卡 Scene，levelNumber = " + levelNumber);
            return;
        }

        cc.director.loadScene(sceneName);
    }

    public resetProgressForTesting(): void {
        GameProgress.resetProgress();
        this.refreshLevelItems();
    }
}