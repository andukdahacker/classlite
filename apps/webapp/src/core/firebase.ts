// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDNMsGfLxgq2OmD0xcBZo4rjC5y2ZDpdjI",
  authDomain: "claite-87848.firebaseapp.com",
  projectId: "claite-87848",
  storageBucket: "claite-87848.firebasestorage.app",
  messagingSenderId: "776124420322",
  appId: "1:776124420322:web:d5b22f779b3eefc95ecebb",
  measurementId: "G-BZ4PGCHMNK",
};

export const firebase = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebase);

// Connect to Firebase Auth Emulator in development/test mode
// In dev mode on localhost, always use the emulator
const isLocalDev =
  import.meta.env.DEV && window.location.hostname === "localhost";
const useEmulator =
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true" || isLocalDev;

if (import.meta.env.DEV) {
  console.log("[Firebase] Configuration:");
  console.log(
    "  VITE_USE_FIREBASE_EMULATOR:",
    import.meta.env.VITE_USE_FIREBASE_EMULATOR,
  );
  console.log("  DEV mode:", import.meta.env.DEV);
  console.log("  hostname:", window.location.hostname);
  console.log("  useEmulator:", useEmulator);
}

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
