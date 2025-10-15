
'use client';
    
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import { doc, onSnapshot, DocumentData, Firestore } from 'firebase/firestore';

interface UserProfile {
  name: string;
  // Add other profile fields here
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
    // Wait until auth is initialized
    if (!auth) {
        return;
    }
    // Listener for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        if (!firebaseUser) {
          // If user logs out, clear profile and finish loading
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
      // No user, no profile to fetch. Set loading to false if not already.
       if (isUserLoading) {
           setIsUserLoading(false);
       }
      return;
    }

    // We have a user, but we're not loading their profile yet.
    // Set loading to true unless it's already true from the auth listener.
    if (!isUserLoading) {
      setIsUserLoading(true);
    }
    
    // Listener for user profile changes in Firestore
    const profileRef = doc(firestore, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // User document doesn't exist. This might be a new user.
          setProfile(null);
        }
        setIsUserLoading(false); // Finished loading profile
      },
      (error) => {
        console.error("User profile snapshot error:", error);
        setUserError(error);
        setProfile(null);
        setIsUserLoading(false);
      }
    );
    
    return () => unsubscribeProfile();
  }, [user, firestore, isUserLoading]);

  return { user, profile, isUserLoading, userError };
}
