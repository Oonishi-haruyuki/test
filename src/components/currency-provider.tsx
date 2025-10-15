
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Coins } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';

interface CurrencyContextType {
  currency: number;
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  setCurrency: React.Dispatch<React.SetStateAction<number>>;
}

export const CurrencyContext = createContext<CurrencyContextType | null>(null);

const INITIAL_CURRENCY = 500;
const LOGIN_BONUS = 200;

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useProfile();
  const [currency, setCurrency] = useState<number>(INITIAL_CURRENCY);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const getCurrencyKey = useCallback(() => `${activeProfile}-card-crafter-currency`, [activeProfile]);
  const getLastLoginKey = useCallback(() => `${activeProfile}-card-crafter-last-login`, [activeProfile]);

  useEffect(() => {
    if (!activeProfile) return;

    try {
      const savedCurrency = localStorage.getItem(getCurrencyKey());
      const initialValue = savedCurrency !== null ? JSON.parse(savedCurrency) : INITIAL_CURRENCY;
      setCurrency(initialValue);

      // --- Login Bonus Logic ---
      const lastLoginDate = localStorage.getItem(getLastLoginKey());
      const today = new Date().toDateString();

      if (lastLoginDate !== today) {
        const newCurrency = initialValue + LOGIN_BONUS;
        setCurrency(newCurrency);
        localStorage.setItem(getCurrencyKey(), JSON.stringify(newCurrency));
        localStorage.setItem(getLastLoginKey(), today);
        if (isInitialized) { // Avoid toast on initial load for the very first time
            toast({
                title: 'ログインボーナス！',
                description: (
                    <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <span>{LOGIN_BONUS}G を獲得しました！</span>
                    </div>
                )
            });
        }
      }
      // --- End Login Bonus Logic ---

    } catch (error) {
      console.error("Failed to process currency/login bonus from localStorage", error);
    }
    if (!isInitialized) setIsInitialized(true);
  }, [activeProfile, toast, getCurrencyKey, getLastLoginKey, isInitialized]);

  useEffect(() => {
    if (isInitialized && activeProfile) {
        try {
            const currentStoredCurrency = localStorage.getItem(getCurrencyKey());
            if (currentStoredCurrency !== JSON.stringify(currency)) {
                 localStorage.setItem(getCurrencyKey(), JSON.stringify(currency));
            }
        } catch (error) {
            console.error("Failed to save currency to localStorage", error);
        }
    }
  }, [currency, isInitialized, activeProfile, getCurrencyKey]);

  const addCurrency = useCallback((amount: number) => {
    if (amount > 0) {
      setCurrency(prev => prev + amount);
    }
  }, []);

  const spendCurrency = useCallback((amount: number) => {
    if (amount > 0 && currency >= amount) {
      setCurrency(prev => prev - amount);
      return true;
    }
    return false;
  }, [currency]);


  const value = {
    currency,
    addCurrency,
    spendCurrency,
    setCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}
