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

    // --- 🌟 新增：主畫面要隱藏的 UI ---
    @property(cc.Node) titleNode: cc.Node = null;
    @property(cc.Node) startBtnNode: cc.Node = null;
    @property(cc.Node) leaderboardBtnNode: cc.Node = null;
    
    // --- 🌟 新增：全螢幕透明關閉按鈕 ---
    @property(cc.Node) closeBgBtn: cc.Node = null;

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

    onLoad () {
        // 遊戲一開始，確保全部 Modal 都是關的，主畫面是正常顯示的
        this.closeAllModals();

        // 讀取音量設定
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
    // 🌟 Toast 提示功能
    // ==========================================
    showToast (message: string) {
        if (!this.toastNode) {
            console.error("❌ 嚴重錯誤：MenuController 上的 [Toast Node] 欄位沒有綁定任何節點！");
            return;
        }
        
        // 嘗試從自己或子節點撈取 cc.Label
        let label = this.toastNode.getComponent(cc.Label);
        if (!label) {
            label = this.toastNode.getComponentInChildren(cc.Label);
        }

        if (!label) {
            console.error("❌ 嚴重錯誤：Toast 節點身上或子節點找不到 cc.Label 元件！");
            return;
        }

        // 設定文字並強制顯示
        label.string = message;
        this.toastNode.active = true;
        this.toastNode.opacity = 255; // 確保看得見

        // 清除之前的計時器與動作，防止連續點擊時錯亂
        this.toastNode.stopAllActions();
        this.unscheduleAllCallbacks();

        // 2.0 秒後自動隱藏
        this.scheduleOnce(() => {
            this.toastNode.active = false;
        }, 2.0);
    }

    // ==========================================
    // 🌟 核心控制邏輯：總開關
    // ==========================================
    
    // 關閉所有彈窗，並恢復主畫面
    public closeAllModals () {
        if (this.leaderboardModal) this.leaderboardModal.active = false;
        if (this.accountModal) this.accountModal.active = false;
        if (this.settingsModal) this.settingsModal.active = false;

        // 恢復主畫面按鈕
        if (this.titleNode) this.titleNode.active = true;
        if (this.startBtnNode) this.startBtnNode.active = true;
        if (this.leaderboardBtnNode) this.leaderboardBtnNode.active = true;
        
        // 隱藏透明遮罩
        if (this.closeBgBtn) this.closeBgBtn.active = false;
    }

    closeLeaderboardModal () {
        this.closeAllModals();
    }

    closeSettingsModal () {
        this.closeAllModals();
    }

    closeAccountModal () {
        this.closeAllModals();
    }

    // 隱藏主畫面，準備顯示彈窗
    private hideMainUIForModal () {
        if (this.titleNode) this.titleNode.active = false;
        if (this.startBtnNode) this.startBtnNode.active = false;
        if (this.leaderboardBtnNode) this.leaderboardBtnNode.active = false;
        
        // 顯示透明遮罩 (這樣點擊空白處才能觸發關閉)
        if (this.closeBgBtn) this.closeBgBtn.active = true;
    }

    // ==========================================
    // 排行榜功能
    // ==========================================
    openLeaderboardModal () {
        this.closeAllModals();      // 先關掉其他可能開著的 Modal
        this.hideMainUIForModal();  // 隱藏主畫面 UI
        this.leaderboardModal.active = true;
    }

    // ==========================================
    // 設定功能
    // ==========================================
    openSettingsModal () {
        this.closeAllModals();      
        this.hideMainUIForModal();  
        this.settingsModal.active = true;
    }

    // ==========================================
    // 個人檔案功能
    // ==========================================
    openAccountModal () {
        this.closeAllModals();      
        this.hideMainUIForModal();  
        this.accountModal.active = true;
        this.showProfileView(); // 每次打開保證切回預覽模式 (也就是放棄之前未儲存的編輯)
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

        // 1. 攔截 Firebase 最新的錯誤碼 (或者是整坨 JSON 裡面的關鍵字)
        if (errorCode === 'auth/wrong-password' || 
            errorCode === 'auth/invalid-credential' || 
            errorCode === 'auth/invalid-login-credentials' ||
            errorMsg.includes("INVALID_LOGIN_CREDENTIALS")) {
            return "Incorrect old password.";
        }

        // 2. 處理其他的常規錯誤
        switch (errorCode) {
            case 'auth/weak-password':
                return "Password is too weak. (Min. 6 chars)";
            case 'auth/requires-recent-login':
                return "Session expired. Please re-login.";
            case 'auth/network-request-failed':
                return "Network error. Please try again.";
            case 'auth/too-many-requests':
                return "Too many attempts. Try again later.";
            default:
                // 如果是沒預期到的錯誤，就顯示原本的訊息
                return errorMsg;
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

        // --- 防呆驗證 (失敗時只跳 Toast，停留在 Edit 畫面) ---

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

        // --- 發送 Firebase 請求 ---
        
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
                // 🌟 成功：跳 Toast，並關閉 Edit 畫面退回 Profile 畫面
                this.showToast(isNameChanged ? "Profile updated successfully!" : "Password updated successfully!");
                this.showProfileView(); 
            }).catch((error) => {
                // 失敗：跳 Toast，畫面不動
                this.showToast(this.getFriendlyErrorMessage(error));
            });
            
            return; 
        }

        if (isNameChanged) {
            user.updateProfile({ displayName: newName }).then(() => {
                return this.syncPlayerProfileDoc(user);
            }).then(() => {
                // 🌟 成功：跳 Toast，並關閉 Edit 畫面退回 Profile 畫面
                this.showToast("Username updated successfully!");
                this.showProfileView();
            }).catch((error) => {
                // 失敗：跳 Toast，畫面不動
                this.showToast(this.getFriendlyErrorMessage(error));
            });
        }
    }

    // ==========================================
    // 其他主畫面按鈕
    // ==========================================
    onStartGameClicked () {
        cc.director.loadScene("LevelSelect");
    }

    onSignoutClicked () {
        firebase.auth().signOut().then(() => {
            cc.sys.localStorage.setItem("bgmVolume", "0.5");
            cc.sys.localStorage.setItem("sfxVolume", "0.5");
            cc.director.loadScene("Start"); 
        });
    }

    // ==========================================
    // 音量 Slider 邏輯
    // ==========================================
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