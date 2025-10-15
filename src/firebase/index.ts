
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
// Removed Auth and Firestore imports as they are no longer directly used in the simplified version

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // This is a placeholder for Firebase initialization.
    // In a real scenario, you'd use Firebase services.
    // For this simplified version, we just create a dummy app object.
    try {
        return { firebaseApp: initializeApp(firebaseConfig) };
    } catch (e) {
        return { firebaseApp: getApp() };
    }
  }
  return { firebaseApp: getApp() };
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Returning null for auth and firestore as they are not used
  return {
    firebaseApp,
    auth: null,
    firestore: null
  };
}

export * from './provider';
export * from './client-provider';

// Explicitly not exporting auth and firestore hooks
// export * from './firestore/use-collection';
// export * from './firestore/use-doc';
// export { useUser } from './auth/use-user';
