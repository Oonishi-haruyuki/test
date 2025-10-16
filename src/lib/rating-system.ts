
'use server';

import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// AIのレーティング（初級、上級、超級）
const AI_RATINGS = {
    beginner: 1400,
    advanced: 1600,
    super: 1800,
};

type Difficulty = 'beginner' | 'advanced' | 'super';
type GameResult = 'win' | 'loss';

/**
 * プレイヤーのレーティングに基づいてKファクターを決定する
 * @param rating プレイヤーのレーティング
 * @returns Kファクター
 */
function getKFactor(rating: number): number {
    if (rating <= 3000) {
        return 40; // 初心者ゾーンでは変動が大きいが、負けた時の調整で緩和する
    }
    if (rating <= 10000) {
        return 24; // 中級者ゾーン
    }
    return 16; // 上級者ゾーンでは変動が緩やかになる
}


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
 * @returns 新しいレーティングと変動値
 */
function calculateNewRating(playerRating: number, opponentRating: number, result: GameResult): { newRating: number, change: number } {
    const score = result === 'win' ? 1 : 0;
    const kFactor = getKFactor(playerRating);
    const expectedWinRate = calculateExpectedWinRate(playerRating, opponentRating);
    let ratingChange = kFactor * (score - expectedWinRate);

    // カスタムロジックの適用
    if (playerRating <= 3000 && ratingChange < 0) {
        // 1000-3000帯: マイナスになりにくい
        ratingChange = Math.max(ratingChange, -5); // 負けても最大-5まで
    } else if (playerRating > 3000 && playerRating <= 10000) {
        // 3001-10000帯: 上昇傾向
        if (ratingChange < 0) {
            ratingChange *= 0.8; // 負けの下降幅を少し抑える
        } else {
            ratingChange *= 1.2; // 勝ちの上昇幅を少し上げる
        }
    } else if (playerRating > 10000) {
        // 10001-50000帯
        const magnitude = Math.abs(ratingChange) * 15; // 変動幅を大きくする
        const clampedMagnitude = Math.max(10, Math.min(magnitude, 500));
        ratingChange = ratingChange > 0 ? clampedMagnitude : -clampedMagnitude;
    }

    const roundedChange = Math.round(ratingChange);
    let newRating = playerRating + roundedChange;

    // レーティングが1000未満にならないようにし、上限を50000に設定
    newRating = Math.max(1000, Math.min(newRating, 50000));
    
    // 最終的な変動値を再計算
    const finalChange = newRating - playerRating;

    return { newRating, change: finalChange };
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
        const oldRating = userData.rating || 1000; // デフォルトレーティング
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
    
