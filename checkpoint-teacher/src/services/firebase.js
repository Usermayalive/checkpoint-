import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC0MTzKqaknSP_Hf_vj6Kf3J1IWb3aczxA",
  authDomain: "checkpoint-b81c0.firebaseapp.com",
  projectId: "checkpoint-b81c0",
  storageBucket: "checkpoint-b81c0.firebasestorage.app",
  messagingSenderId: "1068039544149",
  appId: "1:1068039544149:web:86ba3c7fc1cae7e77ee3dc",
  measurementId: "G-WR8VPK3E15"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();