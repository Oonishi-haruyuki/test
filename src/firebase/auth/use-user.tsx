
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import { doc, onSnapshot, DocumentData, Firestore } from 'firebase/firestore';

interface UserProfile {
  loginId?: string;
}

export interface UserAuthHookResult {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * Custom hook to get the current user and their profile from Firestore.
 * @param {Auth} auth - The Firebase Auth instance.
 * @param {Firestore} firestore - The Firebase Firestore instance.
 * @returns {UserAuthHookResult} - The user, profile, loading state, and error.
 */
export function useUser(auth: Auth, firestore: Firestore): UserAuthHookResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
        setIsUserLoading(false);
        return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth,
      (firebaseUser) => {
        setIsUserLoading(true); // Start loading whenever auth state changes
        setUser(firebaseUser);
        if (!firebaseUser) {
          setProfile(null);
          setIsUserLoading(false);
        }
      },
      (error) => {
        console.error("Auth state change error:", error);
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!user) {
      // If user becomes null (logout), loading is already handled by auth listener
      return;
    }
    
    if (!firestore) {
        setIsUserLoading(false);
        return;
    }

    const profileRef = doc(firestore, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // This case can happen for a brief moment after a new (e.g. Google) user signs up.
          // We'll create the document if it's missing.
          if (user) {
             setDoc(profileRef, {}).catch(e => console.error("Error creating user doc:", e));
          }
          setProfile(null);
        }
        setIsUserLoading(false); // Profile is loaded (or confirmed non-existent), so loading is done.
      },
      (error) => {
        console.error("User profile snapshot error:", error);
        setUserError(error);
        setProfile(null);
        setIsUserLoading(false);
      }
    );
    
    return () => unsubscribeProfile();
  }, [user, firestore]);

  return { user, profile, isUserLoading, userError };
}

    