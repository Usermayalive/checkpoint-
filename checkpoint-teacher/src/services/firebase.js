import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC0MTzKqaknSP_Hf_vj6Kf3J1IWb3aczxA",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "checkpoint-b81c0.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "checkpoint-b81c0",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "checkpoint-b81c0.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1068039544149",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1068039544149:web:86ba3c7fc1cae7e77ee3dc",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-WR8VPK3E15"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();