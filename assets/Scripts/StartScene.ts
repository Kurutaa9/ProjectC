const {ccclass, property} = cc._decorator;

declare const firebase: any;

@ccclass
export default class MenuControl extends cc.Component {

    // ==========================================
    // 1. UI 節點綁定區
    // ==========================================

    // --- 主畫面 UI ---
    @property(cc.Node) titleNode: cc.Node = null;     // PAIRADOX 標題
    @property(cc.Node) btnLogin: cc.Node = null;      // LOGIN 按鈕
    @property(cc.Node) btnSignup: cc.Node = null;     // SIGN UP 按鈕

    // --- 註冊 (Signup) UI ---
    @property(cc.Node) signupModal: cc.Node = null;
    @property(cc.EditBox) emailInput: cc.EditBox = null;
    @property(cc.EditBox) usernameInput: cc.EditBox = null;
    @property(cc.EditBox) passwordInput: cc.EditBox = null;

    // --- 🌟 新增：登入 (Login) UI ---
    @property(cc.Node) loginModal: cc.Node = null;
    @property(cc.EditBox) loginEmailInput: cc.EditBox = null;
    @property(cc.EditBox) loginPasswordInput: cc.EditBox = null;

    // ==========================================
    // 2. 遊戲啟動與 Firebase 載入
    // ==========================================

    onLoad () {
        // 遊戲一開始先隱藏兩個 Modal
        this.closeSignupModal();
        this.closeLoginModal();
        
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
        }
    }

    // ==========================================
    // 3. 註冊功能 (Signup)
    // ==========================================

    openSignupModal () {
        this.titleNode.active = false;
        this.btnLogin.active = false;
        this.btnSignup.active = false;
        this.signupModal.active = true;

        this.emailInput.string = '';
        this.usernameInput.string = '';
        this.passwordInput.string = '';
    }

    closeSignupModal () {
        this.titleNode.active = true;
        this.btnLogin.active = true;
        this.btnSignup.active = true;
        this.signupModal.active = false;
    }

    onSignupEnterClicked () {
        const email = this.emailInput.string;
        const username = this.usernameInput.string;
        const password = this.passwordInput.string;

        if (!email || !username || !password) {
            console.warn("請填寫所有欄位！");
            return;
        }

        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return userCredential.user.updateProfile({
                    displayName: username
                });
            })
            .then(() => {
                console.log("註冊成功！玩家名稱：", username);
                this.closeSignupModal();
            })
            .catch((error) => {
                console.error("註冊失敗:", error.message);
            });
    }

    // ==========================================
    // 4. 🌟 新增：登入功能 (Login)
    // ==========================================

    openLoginModal () {
        // 隱藏主選單背景
        this.titleNode.active = false;
        this.btnLogin.active = false;
        this.btnSignup.active = false;
        
        // 顯示登入框
        this.loginModal.active = true;

        // 清空輸入框內容
        this.loginEmailInput.string = '';
        this.loginPasswordInput.string = '';
    }

    closeLoginModal () {
        // 恢復主選單背景
        this.titleNode.active = true;
        this.btnLogin.active = true;
        this.btnSignup.active = true;

        // 隱藏登入框
        this.loginModal.active = false;
    }

    onLoginEnterClicked () {
        const email = this.loginEmailInput.string;
        const password = this.loginPasswordInput.string;

        // 防呆檢查
        if (!email || !password) {
            console.warn("請填寫信箱與密碼！");
            return;
        }

        console.log("登入中...");

        // 呼叫 Firebase 登入 API
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log("登入成功！歡迎：", userCredential.user.email);
                
                // 🌟 登入成功，跳轉到 opening 場景
                cc.director.loadScene("Opening");
            })
            .catch((error) => {
                // 登入失敗 (密碼錯誤或無此帳號)
                console.error("登入失敗:", error.message);
                // 這裡可以考慮加上一段顯示錯誤訊息給玩家看的 UI (例如 Toast)
            });
    }
}