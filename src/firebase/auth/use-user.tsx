
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
          // User is logged out, clear profile and finish loading.
          setProfile(null);
          setIsUserLoading(false);
        }
        // If user is logged in, the other useEffect will handle the rest.
        // isUserLoading will be set to false inside the profile listener.
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
      // If user is null (either initially or after logout), we don't fetch a profile.
      // The auth listener handles setting loading to false in this case.
      return;
    }
    
    // User is logged in, but we haven't fetched the profile yet.
    // isUserLoading should remain true until the profile is fetched.
    if (!firestore) {
        // If firestore is not available, we can't fetch a profile.
        setIsUserLoading(false);
        return;
    }

    const profileRef = doc(firestore, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // User document doesn't exist. This might be a new user (e.g. Google sign-in).
          setProfile(null);
        }
        // We have a definitive answer about the profile, so loading is complete.
        setIsUserLoading(false);
      },
      (error) => {
        console.error("User profile snapshot error:", error);
        setUserError(error);
        setProfile(null);
        setIsUserLoading(false); // Loading is complete even if there's an error.
      }
    );
    
    return () => unsubscribeProfile();
  }, [user, firestore]);

  return { user, profile, isUserLoading, userError };
}
