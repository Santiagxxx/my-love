import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDCQVuB5uOT5L9g4y6Z9Z65yq-cw_A2L04',
  authDomain: 'mylove-ff661.firebaseapp.com',
  projectId: 'mylove-ff661',
  storageBucket: 'mylove-ff661.firebasestorage.app',
  messagingSenderId: '169862598592',
  appId: '1:169862598592:web:29dd20326ea3699a1bc225',
  measurementId: 'G-E86ZHLML70',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let authenticationPromise: Promise<void> | null = null;

export async function ensureAuthenticated(): Promise<void> {
  await auth.authStateReady();

  if (auth.currentUser) {
    return;
  }

  if (!authenticationPromise) {
    authenticationPromise = setPersistence(auth, browserLocalPersistence)
      .then(async () => {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      })
      .finally(() => {
        authenticationPromise = null;
      });
  }

  await authenticationPromise;
}
