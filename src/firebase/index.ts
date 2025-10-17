
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): { firebaseApp: FirebaseApp, auth: Auth, firestore: Firestore } {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { firebaseApp: app, auth, firestore };
}

const { auth, firestore } = initializeFirebase();

// --- Authentication Functions ---

export const loginWithId = async (loginId: string, password: string): Promise<void> => {
    // Firebase Auth uses email for login, so we create a dummy email.
    const email = `${loginId.trim()}@cardcrafter.app`;
    await signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithId = async (loginId: string, password: string): Promise<void> => {
    const email = `${loginId.trim()}@cardcrafter.app`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (user) {
        // After sign-up, create a corresponding user profile in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, { 
            loginId: loginId.trim(),
            rating: 1000,
            lastMatchDate: new Date(0).toISOString(),
            inventory: {},
        });
    }
};

export const loginWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        // If the user profile doesn't exist (first-time Google login), create it
        if (!userDoc.exists()) {
            await setDoc(userDocRef, { 
                loginId: user.displayName || user.email || `user_${user.uid.substring(0,5)}`,
                rating: 1000,
                lastMatchDate: new Date(0).toISOString(),
                inventory: {},
             });
        }
    } catch (error: any) {
        if (error.code === 'auth/popup-blocked') {
            alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
        }
        console.error("Google sign-in error", error);
        throw error;
    }
};


export * from './provider';
export * from './client-provider';
