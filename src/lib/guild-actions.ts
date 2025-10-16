
'use server';

import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    updateDoc, 
    serverTimestamp,
    runTransaction,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const MAX_GUILD_MEMBERS = 50;

export async function createGuild(
    userId: string, 
    userLoginId: string, 
    guildName: string, 
    description: string
): Promise<{ success: boolean; message: string; guildId?: string }> {
    const { firestore } = initializeFirebase();
    
    try {
        let success = false;
        let message = '';
        let guildId: string | undefined = undefined;

        await runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, 'users', userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists() || userDoc.data().guildId) {
                throw new Error('既にギルドに所属しているか、ユーザー情報が見つかりません。');
            }

            const newGuildRef = doc(collection(firestore, 'guilds'));
            guildId = newGuildRef.id;

            transaction.set(newGuildRef, {
                name: guildName,
                description: description,
                leaderId: userId,
                memberIds: [userId],
                createdAt: serverTimestamp(),
            });

            transaction.update(userRef, { guildId: guildId });
        });

        return { success: true, message: 'ギルドを作成しました。', guildId };

    } catch (error: any) {
        console.error('Error creating guild:', error);
        return { success: false, message: error.message || 'ギルドの作成に失敗しました。' };
    }
}

export async function joinGuild(guildId: string, userId: string): Promise<{ success: boolean; message: string; }> {
    const { firestore } = initializeFirebase();
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, 'users', userId);
            const guildRef = doc(firestore, 'guilds', guildId);

            const userDoc = await transaction.get(userRef);
            const guildDoc = await transaction.get(guildRef);

            if (!userDoc.exists() || userDoc.data().guildId) {
                throw new Error('既に他のギルドに所属しています。');
            }
            if (!guildDoc.exists()) {
                throw new Error('ギルドが見つかりません。');
            }
            if (guildDoc.data().memberIds.length >= MAX_GUILD_MEMBERS) {
                throw new Error('このギルドは満員です。');
            }

            transaction.update(guildRef, { memberIds: arrayUnion(userId) });
            transaction.update(userRef, { guildId: guildId });
        });
        return { success: true, message: 'ギルドに参加しました。' };
    } catch (error: any) {
        console.error('Error joining guild:', error);
        return { success: false, message: error.message || 'ギルドへの参加に失敗しました。' };
    }
}


export async function leaveGuild(guildId: string, userId: string): Promise<{ success: boolean; message: string; }> {
    const { firestore } = initializeFirebase();

    try {
        await runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, 'users', userId);
            const guildRef = doc(firestore, 'guilds', guildId);

            const guildDoc = await transaction.get(guildRef);
            if (!guildDoc.exists()) {
                // Guild might have been deleted already, just clean up user profile
                transaction.update(userRef, { guildId: null });
                return;
            }
            
            const guildData = guildDoc.data();

            // If the leader leaves, disband the guild
            if (guildData.leaderId === userId) {
                // Remove guildId from all members
                for (const memberId of guildData.memberIds) {
                    const memberRef = doc(firestore, 'users', memberId);
                    transaction.update(memberRef, { guildId: null });
                }
                // Delete the guild document itself
                transaction.delete(guildRef);
            } else {
                // A regular member leaves
                transaction.update(guildRef, { memberIds: arrayRemove(userId) });
                transaction.update(userRef, { guildId: null });
            }
        });

        return { success: true, message: 'ギルドから脱退しました。' };
    } catch (error: any) {
        console.error('Error leaving guild:', error);
        return { success: false, message: error.message || 'ギルドからの脱退に失敗しました。' };
    }
}

export async function sendChatMessage(guildId: string, userLoginId: string, text: string): Promise<{ success: boolean, message: string }> {
    const { auth, firestore } = initializeFirebase();
    const user = auth.currentUser;
    if (!user) {
        return { success: false, message: 'ログインが必要です。'};
    }

    try {
        const messageRef = doc(collection(firestore, 'guilds', guildId, 'messages'));
        await setDoc(messageRef, {
            guildId,
            userId: user.uid,
            userLoginId,
            text,
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'メッセージを送信しました。'};
    } catch (error: any) {
        console.error('Error sending chat message:', error);
        return { success: false, message: 'メッセージの送信に失敗しました。'};
    }
}
