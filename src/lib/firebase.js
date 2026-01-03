import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5rD9N6xpkbivr8OtiqWCTmeUpgrXKI1c",
  authDomain: "visual-editor-77a78.firebaseapp.com",
  projectId: "visual-editor-77a78",
  storageBucket: "visual-editor-77a78.firebasestorage.app",
  messagingSenderId: "727150345943",
  appId: "1:727150345943:web:1a226980bc4580626cba92",
  measurementId: "G-C8744Y19X4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

