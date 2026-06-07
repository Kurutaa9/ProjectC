const {ccclass, property} = cc._decorator;

declare const firebase: any;

@ccclass
export default class MenuControl extends cc.Component {

    // ==========================================
    // 1. UI 節點綁定區 (等一下要回 Cocos 編輯器拉過去)
    // ==========================================

    // --- 主畫面 UI ---
    @property(cc.Node) titleNode: cc.Node = null;     // PAIRADOX 標題
    @property(cc.Node) btnLogin: cc.Node = null;      // LOGIN 按鈕
    @property(cc.Node) btnSignup: cc.Node = null;     // SIGN UP 按鈕

    // --- 註冊 Modal UI ---
    @property(cc.Node) signupModal: cc.Node = null;   // 整個 SignupModal 節點

    // --- 輸入框 (EditBox) ---
    @property(cc.EditBox) emailInput: cc.EditBox = null;
    @property(cc.EditBox) usernameInput: cc.EditBox = null;
    @property(cc.EditBox) passwordInput: cc.EditBox = null;

    // ==========================================
    // 2. 遊戲啟動與 Firebase 載入
    // ==========================================

    onLoad () {
        // 遊戲一開始先隱藏註冊框，確保只顯示主選單
        this.closeSignupModal();
        
        // 載入 Firebase
        this.loadFirebaseCDN(); 
    }

    loadFirebaseCDN () {
        if (typeof firebase !== 'undefined') {
            this.initFirebase();
            return;
        }

        console.log("Firebase loading");

        let scriptApp = document.createElement('script');
        scriptApp.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
        document.head.appendChild(scriptApp);

        scriptApp.onload = () => {
            let scriptAuth = document.createElement('script');
            scriptAuth.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js";
            document.head.appendChild(scriptAuth);

            scriptAuth.onload = () => {
                let scriptDb = document.createElement('script');
                scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js";
                document.head.appendChild(scriptDb);

                scriptDb.onload = () => {
                    console.log("Firebase CDN loading success");
                    this.initFirebase();
                };
            };
        };
    }

    initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyDFMJqYQVluueh16teNmS6ibVI5xvC0Bj0",
            authDomain: "final-project-pairadox.firebaseapp.com",
            databaseURL: "https://final-project-pairadox-default-rtdb.firebaseio.com",
            projectId: "final-project-pairadox",
            storageBucket: "final-project-pairadox.firebasestorage.app",
            messagingSenderId: "410617622965",
            appId: "1:410617622965:web:2abf993a026e98607c29fc"
        };
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialize success");
            
            console.log("Auth state:", firebase.auth());
            console.log("Firestore state:", firebase.firestore());
        }
    }

    // ==========================================
    // 3. UI 顯示切換與註冊功能
    // ==========================================

    // 打開註冊介面
    openSignupModal () {
        this.titleNode.active = false;
        this.btnLogin.active = false;
        this.btnSignup.active = false;
        
        this.signupModal.active = true;

        // 清空輸入框內容
        this.emailInput.string = '';
        this.usernameInput.string = '';
        this.passwordInput.string = '';
    }

    // 關閉註冊介面
    closeSignupModal () {
        this.titleNode.active = true;
        this.btnLogin.active = true;
        this.btnSignup.active = true;

        this.signupModal.active = false;
    }

    // 點擊 Enter 註冊按鈕
    onSignupEnterClicked () {
        const email = this.emailInput.string;
        const username = this.usernameInput.string;
        const password = this.passwordInput.string;

        // 防呆檢查
        if (!email || !username || !password) {
            console.warn("請填寫所有欄位！");
            return;
        }

        console.log("開始註冊...");

        // 呼叫 Firebase 註冊功能
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log("信箱註冊成功！準備儲存使用者名稱...");
                // 把 Username 更新進玩家的 Firebase 設定裡
                return userCredential.user.updateProfile({
                    displayName: username
                });
            })
            .then(() => {
                console.log("玩家名稱已儲存：", username);
                console.log("--- 完整註冊流程成功！ ---");
                
                // 註冊成功後關閉視窗
                this.closeSignupModal();
            })
            .catch((error) => {
                console.error("註冊失敗:", error.message);
            });
    }
}