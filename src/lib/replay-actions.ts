
'use server';

import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export interface GameHistoryEntry {
  log: string;
  player1Health: number;
  player2Health: number;
  player1Mana: number;
  player2Mana: number;
  player1MaxMana: number;
  player2MaxMana: number;
  player1Hand: any[]; // Simplified for storage
  player2Hand: any[]; // Simplified for storage
  player1Board: any[];
  player2Board: any[];
}

interface SaveReplayPayload {
    player1Id: string;
    player2Id: string;
    player1LoginId: string;
    player2LoginId: string;
    winnerId: string;
    history: GameHistoryEntry[];
}

export async function saveReplay(payload: SaveReplayPayload): Promise<{ success: boolean; message: string; }> {
    const { firestore } = initializeFirebase();
    
    try {
        const newReplayRef = doc(collection(firestore, 'replays'));
        
        await setDoc(newReplayRef, {
            ...payload,
            createdAt: serverTimestamp(),
        });
        
        return { success: true, message: 'リプレイを保存しました。' };
    } catch (error: any) {
        console.error('Error saving replay:', error);
        return { success: false, message: error.message || 'リプレイの保存に失敗しました。' };
    }
}

    