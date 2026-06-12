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
}