
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';

interface StatsContextType {
  wins: number;
  losses: number;
  addWin: () => void;
  addLoss: () => void;
}

export const StatsContext = createContext<StatsContextType | null>(null);

const WINS_STORAGE_KEY = 'card-crafter-wins';
const LOSSES_STORAGE_KEY = 'card-crafter-losses';

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedWins = localStorage.getItem(WINS_STORAGE_KEY);
      const savedLosses = localStorage.getItem(LOSSES_STORAGE_KEY);

      if (savedWins !== null) {
        setWins(JSON.parse(savedWins));
      } else {
        localStorage.setItem(WINS_STORAGE_KEY, JSON.stringify(0));
      }

      if (savedLosses !== null) {
        setLosses(JSON.parse(savedLosses));
      } else {
        localStorage.setItem(LOSSES_STORAGE_KEY, JSON.stringify(0));
      }
    } catch (error) {
      console.error("Failed to load stats from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
        try {
            localStorage.setItem(WINS_STORAGE_KEY, JSON.stringify(wins));
        } catch (error) {
            console.error("Failed to save wins to localStorage", error);
        }
    }
  }, [wins, isInitialized]);
  
  useEffect(() => {
    if (isInitialized) {
        try {
            localStorage.setItem(LOSSES_STORAGE_KEY, JSON.stringify(losses));
        } catch (error) {
            console.error("Failed to save losses to localStorage", error);
        }
    }
  }, [losses, isInitialized]);

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

    