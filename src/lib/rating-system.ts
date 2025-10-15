
'use server';

import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const K_FACTOR = 32;

// AIのレーティング（初級、上級）
const AI_RATINGS = {
    beginner: 1400,
    advanced: 1600,
};

type Difficulty = 'beginner' | 'advanced';
type GameResult = 'win' | 'loss';

/**
 * 期待勝率を計算する
 * @param playerRating プレイヤーのレーティング
 * @param opponentRating 対戦相手のレーティング
 * @returns プレイヤーの期待勝率 (0-1)
 */
function calculateExpectedWinRate(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * 新しいレーティングを計算する
 * @param playerRating プレイヤーの現在のレーティング
 * @param opponentRating 対戦相手のレーティング
 * @param result ゲーム結果 ('win' or 'loss')
 * @returns 新しいレーティング
 */
function calculateNewRating(playerRating: number, opponentRating: number, result: GameResult): { newRating: number, change: number } {
    const score = result === 'win' ? 1 : 0;
    const expectedWinRate = calculateExpectedWinRate(playerRating, opponentRating);
    const ratingChange = Math.round(K_FACTOR * (score - expectedWinRate));
    const newRating = playerRating + ratingChange;
    return { newRating, change: ratingChange };
}

/**
 * ユーザーのレーティングを更新する
 * @param userId ユーザーID
 * @param difficulty AIの難易度
 * @param result ゲーム結果
 * @returns 更新後のレーティング情報
 */
export async function updateUserRating(userId: string, difficulty: Difficulty, result: GameResult): Promise<{ oldRating: number, newRating: number, change: number }> {
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);

    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        const oldRating = userData.rating || 1500; // デフォルトレーティング
        const opponentRating = AI_RATINGS[difficulty];

        const { newRating, change } = calculateNewRating(oldRating, opponentRating, result);
        
        await updateDoc(userRef, {
            rating: newRating,
            lastMatchDate: new Date().toISOString(),
        });

        return { oldRating, newRating, change };
    } catch (error) {
        console.error("Error updating user rating: ", error);
        throw error;
    }
}
