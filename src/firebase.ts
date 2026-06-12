import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBq0BOwOvVNnUm-THvJ_toHdbTGQKWgcV4",
  authDomain: "smart-attendance-2026-a2419.firebaseapp.com",
  projectId: "smart-attendance-2026-a2419",
  storageBucket: "smart-attendance-2026-a2419.firebasestorage.app",
  messagingSenderId: "42834906398",
  appId: "1:42834906398:web:f3a8279cf23b166e878d0f",
  measurementId: "G-ZZNBQV0B33"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;
