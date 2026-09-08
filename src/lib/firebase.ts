
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import appletConfig from '../../firebase-applet-config.json';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || appletConfig.appId,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId;
const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
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
