
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/hooks/use-profile';

interface StatsContextType {
  wins: number;
  losses: number;
  addWin: () => void;
  addLoss: () => void;
}

export const StatsContext = createContext<StatsContextType | null>(null);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useProfile();
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const getWinsKey = useCallback(() => `${activeProfile}-card-crafter-wins`, [activeProfile]);
  const getLossesKey = useCallback(() => `${activeProfile}-card-crafter-losses`, [activeProfile]);


  useEffect(() => {
    if (!activeProfile) return;
    try {
      const savedWins = localStorage.getItem(getWinsKey());
      const savedLosses = localStorage.getItem(getLossesKey());

      setWins(savedWins !== null ? JSON.parse(savedWins) : 0);
      setLosses(savedLosses !== null ? JSON.parse(savedLosses) : 0);

    } catch (error) {
      console.error("Failed to load stats from localStorage", error);
    }
    if (!isInitialized) setIsInitialized(true);
  }, [activeProfile, getWinsKey, getLossesKey, isInitialized]);

  useEffect(() => {
    if (isInitialized && activeProfile) {
        try {
            localStorage.setItem(getWinsKey(), JSON.stringify(wins));
        } catch (error) {
            console.error("Failed to save wins to localStorage", error);
        }
    }
  }, [wins, isInitialized, activeProfile, getWinsKey]);
  
  useEffect(() => {
    if (isInitialized && activeProfile) {
        try {
            localStorage.setItem(getLossesKey(), JSON.stringify(losses));
        } catch (error) {
            console.error("Failed to save losses to localStorage", error);
        }
    }
  }, [losses, isInitialized, activeProfile, getLossesKey]);

  const addWin = useCallback(() => {
      setWins(prev => prev + 1);
  }, []);

  const addLoss = useCallback(() => {
    setLosses(prev => prev + 1);
}, []);


  const value = {
    wins,
    losses,
    addWin,
    addLoss,
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
}
