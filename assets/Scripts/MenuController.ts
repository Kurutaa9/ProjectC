const { ccclass, property } = cc._decorator;

declare const firebase: any;

@ccclass
export default class MenuController extends cc.Component {

    // ==========================================
    // 1. UI 節點綁定區 
    // ==========================================
    @property(cc.Node) leaderboardModal: cc.Node = null;
    @property(cc.Node) accountModal: cc.Node = null; 

    @property(cc.Node) profileView: cc.Node = null;   
    @property(cc.Node) editView: cc.Node = null;      

    @property(cc.Label) usernameLabel: cc.Label = null; 
    @property(cc.Label) scoreLabel: cc.Label = null;    

    @property(cc.EditBox) usernameEditBox: cc.EditBox = null;  
    @property(cc.EditBox) oldPasswordEditBox: cc.EditBox = null; 
    @property(cc.EditBox) newPasswordEditBox: cc.EditBox = null; 

    onLoad () {
        this.closeLeaderboardModal();
        this.closeAccountModal();
        
        if (this.settingsModal) {
            this.settingsModal.active = false;
        }

        // 🌟 遊戲載入時，從 LocalStorage 讀取玩家存好的音量
        // 如果是第一次玩 (沒存過)，就給預設值 0.5
        let savedBgm = cc.sys.localStorage.getItem("bgmVolume");
        let savedSfx = cc.sys.localStorage.getItem("sfxVolume");
        
        let bgmVol = (savedBgm !== null && savedBgm !== "") ? parseFloat(savedBgm) : 0.5;
        let sfxVol = (savedSfx !== null && savedSfx !== "") ? parseFloat(savedSfx) : 0.5;

        if (this.bgmSlider && this.sfxSlider) {
            this.bgmSlider.progress = bgmVol;
            this.sfxSlider.progress = sfxVol;

            // 主動呼叫一次事件，讓 Icon 圖案一開始就顯示正確的狀態
            this.onBGMSliderMoved(this.bgmSlider);
            this.onSFXSliderMoved(this.sfxSlider);
        }
    }

    // ==========================================
    // 2. 排行榜功能
    // ==========================================
    openLeaderboardModal () {
        this.leaderboardModal.active = true;
    }

    closeLeaderboardModal () {
        this.leaderboardModal.active = false;
    }

    // ==========================================
    // 3. 登出功能
    // ==========================================
    onSignoutClicked () {
        firebase.auth().signOut()
            .then(() => {
                console.log("登出成功！");

                // 🌟 登出時，把 localStorage 裡的音量設定洗掉恢復預設 0.5
                cc.sys.localStorage.setItem("bgmVolume", "0.5");
                cc.sys.localStorage.setItem("sfxVolume", "0.5");

                cc.director.loadScene("Start"); 
            })
            .catch((error: any) => {
                console.log("登出失敗:", error.message);
            });
    }

    // ==========================================
    // 4. 個人檔案功能
    // ==========================================
    openAccountModal () {
        this.accountModal.active = true;
        this.showProfileView(); 
    }

    closeAccountModal () {
        this.accountModal.active = false;
    }

    showProfileView () {
        this.profileView.active = true;
        this.editView.active = false;

        const user = firebase.auth().currentUser;
        if (user) {
            this.usernameLabel.string = user.displayName || "匿名玩家";
            this.scoreLabel.string = "0"; 
        } else {
            console.log("目前沒有使用者登入！");
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

    onSaveProfileClicked () {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log("找不到使用者，無法儲存");
            return;
        }

        const newName = this.usernameEditBox.string;
        const oldPassword = this.oldPasswordEditBox.string;
        const newPassword = this.newPasswordEditBox.string;

        if (!newName) {
            console.log("名字不能為空！");
            return;
        }

        console.log("正在儲存修改...");

        user.updateProfile({
            displayName: newName
        }).then(() => {
            console.log("名字修改成功！");

            if (newPassword) {
                if (!oldPassword) {
                    console.log("修改密碼失敗：必須輸入舊密碼進行驗證！");
                    return;
                }

                const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPassword);

                return user.reauthenticateWithCredential(credential)
                    .then(() => {
                        return user.updatePassword(newPassword);
                    })
                    .then(() => {
                        console.log("密碼修改成功！");
                        this.showProfileView(); 
                    })
                    .catch((error: any) => {
                        console.log("密碼修改失敗(可能是舊密碼錯誤):", error.message);
                    });
            } else {
                this.showProfileView();
            }
        }).catch((error: any) => {
            console.log("暱稱修改失敗:", error.message);
        });
    }

    // ==========================================
    // 5. 開始遊戲
    // ==========================================
    onStartGameClicked () {
        console.log("進入關卡選擇畫面！");
        cc.director.loadScene("LevelSelect");
    }

    // ==========================================
    // 6. 設定功能 (Settings Modal)
    // ==========================================
    @property(cc.Node) settingsModal: cc.Node = null;

    @property(cc.Slider) bgmSlider: cc.Slider = null;
    @property(cc.Slider) sfxSlider: cc.Slider = null;

    @property(cc.Sprite) bgmIcon: cc.Sprite = null;
    @property(cc.Sprite) sfxIcon: cc.Sprite = null;

    @property([cc.SpriteFrame]) sfxFrames: cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame) bgmNormalFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) bgmMutedFrame: cc.SpriteFrame = null;

    openSettingsModal () {
        this.settingsModal.active = true;
    }

    closeSettingsModal () {
        this.settingsModal.active = false;
    }

    // 當 BGM 滑桿被拉動時 (實時觸發)
    onBGMSliderMoved (slider: cc.Slider) {
        const volume = slider.progress; 
        
        // 🌟 把新數值永久存進瀏覽器緩存
        cc.sys.localStorage.setItem("bgmVolume", volume.toString());
        
        if (volume === 0) {
            this.bgmIcon.spriteFrame = this.bgmMutedFrame;
        } else {
            this.bgmIcon.spriteFrame = this.bgmNormalFrame;
        }
    }

    // 當 SFX 滑桿被拉動時 (實時觸發)
    onSFXSliderMoved (slider: cc.Slider) {
        const volume = slider.progress;

        // 🌟 把新數值永久存進瀏覽器緩存
        cc.sys.localStorage.setItem("sfxVolume", volume.toString());

        if (volume === 0) {
            this.sfxIcon.spriteFrame = this.sfxFrames[0]; 
        } else if (volume <= 0.5) {
            this.sfxIcon.spriteFrame = this.sfxFrames[1]; 
        } else {
            this.sfxIcon.spriteFrame = this.sfxFrames[2]; 
        }
    }
}