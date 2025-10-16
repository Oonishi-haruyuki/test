
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase';

interface StatsContextType {
  wins: number;
  losses: number;
  addWin: () => void;
  addLoss: () => void;
}

export const StatsContext = createContext<StatsContextType | null>(null);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const getWinsKey = useCallback(() => user ? `user-${user.uid}-wins` : 'guest-wins', [user]);
  const getLossesKey = useCallback(() => user ? `user-${user.uid}-losses` : 'guest-losses', [user]);


  useEffect(() => {
    if (!user) {
        if (isInitialized) {
            setWins(0);
            setLosses(0);
        }
        return;
    };

    try {
      const savedWins = localStorage.getItem(getWinsKey());
      const savedLosses = localStorage.getItem(getLossesKey());

      setWins(savedWins !== null ? JSON.parse(savedWins) : 0);
      setLosses(savedLosses !== null ? JSON.parse(savedLosses) : 0);

    } catch (error) {
      console.error("Failed to load stats from localStorage", error);
    }
    if (!isInitialized) setIsInitialized(true);
  }, [user, getWinsKey, getLossesKey, isInitialized]);

  useEffect(() => {
    if (isInitialized && user) {
        try {
            localStorage.setItem(getWinsKey(), JSON.stringify(wins));
        } catch (error) {
            console.error("Failed to save wins to localStorage", error);
        }
    }
  }, [wins, isInitialized, user, getWinsKey]);
  
  useEffect(() => {
    if (isInitialized && user) {
        try {
            localStorage.setItem(getLossesKey(), JSON.stringify(losses));
        } catch (error) {
            console.error("Failed to save losses to localStorage", error);
        }
    }
  }, [losses, isInitialized, user, getLossesKey]);

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
