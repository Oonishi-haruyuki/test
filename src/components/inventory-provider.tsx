
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useUser, initializeFirebase } from '@/firebase';
import { doc, updateDoc, onSnapshot, DocumentData } from 'firebase/firestore';

interface Inventory {
    [itemId: string]: number;
}

interface InventoryContextType {
    inventory: Inventory;
    addItem: (itemId: string, amount: number) => void;
    removeItem: (itemId: string, amount: number) => boolean;
}

export const InventoryContext = createContext<InventoryContextType | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const [inventory, setInventory] = useState<Inventory>({});
    const { firestore } = initializeFirebase();

    useEffect(() => {
        if (user) {
            const userRef = doc(firestore, 'users', user.uid);
            const unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setInventory(data.inventory || {});
                }
            });
            return () => unsubscribe();
        } else {
            setInventory({});
        }
    }, [user, firestore]);

    const updateInventoryOnServer = async (newInventory: Inventory) => {
        if (!user) return;
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { inventory: newInventory });
    };
    
    const addItem = useCallback((itemId: string, amount: number) => {
        const newInventory = { ...inventory };
        newInventory[itemId] = (newInventory[itemId] || 0) + amount;
        setInventory(newInventory);
        updateInventoryOnServer(newInventory);
    }, [inventory, user]);

    const removeItem = useCallback((itemId: string, amount: number) => {
        const currentAmount = inventory[itemId] || 0;
        if (currentAmount < amount) {
            return false; // Not enough items
        }
        const newInventory = { ...inventory };
        newInventory[itemId] = currentAmount - amount;
        if (newInventory[itemId] === 0) {
            delete newInventory[itemId];
        }
        setInventory(newInventory);
        updateInventoryOnServer(newInventory);
        return true;
    }, [inventory, user]);

    return (
        <InventoryContext.Provider value={{ inventory, addItem, removeItem }}>
            {children}
        </InventoryContext.Provider>
    );
}
