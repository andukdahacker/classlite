// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
  measurementId: "G-BZ4PGCHMNK"
};

export const firebase = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebase);