import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBv2RmxEusF8OHVfksKDx98vX4md74HYkw",
  authDomain: "pacanica-274d6.firebaseapp.com",
  projectId: "pacanica-274d6",
  storageBucket: "pacanica-274d6.firebasestorage.app",
  messagingSenderId: "664164591131",
  appId: "1:664164591131:web:c858e13125d2b88de6babe",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);