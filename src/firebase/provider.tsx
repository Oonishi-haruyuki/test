
'use client';

// This component is now a pass-through as Firebase services are not used for auth.
// It's kept for potential future use or if other Firebase services are needed.
import React, { createContext, useContext, ReactNode } from 'react';

// The context now holds minimal value, basically indicating its presence.
export const FirebaseContext = createContext<boolean | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  // Props are kept for structure but are not used in the simplified version
  firebaseApp?: any;
  firestore?: any;
  auth?: any;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  return (
    <FirebaseContext.Provider value={true}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Hooks are simplified to reflect the removed functionality. They don't provide any value.
export const useFirebase = () => {};
export const useAuth = () => {};
export const useFirestore = () => {};
export const useFirebaseApp = () => {};
export const useUser = () => ({ user: null, profile: null, isUserLoading: false, userError: null });
export const useMemoFirebase = <T>(factory: () => T) => factory();
