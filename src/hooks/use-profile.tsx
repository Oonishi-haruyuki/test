
'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

export type ProfileId = 'test-user' | 'player-1' | 'player-2';

export const PROFILES: Record<ProfileId, { name: string }> = {
    'test-user': { name: 'テストユーザー' },
    'player-1': { name: 'プレイヤー1' },
    'player-2': { name: 'プレイヤー2' },
};

interface ProfileContextType {
  activeProfile: ProfileId;
  setActiveProfile: (profileId: ProfileId) => void;
  PROFILES: Record<ProfileId, { name: string }>;
}

export const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<ProfileId>('test-user');

  const contextValue = useMemo(() => ({
    activeProfile,
    setActiveProfile,
    PROFILES,
  }), [activeProfile]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
