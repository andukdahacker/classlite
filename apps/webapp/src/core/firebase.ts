// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDNMsGfLxgq2OmD0xcBZo4rjC5y2ZDpdjI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "claite-87848.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "claite-87848",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "claite-87848.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "776124420322",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:776124420322:web:d5b22f779b3eefc95ecebb",
  measurementId: "G-BZ4PGCHMNK",
};

export const firebase = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebase);

// Connect to Firebase Auth Emulator only when explicitly enabled (e.g., E2E tests)
// Set VITE_USE_FIREBASE_EMULATOR=true in .env or CLI to enable
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

if (useEmulator) {
  // Connect to the emulator - use 127.0.0.1 to match firebase.json config
  const emulatorUrl = "http://localhost:9099";
  if (import.meta.env.DEV) {
    console.log("[Firebase] Connecting to Auth Emulator at", emulatorUrl);
  }
  try {
    connectAuthEmulator(firebaseAuth, emulatorUrl, {
      disableWarnings: true,
    });
  } catch (e) {
    console.error("[Firebase] Failed to connect to emulator:", e);
  }
}
