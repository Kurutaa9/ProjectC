declare const firebase: any;

import LevelTimer from "./LevelTimer";

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

    public static getBestTime(level: number): number {
        const value = cc.sys.localStorage.getItem(this.getBestTimeKey(level));
        return this.toPositiveNumber(value);
    }

    public static completeLevel(level: number, earnedStars: number, elapsedTimeSeconds?: number): void {
        this.init();

        this.setStars(level, earnedStars);

        if (typeof elapsedTimeSeconds === "number" && elapsedTimeSeconds > 0) {
            this.setBestTime(level, elapsedTimeSeconds);
        }

        const currentUnlockedLevel = this.getUnlockedLevel();
        const nextLevel = level + 1;

        if (nextLevel <= this.MAX_LEVEL && nextLevel > currentUnlockedLevel) {
            this.setUnlockedLevel(nextLevel);
            cc.sys.localStorage.setItem(this.KEY_JUST_UNLOCKED_LEVEL, nextLevel.toString());
        }
    }

    public static recordCurrentLevelResult(level: number): void {
        const timer = this.findCurrentLevelTimer();

        if (!timer) {
            cc.warn("GameProgress: 找不到 LevelTimer，無法儲存最佳時間。");
            return;
        }

        const elapsedTimeSeconds = timer.stopTimer();
        const earnedStars = timer.getStarCount();

        this.completeLevel(level, earnedStars, elapsedTimeSeconds);
        this.syncBestTimeToFirestore(level, elapsedTimeSeconds);
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

    private static setBestTime(level: number, elapsedTimeSeconds: number): void {
        const normalizedElapsed = this.toPositiveNumber(elapsedTimeSeconds);
        if (normalizedElapsed <= 0) {
            return;
        }

        const currentBestTime = this.getBestTime(level);

        if (currentBestTime > 0 && normalizedElapsed >= currentBestTime) {
            return;
        }

        cc.sys.localStorage.setItem(this.getBestTimeKey(level), String(normalizedElapsed));
    }

    private static syncBestTimeToFirestore(level: number, elapsedTimeSeconds: number): void {
        if (typeof firebase === "undefined") {
            cc.warn("GameProgress: firebase is undefined, skip Firestore sync.");
            return;
        }

        if (!firebase.auth || !firebase.firestore) {
            cc.warn("GameProgress: firebase auth/firestore not ready, skip Firestore sync.");
            return;
        }

        const bestTime = this.toPositiveNumber(this.getBestTime(level));
        if (bestTime <= 0) {
            cc.log("GameProgress: skip Firestore sync (not a best run).", {
                level,
                elapsedTimeSeconds,
                bestTime
            });
            return;
        }

        const user = firebase.auth().currentUser;
        if (user) {
            this.writeBestTimeToFirestore(level, bestTime, user);
            return;
        }

        cc.warn("GameProgress: currentUser is null, waiting for auth state to sync.");

        const unsubscribe = firebase.auth().onAuthStateChanged((authUser: any) => {
            unsubscribe();

            if (!authUser) {
                cc.warn("GameProgress: auth state still null, skip Firestore sync.");
                return;
            }

            this.writeBestTimeToFirestore(level, bestTime, authUser);
        }, (error: any) => {
            cc.warn("GameProgress: auth state listener failed", error);
        });
    }

    private static writeBestTimeToFirestore(level: number, bestTime: number, user: any): void {
        if (!user || !user.uid) {
            cc.warn("GameProgress: invalid user when writing Firestore best time.");
            return;
        }

        const data: any = {
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            username: user.displayName || "Player",
            email: user.email || "",
            bestTimes: {}
        };

        // Force Firestore field type to Number for leaderboard sorting.
        data.bestTimes[this.getLevelFieldName(level)] = Number(bestTime);

        firebase.firestore()
            .collection("players")
            .doc(user.uid)
            .set(data, { merge: true })
            .then(() => {
                cc.log("GameProgress: Firestore best time synced", {
                    uid: user.uid,
                    level,
                    bestTime
                });
            })
            .catch((error: any) => {
                cc.warn("GameProgress: Firestore best time save failed", error);
            });
    }

    private static getLevelFieldName(level: number): string {
        return "level" + level + "BestTime";
    }

    private static getBestTimeKey(level: number): string {
        return "level_" + level + "_best_time";
    }

    private static toPositiveNumber(value: any): number {
        if (typeof value === "number") {
            return isFinite(value) && value > 0 ? value : 0;
        }

        if (typeof value === "string") {
            const parsed = Number(value);
            return isFinite(parsed) && parsed > 0 ? parsed : 0;
        }

        return 0;
    }

    private static findCurrentLevelTimer(): LevelTimer | null {
        const scene = cc.director.getScene();

        if (!scene) {
            return null;
        }

        return this.findLevelTimerRecursive(scene);
    }

    private static findLevelTimerRecursive(root: cc.Node): LevelTimer | null {
        if (!root) {
            return null;
        }

        const timer = root.getComponent(LevelTimer);
        if (timer) {
            return timer;
        }

        for (let i = 0; i < root.childrenCount; i++) {
            const match = this.findLevelTimerRecursive(root.children[i]);
            if (match) {
                return match;
            }
        }

        return null;
    }
}