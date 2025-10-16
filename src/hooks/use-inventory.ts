
'use client';

import { useContext } from 'react';
import { InventoryContext } from '@/components/inventory-provider';

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};
