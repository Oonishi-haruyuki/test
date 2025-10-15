
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
        setUser(firebaseUser);
        if (!firebaseUser) {
          // User is logged out
          setProfile(null);
          setIsUserLoading(false);
        }
        // If user is logged in, the other useEffect will handle profile loading.
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
      // No user, no profile to fetch. Loading state is managed by the auth listener.
      return;
    }

    // Auth state is known, but profile is not yet loaded.
    // This is part of the overall loading state.
    setIsUserLoading(true);
    
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
          // User document doesn't exist. This might be a new user.
          setProfile(null);
        }
        setIsUserLoading(false); // Finished loading profile, so overall user loading is done.
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
