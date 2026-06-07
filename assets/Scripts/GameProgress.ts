export default class GameProgress {
    private static readonly MAX_LEVEL: number = 5;

    private static readonly KEY_UNLOCKED_LEVEL: string = "unlockedLevel";
    private static readonly KEY_JUST_UNLOCKED_LEVEL: string = "justUnlockedLevel";

    public static init(): void {
        if (!cc.sys.localStorage.getItem(this.KEY_UNLOCKED_LEVEL)) {
            cc.sys.localStorage.setItem(this.KEY_UNLOCKED_LEVEL, "1");
        }
    }

    public static getUnlockedLevel(): number {
        this.init();

        const value = cc.sys.localStorage.getItem(this.KEY_UNLOCKED_LEVEL);
        let unlockedLevel = parseInt(value);

        if (isNaN(unlockedLevel)) {
            unlockedLevel = 1;
        }

        unlockedLevel = Math.max(1, Math.min(this.MAX_LEVEL, unlockedLevel));
        return unlockedLevel;
    }

    public static setUnlockedLevel(level: number): void {
        level = Math.max(1, Math.min(this.MAX_LEVEL, level));
        cc.sys.localStorage.setItem(this.KEY_UNLOCKED_LEVEL, level.toString());
    }

    public static getStars(level: number): number {
        const value = cc.sys.localStorage.getItem(this.getStarKey(level));
        let stars = parseInt(value);

        if (isNaN(stars)) {
            stars = 0;
        }

        stars = Math.max(0, Math.min(3, stars));
        return stars;
    }

    public static setStars(level: number, stars: number): void {
        stars = Math.max(0, Math.min(3, stars));

        const oldStars = this.getStars(level);

        if (stars > oldStars) {
            cc.sys.localStorage.setItem(this.getStarKey(level), stars.toString());
        }
    }

    public static completeLevel(level: number, earnedStars: number): void {
        this.init();

        this.setStars(level, earnedStars);

        const currentUnlockedLevel = this.getUnlockedLevel();
        const nextLevel = level + 1;

        if (nextLevel <= this.MAX_LEVEL && nextLevel > currentUnlockedLevel) {
            this.setUnlockedLevel(nextLevel);
            cc.sys.localStorage.setItem(this.KEY_JUST_UNLOCKED_LEVEL, nextLevel.toString());
        }
    }

    public static getJustUnlockedLevel(): number {
        const value = cc.sys.localStorage.getItem(this.KEY_JUST_UNLOCKED_LEVEL);
        let level = parseInt(value);

        if (isNaN(level)) {
            return 0;
        }

        return level;
    }

    public static clearJustUnlockedLevel(): void {
        cc.sys.localStorage.removeItem(this.KEY_JUST_UNLOCKED_LEVEL);
    }

    public static resetProgress(): void {
        cc.sys.localStorage.removeItem(this.KEY_UNLOCKED_LEVEL);
        cc.sys.localStorage.removeItem(this.KEY_JUST_UNLOCKED_LEVEL);

        for (let i = 1; i <= this.MAX_LEVEL; i++) {
            cc.sys.localStorage.removeItem(this.getStarKey(i));
        }

        this.init();
    }

    private static getStarKey(level: number): string {
        return "level_" + level + "_stars";
    }
}