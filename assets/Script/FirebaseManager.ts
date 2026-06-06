import { _decorator } from 'cc';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFMJqYQVluueh16teNmS6ibVI5xvC0Bj0",
  authDomain: "final-project-pairadox.firebaseapp.com",
  databaseURL: "https://final-project-pairadox-default-rtdb.firebaseio.com",
  projectId: "final-project-pairadox",
  storageBucket: "final-project-pairadox.firebasestorage.app",
  messagingSenderId: "410617622965",
  appId: "1:410617622965:web:2abf993a026e98607c29fc"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);