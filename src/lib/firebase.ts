
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDummyKeyForDevelopment12345678',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'studio-7743848061-9f621.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-7743848061-9f621',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studio-7743848061-9f621.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '7743848061',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:7743848061:web:9f6210000000000000',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators only if explicitly enabled
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log("Firestore emulator connected successfully.");
    } catch (error) {
        console.error("Error connecting to Firestore emulator: ", error);
    }
    
    // Connect to Auth emulator
    try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log("Auth emulator connected successfully.");
    } catch (error) {
        console.error("Error connecting to Auth emulator: ", error);
    }
}

export { db, auth };
