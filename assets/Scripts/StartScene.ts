const {ccclass, property} = cc._decorator;

declare const firebase: any;

@ccclass
export default class MenuControl extends cc.Component {

    onLoad () {
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
}