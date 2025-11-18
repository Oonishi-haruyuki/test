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

const INITIAL_CURRENCY = 500;
const LOGIN_BONUS = 200;

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<number>(INITIAL_CURRENCY);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const getCurrencyKey = useCallback(() => 'local-currency', []);
  const getLastLoginKey = useCallback(() => 'local-last-login', []);

  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem(getCurrencyKey());
      const initialValue = savedCurrency !== null ? JSON.parse(savedCurrency) : INITIAL_CURRENCY;
      setCurrency(initialValue);

      const lastLoginDate = localStorage.getItem(getLastLoginKey());
      const today = new Date().toDateString();

      if (lastLoginDate !== today) {
        const newCurrency = initialValue + LOGIN_BONUS;
        setCurrency(newCurrency);
        localStorage.setItem(getCurrencyKey(), JSON.stringify(newCurrency));
        localStorage.setItem(getLastLoginKey(), today);
        if (isInitialized) {
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
    } catch (error) {
      console.error("Failed to process currency/login bonus from localStorage", error);
    }
    if (!isInitialized) setIsInitialized(true);
  }, [toast, getCurrencyKey, getLastLoginKey, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
        try {
            const currentStoredCurrency = localStorage.getItem(getCurrencyKey());
            if (currentStoredCurrency !== JSON.stringify(currency)) {
                 localStorage.setItem(getCurrencyKey(), JSON.stringify(currency));
            }
        } catch (error) {
            console.error("Failed to save currency to localStorage", error);
        }
    }
  }, [currency, isInitialized, getCurrencyKey]);

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
