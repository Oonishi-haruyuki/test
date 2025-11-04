
'use server';

import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
    serverTimestamp,
    runTransaction,
    query,
    where,
    getDocs,
    limit,
    writeBatch
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function createBattleRoom(
    userId: string, 
    userLoginId: string
): Promise<{ success: boolean; message: string; roomId?: string }> {
    const { firestore } = initializeFirebase();
    
    try {
        const newRoomRef = doc(collection(firestore, 'battleRooms'));
        
        const newRoom = {
            player1: { id: userId, loginId: userLoginId, deck: [], health: 20, mana: 1, maxMana: 1 },
            player2: null,
            status: 'waiting',
            createdAt: serverTimestamp(),
            currentTurn: userId,
            board: [],
            log: ['対戦相手を探しています...']
        };

        await setDoc(newRoomRef, newRoom);

        return { success: true, message: '対戦ルームを作成しました。', roomId: newRoomRef.id };

    } catch (error: any) {
        console.error('Error creating battle room:', error);
        return { success: false, message: error.message || '対戦ルームの作成に失敗しました。' };
    }
}

export async function joinBattleRoom(
    roomId: string, 
    userId: string, 
    userLoginId: string
): Promise<{ success: boolean; message: string; }> {
    const { firestore } = initializeFirebase();
    const roomRef = doc(firestore, 'battleRooms', roomId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists()) {
                throw new Error('対戦ルームが見つかりません。');
            }
            const roomData = roomDoc.data();
            if (roomData.player2) {
                throw new Error('このルームは既に対戦相手がいます。');
            }
            if (roomData.player1.id === userId) {
                 throw new Error('自分自身のルームには参加できません。');
            }

            const player2Data = { id: userId, loginId: userLoginId, deck: [], health: 20, mana: 1, maxMana: 1 };
            transaction.update(roomRef, { 
                player2: player2Data,
                status: 'starting'
            });
        });

        return { success: true, message: '対戦ルームに参加しました。' };

    } catch (error: any) {
        console.error('Error joining battle room:', error);
        return { success: false, message: error.message || '対戦ルームへの参加に失敗しました。' };
    }
}
