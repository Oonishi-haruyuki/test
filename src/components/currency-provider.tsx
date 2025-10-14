
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Coins } from 'lucide-react';

interface CurrencyContextType {
  currency: number;
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  setCurrency: React.Dispatch<React.SetStateAction<number>>;
}

export const CurrencyContext = createContext<CurrencyContextType | null>(null);

const CURRENCY_STORAGE_KEY = 'card-crafter-currency';
const LAST_LOGIN_DATE_KEY = 'card-crafter-last-login';
const INITIAL_CURRENCY = 500;
const LOGIN_BONUS = 200;

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<number>(INITIAL_CURRENCY);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (savedCurrency !== null) {
        setCurrency(JSON.parse(savedCurrency));
      } else {
        localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(INITIAL_CURRENCY));
      }

      // --- Login Bonus Logic ---
      const lastLoginDate = localStorage.getItem(LAST_LOGIN_DATE_KEY);
      const today = new Date().toDateString(); // "Mon Jul 29 2024"

      if (lastLoginDate !== today) {
        setCurrency(prev => {
            const newCurrency = prev + LOGIN_BONUS;
            localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(newCurrency));
            localStorage.setItem(LAST_LOGIN_DATE_KEY, today);
            toast({
                title: 'ログインボーナス！',
                description: (
                    <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <span>{LOGIN_BONUS}G を獲得しました！</span>
                    </div>
                )
            });
            return newCurrency;
        });
      }
      // --- End Login Bonus Logic ---

    } catch (error) {
      console.error("Failed to process currency/login bonus from localStorage", error);
    }
    setIsInitialized(true);
  }, [toast]);

  useEffect(() => {
    if (isInitialized) {
        try {
            // Avoid overwriting the login bonus update if it happened in the same render cycle
            const currentStoredCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
            if (currentStoredCurrency !== JSON.stringify(currency)) {
                 localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currency));
            }
        } catch (error) {
            console.error("Failed to save currency to localStorage", error);
        }
    }
  }, [currency, isInitialized]);

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
