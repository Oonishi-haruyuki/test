
'use server';

import { getFirestore, collection, query, where, limit, getDocs, doc, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { CardData } from '@/components/card-editor';

const MAX_MANA = 10;
const INITIAL_HEALTH = 20;

const shuffleDeck = (deck: CardData[]) => {
    return [...deck].sort(() => Math.random() - 0.5);
}

export async function findOrCreateGame(userId: string, userLoginId: string, deck: CardData[]): Promise<string> {
    const { firestore } = initializeFirebase();
    const gamesRef = collection(firestore, 'games');

    const q = query(gamesRef, where('status', '==', 'waiting'), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Found a waiting game, join it
        const gameDoc = querySnapshot.docs[0];
        const gameId = gameDoc.id;

        const player1GoesFirst = Math.random() < 0.5;
        const shuffledPlayer1Deck = shuffleDeck(gameDoc.data().player1Deck);
        const shuffledPlayer2Deck = shuffleDeck(deck);

        await updateDoc(doc(firestore, 'games', gameId), {
            player2Id: userId,
            player2LoginId: userLoginId,
            status: 'active',
            activePlayerId: player1GoesFirst ? gameDoc.data().player1Id : userId,
            player1Hand: shuffledPlayer1Deck.splice(0, 5),
            player2Hand: shuffledPlayer2Deck.splice(0, 5),
            player1Deck: shuffledPlayer1Deck,
            player2Deck: shuffledPlayer2Deck,
            lastAction: `${userLoginId} が対戦に参加しました。`,
        });

        return gameId;
    } else {
        // No waiting games, create a new one
        const gameId = doc(collection(firestore, 'games')).id;
        
        await setDoc(doc(firestore, 'games', gameId), {
            status: 'waiting',
            player1Id: userId,
            player1LoginId: userLoginId,
            player1Health: INITIAL_HEALTH,
            player2Health: INITIAL_HEALTH,
            turn: 1,
            player1Deck: deck,
            player1Board: [],
            player2Board: [],
            player1Mana: 1,
            player2Mana: 1,
            player1MaxMana: 1,
            player2MaxMana: 1,
            createdAt: serverTimestamp(),
            lastAction: `${userLoginId} が対戦相手を待っています...`,
        });

        return gameId;
    }
}

export async function playCardAction(gameId: string, card: CardData, playerId: string) {
    const { firestore } = initializeFirebase();
    const gameRef = doc(firestore, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    if (!gameDoc.exists()) throw new Error('Game not found');
    const gameData = gameDoc.data();

    const isPlayer1 = playerId === gameData.player1Id;
    const playerHandField = isPlayer1 ? 'player1Hand' : 'player2Hand';
    const playerBoardField = isPlayer1 ? 'player1Board' : 'player2Board';
    const playerManaField = isPlayer1 ? 'player1Mana' : 'player2Mana';

    const hand = gameData[playerHandField] as CardData[];
    const board = gameData[playerBoardField] as CardData[];
    const mana = gameData[playerManaField] as number;

    const cardIndex = hand.findIndex(c => c.id === card.id);
    if (cardIndex === -1 || mana < card.manaCost) {
        // Invalid action
        return;
    }

    const newHand = [...hand];
    newHand.splice(cardIndex, 1);
    
    const updates: any = {
        [playerHandField]: newHand,
        [playerManaField]: mana - card.manaCost,
        lastAction: `「${card.name}」をプレイした。`,
    };

    if (card.cardType === 'creature') {
        const newBoard = [...board, { ...card, canAttack: false }];
        updates[playerBoardField] = newBoard;
    } else {
        // Handle spell effects server-side if needed
    }

    await updateDoc(gameRef, updates);
}

export async function endTurnAction(gameId: string, playerId: string) {
    const { firestore } = initializeFirebase();
    const gameRef = doc(firestore, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    if (!gameDoc.exists()) throw new Error('Game not found');
    const gameData = gameDoc.data();

    if (playerId !== gameData.activePlayerId) return;

    const isPlayer1 = playerId === gameData.player1Id;
    const nextPlayerId = isPlayer1 ? gameData.player2Id : gameData.player1Id;
    
    // Logic for starting the next player's turn
    const newTurn = gameData.turn + 1;
    const isNewTurnForPlayer1 = nextPlayerId === gameData.player1Id;
    
    const newMaxMana = Math.min((isNewTurnForPlayer1 ? gameData.player1MaxMana : gameData.player2MaxMana) + 1, MAX_MANA);
    const manaFieldToUpdate = isNewTurnForPlayer1 ? 'player1MaxMana' : 'player2MaxMana';
    const currentManaToUpdate = isNewTurnForPlayer1 ? 'player1Mana' : 'player2Mana';
    const boardToUpdate = isNewTurnForPlayer1 ? 'player1Board' : 'player2Board';
    const deckToUpdate = isNewTurnForPlayer1 ? 'player1Deck' : 'player2Deck';
    const handToUpdate = isNewTurnForPlayer1 ? 'player1Hand' : 'player2Hand';

    const boardWithAttackReady = (gameData[boardToUpdate] as CardData[]).map(c => ({ ...c, canAttack: true }));

    const deck = gameData[deckToUpdate] as CardData[];
    const hand = gameData[handToUpdate] as CardData[];
    let newCard = null;
    if (deck.length > 0) {
        newCard = deck.shift();
    }
    const newHand = newCard ? [...hand, newCard] : hand;

    await updateDoc(gameRef, {
        activePlayerId: nextPlayerId,
        turn: newTurn,
        [manaFieldToUpdate]: newMaxMana,
        [currentManaToUpdate]: newMaxMana,
        [boardToUpdate]: boardWithAttackReady,
        [deckToUpdate]: deck,
        [handToUpdate]: newHand,
        lastAction: `ターンを終了し、${isNewTurnForPlayer1 ? gameData.player1LoginId : gameData.player2LoginId}のターン。`,
    });
}

export async function attackAction(gameId: string, playerId: string) {
    const { firestore } = initializeFirebase();
    const gameRef = doc(firestore, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    if (!gameDoc.exists()) throw new Error('Game not found');
    const gameData = gameDoc.data();

    if (playerId !== gameData.activePlayerId) return;

    const isPlayer1 = playerId === gameData.player1Id;
    const playerBoardField = isPlayer1 ? 'player1Board' : 'player2Board';
    const opponentHealthField = isPlayer1 ? 'player2Health' : 'player1Health';
    const opponentId = isPlayer1 ? gameData.player2Id : gameData.player1Id;

    const board = gameData[playerBoardField] as CardData[];
    let totalDamage = 0;
    board.forEach(card => {
        if (card.canAttack) {
            totalDamage += card.attack;
        }
    });

    if (totalDamage > 0) {
        const newHealth = Math.max(0, gameData[opponentHealthField] - totalDamage);
        
        const updates: any = {
            [opponentHealthField]: newHealth,
            lastAction: `合計 ${totalDamage} ダメージの攻撃！`,
        };

        if (newHealth <= 0) {
            updates.status = 'finished';
            updates.winnerId = playerId;
            updates.lastAction = '相手を倒し、勝利した！';
        }
        await updateDoc(gameRef, updates);
    }

    // After attack, proceed to end turn
    await endTurnAction(gameId, playerId);
}
