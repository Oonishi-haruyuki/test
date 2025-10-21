
'use server';

import { getFirestore, collection, query, where, limit, getDocs, doc, setDoc, updateDoc, writeBatch, serverTimestamp, runTransaction as firestoreRunTransaction } from 'firebase/firestore';
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

    const q = query(gamesRef, where('status', '==', 'waiting'), where('player1Id', '!=', userId), limit(1));
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
            player1Hand: [], // Will be set when game starts
            player2Deck: [], // Will be set when p2 joins
            player2Hand: [],
            player1Board: [],
            player2Board: [],
            player1Mana: 1,
            player2Mana: 1,
            player1MaxMana: 1,
            player2MaxMana: 1,
            createdAt: serverTimestamp(),
            lastAction: `${userLoginId} が対戦相手を待っています...`,
            lastEmote: null,
        });

        return gameId;
    }
}

export async function playCardAction(gameId: string, card: CardData, playerId: string) {
    const { firestore } = initializeFirebase();
    const gameRef = doc(firestore, 'games', gameId);
    
    try {
        await firestoreRunTransaction(firestore, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error('Game not found');
            const gameData = gameDoc.data();

            if (playerId !== gameData.activePlayerId) throw new Error('Not your turn');

            const isPlayer1 = playerId === gameData.player1Id;
            const playerHandField = isPlayer1 ? 'player1Hand' : 'player2Hand';
            const playerBoardField = isPlayer1 ? 'player1Board' : 'player2Board';
            const playerManaField = isPlayer1 ? 'player1Mana' : 'player2Mana';

            const hand = gameData[playerHandField] as CardData[];
            const board = gameData[playerBoardField] as CardData[];
            const mana = gameData[playerManaField] as number;

            const cardIndex = hand.findIndex(c => c.id === card.id);
            if (cardIndex === -1 || mana < card.manaCost) {
                throw new Error('Cannot play this card');
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
                // Example: Draw cards
                if (card.abilities.includes("引く")) {
                    // This is a simplified example. A real implementation would be more robust.
                    // For now, let's assume it doesn't modify the deck/hand state directly in this action.
                }
            }

            transaction.update(gameRef, updates);
        });
    } catch (error) {
        console.error("Play card action failed:", error);
    }
}


export async function endTurnAction(gameId: string, playerId: string) {
    const { firestore } = initializeFirebase();
    const gameRef = doc(firestore, 'games', gameId);
    
    try {
        await firestoreRunTransaction(firestore, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error('Game not found');
            const gameData = gameDoc.data();

            if (playerId !== gameData.activePlayerId) return;

            const isEndingPlayer1sTurn = playerId === gameData.player1Id;
            const nextPlayerId = isEndingPlayer1sTurn ? gameData.player2Id : gameData.player1Id;
            const endingPlayerBoardField = isEndingPlayer1sTurn ? 'player1Board' : 'player2Board';

            // Make ending player's creatures unable to attack again this turn cycle
             const endingPlayerBoard = (gameData[endingPlayerBoardField] as CardData[]).map(c => ({ ...c, canAttack: false }));

            // Prepare next player's turn
            const isNextPlayerP1 = nextPlayerId === gameData.player1Id;
            const newTurn = isNextPlayerP1 ? gameData.turn + 1 : gameData.turn;
            
            const nextPlayerMaxManaField = isNextPlayerP1 ? 'player1MaxMana' : 'player2MaxMana';
            const nextPlayerManaField = isNextPlayerP1 ? 'player1Mana' : 'player2Mana';
            const nextPlayerBoardField = isNextPlayerP1 ? 'player1Board' : 'player2Board';
            const nextPlayerDeckField = isNextPlayerP1 ? 'player1Deck' : 'player2Deck';
            const nextPlayerHandField = isNextPlayerP1 ? 'player1Hand' : 'player2Hand';
            const nextPlayerLoginId = isNextPlayerP1 ? gameData.player1LoginId : gameData.player2LoginId;

            const newMaxMana = Math.min((gameData[nextPlayerMaxManaField] || 0) + 1, MAX_MANA);
            const nextPlayerBoard = (gameData[nextPlayerBoardField] as CardData[]).map(c => ({ ...c, canAttack: true }));

            const deck = [...gameData[nextPlayerDeckField]];
            const hand = [...gameData[nextPlayerHandField]];
            if (deck.length > 0) {
                const drawnCard = deck.shift();
                if (drawnCard) hand.push(drawnCard);
            }

            const updates = {
                activePlayerId: nextPlayerId,
                turn: newTurn,
                [endingPlayerBoardField]: endingPlayerBoard,
                [nextPlayerMaxManaField]: newMaxMana,
                [nextPlayerManaField]: newMaxMana,
                [nextPlayerBoardField]: nextPlayerBoard,
                [nextPlayerDeckField]: deck,
                [nextPlayerHandField]: hand,
                lastAction: `${nextPlayerLoginId}のターン。`,
            };

            transaction.update(gameRef, updates);
        });
    } catch (error) {
        console.error("End turn action failed:", error);
    }
}

export async function attackAction(gameId: string, playerId: string) {
    const { firestore } = initializeFirebase();
    const gameRef = doc(firestore, 'games', gameId);
    
    try {
        let shouldEndTurn = true;
        await firestoreRunTransaction(firestore, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw new Error('Game not found');
            const gameData = gameDoc.data();

            if (playerId !== gameData.activePlayerId) throw new Error("Not your turn");

            const isPlayer1 = playerId === gameData.player1Id;
            const playerBoardField = isPlayer1 ? 'player1Board' : 'player2Board';
            const opponentHealthField = isPlayer1 ? 'player2Health' : 'player1Health';
            
            const board = gameData[playerBoardField] as CardData[];
            const attackingCreatures = board.filter(c => c.canAttack);
            if (attackingCreatures.length === 0) {
                shouldEndTurn = true; // No attack happened, but still end turn
                return;
            };

            const totalDamage = attackingCreatures.reduce((sum, card) => sum + (card.attack || 0), 0);

            if (totalDamage > 0) {
                const newHealth = Math.max(0, gameData[opponentHealthField] - totalDamage);
                
                const updates: any = {
                    [opponentHealthField]: newHealth,
                    lastAction: `合計 ${totalDamage} ダメージの攻撃！`,
                    // Mark attackers as having attacked
                    [playerBoardField]: board.map(c => ({...c, canAttack: false})),
                };

                if (newHealth <= 0) {
                    updates.status = 'finished';
                    updates.winnerId = playerId;
                    updates.lastAction = '相手を倒し、勝利した！';
                    shouldEndTurn = false; // Game is over, don't end turn
                }
                transaction.update(gameRef, updates);
            }
        });
        
        if (shouldEndTurn) {
            await endTurnAction(gameId, playerId);
        }

    } catch (error) {
        console.error("Attack action failed:", error);
    }
}


export async function sendEmoteAction(gameId: string, senderId: string, emoteId: string) {
    const { firestore } = initializeFirebase();
    const gameRef = doc(firestore, 'games', gameId);

    try {
        await updateDoc(gameRef, {
            lastEmote: {
                id: emoteId,
                senderId: senderId,
                timestamp: serverTimestamp() // To ensure it's a new emote
            }
        });
    } catch (error) {
        console.error("Send emote action failed:", error);
    }
}
