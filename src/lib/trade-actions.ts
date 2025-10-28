
'use server';

import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    limit, 
    getDocs, 
    doc, 
    setDoc, 
    updateDoc, 
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { CardData } from '@/components/card-editor';

// Get a user's ID from their loginId
async function getUserIdByLoginId(loginId: string): Promise<string | null> {
    const { firestore } = initializeFirebase();
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('loginId', '==', loginId), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return querySnapshot.docs[0].id;
}

export async function searchUserCollection(loginId: string): Promise<{ success: boolean; message: string; collection?: CardData[] }> {
    const userId = await getUserIdByLoginId(loginId);
    if (!userId) {
        return { success: false, message: '指定されたプレイヤーが見つかりません。' };
    }
    
    // In a real app, this would query a user's collection in Firestore.
    // For this demo, we'll simulate by creating some mock data.
    // This part is a placeholder.
    const mockCollection: CardData[] = [
        { id: 'mock-1', theme: 'fantasy', name: '相手のゴブリン', manaCost: 1, attack: 1, defense: 1, cardType: 'creature', rarity: 'common', abilities: '', flavorText: '', imageUrl: 'https://picsum.photos/seed/mock1/400/300', imageHint: 'goblin' },
        { id: 'mock-2', theme: 'fantasy', name: '相手のドラゴン', manaCost: 8, attack: 8, defense: 8, cardType: 'creature', rarity: 'mythic', abilities: '飛行', flavorText: '', imageUrl: 'https://picsum.photos/seed/mock2/400/300', imageHint: 'dragon' },
        { id: 'mock-3', theme: 'fantasy', name: '相手の呪文', manaCost: 3, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'カードを2枚引く', flavorText: '', imageUrl: 'https://picsum.photos/seed/mock3/400/300', imageHint: 'magic spell' }
    ];

    return { success: true, message: 'Collection found.', collection: mockCollection };
}


export async function createTradeOffer(
    offerorId: string, 
    offerorLoginId: string, 
    offereeLoginId: string, 
    offeredCards: CardData[], 
    requestedCards: CardData[]
): Promise<{ success: boolean; message: string; }> {
    if (offerorLoginId === offereeLoginId) {
        return { success: false, message: '自分自身とトレードすることはできません。' };
    }

    const { firestore } = initializeFirebase();
    const offereeId = await getUserIdByLoginId(offereeLoginId);

    if (!offereeId) {
        return { success: false, message: '指定されたプレイヤーが見つかりません。' };
    }

    const tradeId = doc(collection(firestore, 'trades')).id;

    await setDoc(doc(firestore, 'trades', tradeId), {
        offerorId,
        offerorLoginId,
        offereeId,
        offereeLoginId,
        offeredCards,
        requestedCards,
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    return { success: true, message: 'トレードオファーを送信しました。' };
}


export async function respondToTradeOffer(
    tradeId: string, 
    userId: string, 
    response: 'accepted' | 'rejected' | 'cancelled',
    offeredCards: CardData[], // Pass cards for accepted trades
    requestedCards: CardData[] // Pass cards for accepted trades
): Promise<{ success: boolean; message: string }> {
    const { firestore } = initializeFirebase();
    const tradeRef = doc(firestore, 'trades', tradeId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const tradeDoc = await transaction.get(tradeRef);
            if (!tradeDoc.exists()) {
                throw new Error('Trade offer not found.');
            }

            const trade = tradeDoc.data();

            if (trade.status !== 'pending') {
                throw new Error('このオファーは既に対応済みです。');
            }
            
            // --- Authorization checks ---
            if (response === 'cancelled') {
                if (userId !== trade.offerorId) throw new Error('オファーの送信者のみがキャンセルできます。');
            } else if (response === 'accepted' || response === 'rejected') {
                if (userId !== trade.offereeId) throw new Error('オファーの受信者のみが承諾または拒否できます。');
            } else {
                 throw new Error('無効な操作です。');
            }
            
            if (response === 'accepted') {
                // In a real application with collections in Firestore, you would:
                // 1. Get the offeror's collection doc
                // 2. Get the offeree's collection doc
                // 3. Remove `offeredCards` from offeror and add `requestedCards`
                // 4. Remove `requestedCards` from offeree and add `offeredCards`
                // 5. Update both documents in the transaction
                // Since collections are in localStorage, we only update the status.
                // The client will be responsible for updating localStorage based on this success.
                 transaction.update(tradeRef, { status: 'accepted' });
            } else {
                 transaction.update(tradeRef, { status: response });
            }
        });

        if (response === 'accepted') {
            return { success: true, message: `トレードを承諾しました。` };
        } else if (response === 'rejected') {
            return { success: true, message: 'トレードを拒否しました。' };
        } else {
             return { success: true, message: 'トレードをキャンセルしました。' };
        }

    } catch (error: any) {
        console.error('Trade response failed:', error);
        return { success: false, message: error.message || 'トレードの処理に失敗しました。' };
    }
}
