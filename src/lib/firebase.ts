// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeI-8EZSOemIeZJN6x2etkRm6nzsjbKX0",
  authDomain: "devmoneybag.firebaseapp.com",
  projectId: "devmoneybag",
  storageBucket: "devmoneybag.firebasestorage.app",
  messagingSenderId: "502077805373",
  appId: "1:502077805373:web:1f7336774a1061436deb54",
  measurementId: "G-KVRKTMKWQ5"
};

// Initialize Firebase (Prevent multiple initializations)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);