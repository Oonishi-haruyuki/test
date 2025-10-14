
'use client';

import { useCurrency } from '@/hooks/use-currency';
import { Coins } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useState, useEffect } from 'react';

export function CurrencyDisplay() {
  const { currency } = useCurrency();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  if (!isClient) {
    return <Skeleton className="h-10 w-24" />;
  }

  return (
    <div className="flex items-center gap-2 font-semibold text-lg border-2 border-yellow-500 bg-yellow-400/20 text-yellow-600 rounded-full px-4 py-1.5">
      <Coins className="h-6 w-6 text-yellow-500" />
      <span>{currency.toLocaleString()} G</span>
    </div>
  );
}
