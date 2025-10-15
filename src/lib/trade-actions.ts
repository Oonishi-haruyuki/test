
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


export async function respondToTradeOffer(tradeId: string, userId: string, response: 'accepted' | 'rejected' | 'cancelled'): Promise<{ success: boolean; message: string }> {
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

            if (response === 'cancelled') {
                if (userId !== trade.offerorId) throw new Error('オファーの送信者のみがキャンセルできます。');
                transaction.update(tradeRef, { status: 'cancelled' });
                return;
            }

            if (userId !== trade.offereeId) {
                throw new Error('オファーの受信者のみが承諾または拒否できます。');
            }
            
            if (response === 'rejected') {
                transaction.update(tradeRef, { status: 'rejected' });
                return;
            }

            if (response === 'accepted') {
                // This is the complex part: swapping cards between user's collections
                // For this demo, we'll assume collections are stored in a simple way
                // A real implementation would need more robust checks
                
                // IMPORTANT: In this demo, we are NOT actually modifying the card collections
                // stored in localStorage, as server actions cannot directly access it.
                // We'll just update the trade status. A full implementation would require
                // either moving collection state to Firestore or using a client-side
                // function to update localStorage after the transaction succeeds.

                transaction.update(tradeRef, { status: 'accepted' });
            }
        });

        if (response === 'accepted') {
            return { success: true, message: `トレードを承諾しました。クライアント側でカードコレクションを更新する必要があります。` };
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
