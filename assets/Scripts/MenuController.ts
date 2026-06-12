const { ccclass, property } = cc._decorator;

declare const firebase: any;

@ccclass
export default class MenuController extends cc.Component {

    // ==========================================
    // 1. UI 節點綁定區 (照著你的層級微調)
    // ==========================================
    @property(cc.Node) leaderboardModal: cc.Node = null;
    @property(cc.Node) accountModal: cc.Node = null; // 你的母節點叫 AccountModal

    // --- Profile 內部分頁 (對應你的 profile 和 Edit) ---
    @property(cc.Node) profileView: cc.Node = null;   // 拉你的 profile 節點
    @property(cc.Node) editView: cc.Node = null;      // 拉你的 Edit 節點

    // --- Profile 顯示用元件 ---
    @property(cc.Label) usernameLabel: cc.Label = null; // 拉 text 底下的 name
    @property(cc.Label) scoreLabel: cc.Label = null;    // 拉 text 底下的 score

    // --- Profile 編輯用輸入框 (對應你的 Edit 底下) ---
    @property(cc.EditBox) usernameEditBox: cc.EditBox = null;  // 拉 Username
    @property(cc.EditBox) oldPasswordEditBox: cc.EditBox = null; // 拉 OldPassword
    @property(cc.EditBox) newPasswordEditBox: cc.EditBox = null; // 拉 NewPassword

    onLoad () {
        this.closeLeaderboardModal();
        this.closeAccountModal();
    }

    // ==========================================
    // 2. 排行榜功能 (Leaderboard)
    // ==========================================
    openLeaderboardModal () {
        this.leaderboardModal.active = true;
    }

    closeLeaderboardModal () {
        this.leaderboardModal.active = false;
    }

    // ==========================================
    // 3. 登出功能 (Signout)
    // ==========================================
    onSignoutClicked () {
        firebase.auth().signOut()
            .then(() => {
                console.log("登出成功！");
                cc.director.loadScene("Start"); 
            })
            .catch((error: any) => {
                console.log("登出失敗:", error.message);
            });
    }

    // ==========================================
    // 4. 個人檔案功能 (AccountModal)
    // ==========================================
    
    // 點擊主畫面人頭打開
    openAccountModal () {
        this.accountModal.active = true;
        this.showProfileView(); // 每次打開都先看顯示頁
    }

    // 點擊最外層大叉叉 (或者是 profile 底下的 closeBtn)
    closeAccountModal () {
        this.accountModal.active = false;
    }

    // 切換到：純顯示畫面 (profile)
    showProfileView () {
        this.profileView.active = true;
        this.editView.active = false;

        const user = firebase.auth().currentUser;
        if (user) {
            this.usernameLabel.string = user.displayName || "匿名玩家";
            // 這裡先寫死 0，等之後你們做分數資料庫時再從 Firestore 抓
            this.scoreLabel.string = "0"; 
        } else {
            console.log("目前沒有使用者登入！");
        }
    }

    // 點擊小畫筆 editBtn：切換到編輯畫面 (Edit)
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

    // 在編輯狀態下按叉叉 (Edit 底下的 closeBtn)：不儲存退回
    onCancelEditClicked () {
        this.showProfileView();
    }

    // 點擊 SaveBtn 按鈕：儲存變更
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

        // 先改名字
        user.updateProfile({
            displayName: newName
        }).then(() => {
            console.log("名字修改成功！");

            // 有填寫新密碼才觸發改密碼流程
            if (newPassword) {
                if (!oldPassword) {
                    console.log("修改密碼失敗：必須輸入舊密碼進行驗證！");
                    return;
                }

                // 用舊密碼重新驗證
                const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPassword);

                return user.reauthenticateWithCredential(credential)
                    .then(() => {
                        return user.updatePassword(newPassword);
                    })
                    .then(() => {
                        console.log("密碼修改成功！");
                        this.showProfileView(); // 成功後跳回顯示頁
                    })
                    .catch((error: any) => {
                        console.log("密碼修改失敗(可能是舊密碼錯誤):", error.message);
                    });
            } else {
                // 沒要改密碼，名字改完就直接跳回顯示頁面
                this.showProfileView();
            }
        }).catch((error: any) => {
            console.log("暱稱修改失敗:", error.message);
        });
    }

    // ==========================================
    // 5. 開始遊戲 (Start Game)
    // ==========================================
    onStartGameClicked () {
        console.log("進入關卡選擇畫面！");
        // 跳轉到選關卡場景
        cc.director.loadScene("LevelSelect");
    }

    // ==========================================
    // 6. 設定功能 (Settings Modal)
    // ==========================================
    @property(cc.Node) settingsModal: cc.Node = null;

    // --- Slider 元件 ---
    @property(cc.Slider) bgmSlider: cc.Slider = null;
    @property(cc.Slider) sfxSlider: cc.Slider = null;

    // --- Icon 的 Sprite 元件 ---
    @property(cc.Sprite) bgmIcon: cc.Sprite = null;
    @property(cc.Sprite) sfxIcon: cc.Sprite = null;

    // --- SFX 的四種音量圖案 (靜音, 小, 中, 大) ---
    @property([cc.SpriteFrame]) sfxFrames: cc.SpriteFrame[] = [];

    // --- BGM 的圖案 (正常, 靜音) ---
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
        // slider.progress 的值會是 0.0 到 1.0 之間
        const volume = slider.progress; 
        
        // 1. 視覺回饋：切換 BGM Icon (最小聲時換成禁止圖案)
        if (volume === 0) {
            this.bgmIcon.spriteFrame = this.bgmMutedFrame;
            // 如果你目前沒有畫禁止圖案，也可以先用顏色變暗來代替：
            // this.bgmIcon.node.color = cc.Color.GRAY; 
        } else {
            this.bgmIcon.spriteFrame = this.bgmNormalFrame;
            // this.bgmIcon.node.color = cc.Color.WHITE;
        }

        // 2. 預留給隊友的音效接口
        //console.log(`[UI] BGM 音量實時改變為: ${Math.round(volume * 100)}%`);
        // TODO: 等隊友寫好後，在這裡呼叫他的函數，例如：
        // AudioManager.setBGMVolume(volume);
    }

    // 當 SFX 滑桿被拉動時 (實時觸發)
    onSFXSliderMoved (slider: cc.Slider) {
        const volume = slider.progress;

        // 1. 視覺回饋：根據音量區間切換對應的喇叭 Icon
        if (volume === 0) {
            this.sfxIcon.spriteFrame = this.sfxFrames[0]; // 靜音 (打叉或沒聲波)
        } else if (volume <= 0.5) {
            this.sfxIcon.spriteFrame = this.sfxFrames[1]; // 一條聲波
        } else {
            this.sfxIcon.spriteFrame = this.sfxFrames[2]; // 兩條聲波
        }

        // 2. 預留給隊友的音效接口
        // console.log(`[UI] SFX 音量實時改變為: ${Math.round(volume * 100)}%`);
        // TODO: AudioManager.setSFXVolume(volume);
    }
}