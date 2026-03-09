// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyG_xX61vgLwyKHwPInYlD0jyl2Vb7HPk",
  authDomain: "conquistadores-a5ee3.firebaseapp.com",
  projectId: "conquistadores-a5ee3",
  storageBucket: "conquistadores-a5ee3.firebasestorage.app",
  messagingSenderId: "654512522918",
  appId: "1:654512522918:web:460b6355aa074caf43d667"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
