'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

// This object will hold the initialized services.
let firebaseServices: {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
} | null = null;


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // If services are already initialized, return them.
  if (firebaseServices) {
    return firebaseServices;
  }
  
  // Guard against missing API key during server-side rendering or build.
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase API key is missing. Firebase will not be initialized.");
    // Return a mock structure to prevent crashes when destructuring.
    // This is a temporary state until the client-side re-renders with env vars.
    return {
        firebaseApp: null,
        auth: null,
        firestore: null
    };
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

  firebaseServices = {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };
  
  return firebaseServices;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
