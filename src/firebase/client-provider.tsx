
'use client';

// This component is now a pass-through as Firebase services are not used for auth.
// It's kept for potential future use or if other Firebase services are needed.
import React, { type ReactNode } from 'react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return <>{children}</>;
}
