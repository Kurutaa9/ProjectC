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

    // --- 🌟 新增：Toast 提示節點 ---
    @property(cc.Node) toastNode: cc.Node = null;

    // ==========================================
    // 🌟 Toast 提示功能
    // ==========================================
    showToast (message: string) {
        if (!this.toastNode) {
            console.error("❌ 尚未綁定 Toast Node！");
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

    // 專為登入/註冊設計的錯誤翻譯機
    private getFriendlyErrorMessage (error: any): string {
        if (!error) return "An unknown error occurred.";
        const errorCode = error.code;
        const errorMsg = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);

        // 攔截 Firebase 最新版的帳密錯誤
        if (errorCode === 'auth/wrong-password' || 
            errorCode === 'auth/user-not-found' || 
            errorCode === 'auth/invalid-credential' || 
            errorCode === 'auth/invalid-login-credentials' ||
            errorMsg.includes("INVALID_LOGIN_CREDENTIALS")) {
            return "Invalid email or password."; 
        }

        switch (errorCode) {
            case 'auth/invalid-email':
                return "Invalid email format.";
            case 'auth/email-already-in-use':
                return "Email is already registered.";
            case 'auth/weak-password':
                return "Password must be at least 6 chars.";
            default:
                return errorMsg;
        }
    }

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
        const email = this.emailInput.string.trim();
        const username = this.usernameInput.string.trim();
        const password = this.passwordInput.string;

        // --- 防呆驗證區 ---
        
        // 1. 使用者名稱空白
        if (username === "") {
            this.showToast("Username cannot be empty.");
            return;
        }
        
        // 2. 電子郵件基本格式檢查
        if (!email.includes("@") || !email.includes(".")) {
            this.showToast("Invalid email format.");
            return;
        }
        
        // 3. 密碼長度檢查
        if (password.length < 6) {
            this.showToast("Password must be at least 6 chars.");
            return;
        }

        // --- 呼叫 Firebase API ---
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return userCredential.user.updateProfile({
                    displayName: username
                });
            })
            .then(() => {
                this.showToast("Sign up successful!");
                this.closeSignupModal();
            })
            .catch((error) => {
                this.showToast(this.getFriendlyErrorMessage(error));
            });
    }

    // ==========================================
    // 4. 🌟 登入功能 (Login)
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
        const email = this.loginEmailInput.string.trim();
        const password = this.loginPasswordInput.string;

        // --- 防呆驗證區 ---
        
        // 防呆檢查是否有漏填
        if (email === "" || password === "") {
            this.showToast("Please fill in all fields.");
            return;
        }

        // 1. 不合的電子郵件形式
        if (!email.includes("@") || !email.includes(".")) {
            this.showToast("Invalid email format.");
            return;
        }

        // --- 呼叫 Firebase API ---
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                this.showToast("Login successful!");
                // 🌟 登入成功，跳轉到 opening 場景
                cc.director.loadScene("Opening");
            })
            .catch((error) => {
                // 2. 密碼錯誤或無此帳號 (透過翻譯機轉為 Invalid email or password)
                this.showToast(this.getFriendlyErrorMessage(error));
            });
    }
}