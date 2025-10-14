
'use client';

import { useContext } from 'react';
import { CurrencyContext } from '@/components/currency-provider';

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
