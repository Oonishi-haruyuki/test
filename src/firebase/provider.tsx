
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, DocumentData, getDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '.';

type UserProfile = {
  loginId?: string;
} & DocumentData;

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  
  const { firebaseApp } = initializeFirebase();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setIsUserLoading(false);
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      setUserError(error);
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user) {
      const profileRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(profileRef, 
        async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            // If profile doesn't exist (e.g. first Google login), create it
            try {
              const newProfileData = { loginId: user.email }; // Use email as loginId for Google users
              await setDoc(profileRef, newProfileData);
              setProfile(newProfileData);
            } catch (error) {
              console.error("Error creating user profile:", error);
              setUserError(error instanceof Error ? error : new Error(String(error)));
            }
          }
          setIsUserLoading(false);
        },
        (error) => {
          console.error("Profile snapshot error:", error);
          setUserError(error);
          setProfile(null);
          setIsUserLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setProfile(null);
      setIsUserLoading(false);
    }
  }, [user, firestore]);

  const value = { user, profile, isUserLoading, userError };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider');
  }
  return context;
};

// Dummy hooks for compatibility
export const useFirebase = () => {};
export const useAuth = () => {};
export const useFirestore = () => {};
export const useFirebaseApp = () => {};
export const useMemoFirebase = <T>(factory: () => T) => factory();
