// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// เอาโค้ด config ที่ได้จาก Firebase ของคุณมาแทนที่ตรงนี้ทั้งหมด
const firebaseConfig = {
  apiKey: "AIzaSyCxRcCOjo5pLnIOtml2YnNLZjGCVz5hjqQ",
  authDomain: "aipd-box-quotation-app.firebaseapp.com",
  projectId: "aipd-box-quotation-app",
  storageBucket: "aipd-box-quotation-app.firebasestorage.app",
  messagingSenderId: "283905563602",
  appId: "1:283905563602:web:71905eaf024e4fa1b1460b",
  measurementId: "G-6570T5DGR0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();