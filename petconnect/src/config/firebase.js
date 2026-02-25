import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAfsMIMYuUOROXl2uZV2UZvQdhpw_1Hlb8",
  authDomain: "petconnect-8d630.firebaseapp.com",
  projectId: "petconnect-8d630",
  storageBucket: "petconnect-8d630.firebasestorage.app",
  messagingSenderId: "1028679772445",
  appId: "1:1028679772445:web:5acd8091bc49a160e019f4",
  measurementId: "G-DCRM2TQS7T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use in other components
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // For pet profile photos