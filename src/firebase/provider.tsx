
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, DocumentData, getDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '.';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

type UserProfile = {
  loginId?: string;
  rating?: number;
  lastMatchDate?: string;
  title?: string;
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
  
  const { auth, firestore } = initializeFirebase();

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
    let unsubscribe = () => {};
    if (user) {
      const profileRef = doc(firestore, 'users', user.uid);
      unsubscribe = onSnapshot(profileRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            // If profile doesn't exist (e.g. first login), create it
            const newProfileData = {
              loginId: user.email || user.displayName || `user_${user.uid.substring(0, 5)}`,
              rating: 1000, // Initial rating
              lastMatchDate: new Date(0).toISOString(), // Epoch time
              title: '',
            };
            setDoc(profileRef, newProfileData).catch(e => console.error("Error creating user profile:", e));
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
    } else {
      setIsUserLoading(false);
      setProfile(null);
    }

    return () => unsubscribe();
  }, [user, firestore]);

  const value = useMemo(() => ({ user, profile, isUserLoading, userError }), [user, profile, isUserLoading, userError]);

  return (
    <FirebaseContext.Provider value={value}>
      <FirebaseErrorListener />
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
export const useMemoFirebase = <T,>(factory: () => T) => useMemo(factory, []);
