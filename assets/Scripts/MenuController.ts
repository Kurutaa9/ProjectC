const { ccclass, property } = cc._decorator;

declare const firebase: any;

@ccclass
export default class MenuController extends cc.Component {

    // ==========================================
    // 1. UI 節點綁定區 
    // ==========================================
    @property(cc.Node) leaderboardModal: cc.Node = null;
    @property(cc.Node) accountModal: cc.Node = null; 
    @property(cc.Node) settingsModal: cc.Node = null;
    @property(cc.Node) toastNode: cc.Node = null;

    // --- 主畫面要隱藏的 UI ---
    @property(cc.Node) titleNode: cc.Node = null;
    @property(cc.Node) startBtnNode: cc.Node = null;
    @property(cc.Node) leaderboardBtnNode: cc.Node = null;
    
    // --- 全螢幕透明關閉按鈕 ---
    @property(cc.Node) closeBgBtn: cc.Node = null;

    // --- 🌟 排行榜 (Leaderboard) 純文字分頁版 ---
    @property(cc.Label) leaderboardText: cc.Label = null; // 綁定中間那個純文字節點
    @property(cc.Node) prevPageBtn: cc.Node = null;       // 綁定左邊的箭頭按鈕
    @property(cc.Node) nextPageBtn: cc.Node = null;       // 綁定右邊的箭頭按鈕

    // --- Account 相關 ---
    @property(cc.Node) profileView: cc.Node = null;   
    @property(cc.Node) editView: cc.Node = null;      
    @property(cc.Label) usernameLabel: cc.Label = null; 
    @property(cc.Label) scoreLabel: cc.Label = null;    
    @property(cc.EditBox) usernameEditBox: cc.EditBox = null;  
    @property(cc.EditBox) oldPasswordEditBox: cc.EditBox = null; 
    @property(cc.EditBox) newPasswordEditBox: cc.EditBox = null; 

    // --- Settings 相關 ---
    @property(cc.Slider) bgmSlider: cc.Slider = null;
    @property(cc.Slider) sfxSlider: cc.Slider = null;
    @property(cc.Sprite) bgmIcon: cc.Sprite = null;
    @property(cc.Sprite) sfxIcon: cc.Sprite = null;
    @property([cc.SpriteFrame]) sfxFrames: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame) bgmNormalFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) bgmMutedFrame: cc.SpriteFrame = null;

    // --- 分頁狀態變數 ---
    private leaderboardData: any[] = [];
    private currentPage: number = 0;
    private readonly ITEMS_PER_PAGE: number = 5;

    onLoad () {
        this.closeAllModals();

        let savedBgm = cc.sys.localStorage.getItem("bgmVolume");
        let savedSfx = cc.sys.localStorage.getItem("sfxVolume");
        
        let bgmVol = (savedBgm !== null && savedBgm !== "") ? parseFloat(savedBgm) : 0.5;
        let sfxVol = (savedSfx !== null && savedSfx !== "") ? parseFloat(savedSfx) : 0.5;

        if (this.bgmSlider && this.sfxSlider) {
            this.bgmSlider.progress = bgmVol;
            this.sfxSlider.progress = sfxVol;
            this.onBGMSliderMoved(this.bgmSlider);
            this.onSFXSliderMoved(this.sfxSlider);
        }
    }

    // ==========================================
    // Toast 提示功能
    // ==========================================
    showToast (message: string) {
        if (!this.toastNode) {
            console.error("❌ 嚴重錯誤：MenuController 上的 [Toast Node] 欄位沒有綁定任何節點！");
            return;
        }
        
        let label = this.toastNode.getComponent(cc.Label);
        if (!label) label = this.toastNode.getComponentInChildren(cc.Label);
        if (!label) return;

        label.string = message;
        this.toastNode.active = true;
        this.toastNode.opacity = 255; 

        this.toastNode.stopAllActions();
        this.unscheduleAllCallbacks();

        this.scheduleOnce(() => {
            this.toastNode.active = false;
        }, 2.0);
    }

    // ==========================================
    // 核心控制邏輯：總開關
    // ==========================================
    public closeAllModals () {
        if (this.leaderboardModal) this.leaderboardModal.active = false;
        if (this.accountModal) this.accountModal.active = false;
        if (this.settingsModal) this.settingsModal.active = false;

        if (this.titleNode) this.titleNode.active = true;
        if (this.startBtnNode) this.startBtnNode.active = true;
        if (this.leaderboardBtnNode) this.leaderboardBtnNode.active = true;
        if (this.closeBgBtn) this.closeBgBtn.active = false;
    }

    closeLeaderboardModal () { this.closeAllModals(); }
    closeSettingsModal () { this.closeAllModals(); }
    closeAccountModal () { this.closeAllModals(); }

    private hideMainUIForModal () {
        if (this.titleNode) this.titleNode.active = false;
        if (this.startBtnNode) this.startBtnNode.active = false;
        if (this.leaderboardBtnNode) this.leaderboardBtnNode.active = false;
        if (this.closeBgBtn) this.closeBgBtn.active = true;
    }

    // ==========================================
    // 🌟 排行榜功能 (純文字分頁版)
    // ==========================================
    openLeaderboardModal () {
        this.closeAllModals();      
        this.hideMainUIForModal();  
        this.leaderboardModal.active = true;

        this.leaderboardText.string = "Loading...";
        this.prevPageBtn.active = false;
        this.nextPageBtn.active = false;

        this.fetchLeaderboardData();
    }

    fetchLeaderboardData () {
        // 一次抓 50 筆資料下來做分頁
        firebase.firestore().collection("players")
            .orderBy("bestTimes.level1BestTime", "asc") 
            .limit(50) 
            .get()
            .then((querySnapshot) => {
                this.leaderboardData = []; // 清空舊資料

                querySnapshot.forEach((doc) => {
                    let data = doc.data();
                    if (data.username && data.bestTimes && data.bestTimes.level1BestTime) {
                        this.leaderboardData.push({
                            name: data.username,
                            time: data.bestTimes.level1BestTime.toFixed(2)
                        });
                    }
                });

                this.currentPage = 0; // 回到第一頁
                this.renderLeaderboardPage(); // 渲染文字
            })
            .catch((error) => {
                console.error("❌ 抓取排行榜失敗：", error);
                this.leaderboardText.string = "Failed to load data.";
            });
    }

    // 將陣列轉換成純文字顯示
    renderLeaderboardPage () {
        if (this.leaderboardData.length === 0) {
            this.leaderboardText.string = "No data yet.";
            this.prevPageBtn.active = false;
            this.nextPageBtn.active = false;
            return;
        }

        // 計算這頁要顯示哪幾筆
        let startIdx = this.currentPage * this.ITEMS_PER_PAGE;
        let endIdx = startIdx + this.ITEMS_PER_PAGE;
        let pageData = this.leaderboardData.slice(startIdx, endIdx);

        // 組合純文字 (使用 \n 換行)
        let displayText = "";
        pageData.forEach((data, index) => {
            let rank = startIdx + index + 1;
            // 格式：No.1  Bella  -  20.81s (後面加兩個 \n 來拉開行距)
            displayText += `No.${rank}    ${data.name}    -    ${data.time}s\n\n`;
        });

        this.leaderboardText.string = displayText;

        // 控制左右箭頭要不要顯示
        this.prevPageBtn.active = (this.currentPage > 0);
        this.nextPageBtn.active = (endIdx < this.leaderboardData.length);
    }

    // 給左邊箭頭按鈕綁定的事件
    onPrevPageClicked () {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderLeaderboardPage();
        }
    }

    // 給右邊箭頭按鈕綁定的事件
    onNextPageClicked () {
        let maxPage = Math.ceil(this.leaderboardData.length / this.ITEMS_PER_PAGE) - 1;
        if (this.currentPage < maxPage) {
            this.currentPage++;
            this.renderLeaderboardPage();
        }
    }

    // ==========================================
    // 設定與個人檔案功能 (維持不變)
    // ==========================================
    openSettingsModal () {
        this.closeAllModals();      
        this.hideMainUIForModal();  
        this.settingsModal.active = true;
    }

    openAccountModal () {
        this.closeAllModals();      
        this.hideMainUIForModal();  
        this.accountModal.active = true;
        this.showProfileView(); 
    }

    showProfileView () {
        this.profileView.active = true;
        this.editView.active = false;

        const user = firebase.auth().currentUser;
        if (user) {
            this.usernameLabel.string = user.displayName || "匿名玩家";
            this.scoreLabel.string = "0"; 
        }
    }

    onEditButtonClicked () {
        this.profileView.active = false;
        this.editView.active = true;

        const user = firebase.auth().currentUser;
        if (user) {
            this.usernameEditBox.string = user.displayName || "";
        }
        this.oldPasswordEditBox.string = "";
        this.newPasswordEditBox.string = "";
    }

    onCancelEditClicked () {
        this.showProfileView();
    }

    private getFriendlyErrorMessage (error: any): string {
        if (!error) return "An unknown error occurred.";
        
        const errorCode = error.code;
        const errorMsg = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);

        if (errorCode === 'auth/wrong-password' || 
            errorCode === 'auth/invalid-credential' || 
            errorCode === 'auth/invalid-login-credentials' ||
            errorMsg.includes("INVALID_LOGIN_CREDENTIALS")) {
            return "Incorrect old password.";
        }

        switch (errorCode) {
            case 'auth/weak-password': return "Password is too weak. (Min. 6 chars)";
            case 'auth/requires-recent-login': return "Session expired. Please re-login.";
            case 'auth/network-request-failed': return "Network error. Please try again.";
            case 'auth/too-many-requests': return "Too many attempts. Try again later.";
            default: return errorMsg;
        }
    }

    private syncPlayerProfileDoc(user: any): Promise<void> {
        if (typeof firebase === "undefined" || !user) {
            return Promise.resolve();
        }

        const payload: any = {
            username: user.displayName || "Player",
            email: user.email || "",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        return firebase.firestore()
            .collection("players")
            .doc(user.uid)
            .set(payload, { merge: true })
            .catch((error: any) => {
                cc.warn("MenuController: failed to sync profile to Firestore", error);
            });
    }

    onSaveProfileClicked () {
        const user = firebase.auth().currentUser;
        if (!user) {
            this.showToast("User not logged in!");
            return;
        }

        const newName = this.usernameEditBox.string.trim();
        const oldPassword = this.oldPasswordEditBox.string;
        const newPassword = this.newPasswordEditBox.string;

        const isNameChanged = (newName !== "" && newName !== user.displayName);
        const isPasswordChanged = (newPassword !== "");

        if (this.usernameEditBox.string.trim() === "") {
            this.showToast("Username cannot be empty.");
            return;
        }

        if (!isNameChanged && !isPasswordChanged) {
            this.showToast("No changes made.");
            this.showProfileView();
            return;
        }

        if (isPasswordChanged) {
            if (!oldPassword) {
                this.showToast("Please enter your old password.");
                return;
            }
            if (newPassword.length < 6) {
                this.showToast("New password must be at least 6 chars.");
                return;
            }
        }

        if (!isPasswordChanged && oldPassword) {
            this.showToast("Please enter a new password.");
            return;
        }
        
        if (isPasswordChanged) {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPassword);
            
            user.reauthenticateWithCredential(credential).then(() => {
                return user.updatePassword(newPassword);
            }).then(() => {
                if (isNameChanged) {
                    return user.updateProfile({ displayName: newName });
                }
            }).then(() => {
                return this.syncPlayerProfileDoc(user);
            }).then(() => {
                this.showToast(isNameChanged ? "Profile updated successfully!" : "Password updated successfully!");
                this.showProfileView(); 
            }).catch((error) => {
                this.showToast(this.getFriendlyErrorMessage(error));
            });
            return; 
        }

        if (isNameChanged) {
            user.updateProfile({ displayName: newName }).then(() => {
                return this.syncPlayerProfileDoc(user);
            }).then(() => {
                this.showToast("Username updated successfully!");
                this.showProfileView();
            }).catch((error) => {
                this.showToast(this.getFriendlyErrorMessage(error));
            });
        }
    }

    onStartGameClicked () { cc.director.loadScene("LevelSelect"); }

    onSignoutClicked () {
        firebase.auth().signOut().then(() => {
            cc.sys.localStorage.setItem("bgmVolume", "0.5");
            cc.sys.localStorage.setItem("sfxVolume", "0.5");
            cc.director.loadScene("Start"); 
        });
    }

    onBGMSliderMoved (slider: cc.Slider) {
        const volume = slider.progress; 
        cc.sys.localStorage.setItem("bgmVolume", volume.toString());
        this.bgmIcon.spriteFrame = (volume === 0) ? this.bgmMutedFrame : this.bgmNormalFrame;
    }

    onSFXSliderMoved (slider: cc.Slider) {
        const volume = slider.progress;
        cc.sys.localStorage.setItem("sfxVolume", volume.toString());

        if (volume === 0) this.sfxIcon.spriteFrame = this.sfxFrames[0]; 
        else if (volume <= 0.5) this.sfxIcon.spriteFrame = this.sfxFrames[1]; 
        else this.sfxIcon.spriteFrame = this.sfxFrames[2]; 
    }
}