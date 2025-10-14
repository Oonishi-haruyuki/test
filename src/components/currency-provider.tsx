
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';

interface CurrencyContextType {
  currency: number;
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
}

export const CurrencyContext = createContext<CurrencyContextType | null>(null);

const CURRENCY_STORAGE_KEY = 'card-crafter-currency';
const INITIAL_CURRENCY = 100000;

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<number>(INITIAL_CURRENCY);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (savedCurrency !== null) {
        setCurrency(JSON.parse(savedCurrency));
      } else {
        // First time visit, set initial currency
        localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(INITIAL_CURRENCY));
      }
    } catch (error) {
      console.error("Failed to load currency from localStorage", error);
      // If error, proceed with initial value
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
        try {
            localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(currency));
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
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}
