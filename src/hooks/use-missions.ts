
'use client';

import { useContext } from 'react';
import { MissionsContext } from '@/components/missions-provider';

export const useMissions = () => {
  const context = useContext(MissionsContext);
  if (!context) {
    throw new Error('useMissions must be used within a MissionsProvider');
  }
  return context;
};
