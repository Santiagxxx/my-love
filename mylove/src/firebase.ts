import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDCQVuB5uOT5L9g4y6Z9Z65yq-cw_A2L04",
  authDomain: "mylove-ff661.firebaseapp.com",
  projectId: "mylove-ff661",
  storageBucket: "mylove-ff661.firebasestorage.app",
  messagingSenderId: "169862598592",
  appId: "1:169862598592:web:29dd20326ea3699a1bc225",
  measurementId: "G-E86ZHLML70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore and Storage instances
export const db = getFirestore(app);
export const storage = getStorage(app);
