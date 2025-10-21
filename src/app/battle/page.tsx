

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Swords, Heart, Shield, Dices, RotateCcw, Loader2, BrainCircuit, Bot, Wand2, Group, FileJson, Coins, BarChart, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDeck } from '@/ai/flows/generate-deck';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';
import { shopItems } from '@/lib/shop-items';
import { useMissions } from '@/hooks/use-missions';
import { useUser } from '@/firebase';
import { updateUserRating } from '@/lib/rating-system';
import { useInventory } from '@/hooks/use-inventory';
import { saveReplay, type GameHistoryEntry } from '@/lib/replay-actions';
import { goblinDeck, elementalDeck, undeadDeck, dragonDeck, ninjaDeck } from '@/lib/decks';
import type { Difficulty, GameRules, BattleProps } from '@/lib/types';

const DECK_SIZE = 30;
const MAX_MANA = 10;
const DEFAULT_BOARD_LIMIT = 5;

const BEGINNER_WIN_REWARD = 10;
const BEGINNER_LOSE_PENALTY = 5;
const ADVANCED_WIN_REWARD = 50;
const ADVANCED_LOSE_PENALTY = 10;
const SUPER_WIN_REWARD = 100;
const SUPER_LOSE_PENALTY = 25;
const DROP_RATE = 0.05; // 5% chance

interface Deck {
    id: string;
    name: string;
    cards: CardData[];
}

type DeckChoice = 'my-deck' | 'starter-goblin' | 'starter-elemental' | 'starter-undead' | 'starter-dragon' | 'starter-ninja' | 'ai-fantasy' | 'ai-scifi';

const starterDecks = {
    'starter-goblin': { name: 'ゴブリン軍団', deck: goblinDeck },
    'starter-elemental': { name: 'エレメンタル召喚', deck: elementalDeck },
    'starter-undead': { name: 'アンデッド軍団', deck: undeadDeck },
    'starter-dragon': { name: 'ドラゴンズ・ホード', deck: dragonDeck },
    'starter-ninja': { name: 'ニンジャ一族', deck: ninjaDeck },
};

type StarterDeckId = keyof typeof starterDecks;


function BattleGame({
  playerDeck: initialPlayerDeck,
  opponentDeck: initialOpponentDeck,
  difficulty,
  onGameEnd,
  isDailyChallenge = false,
  gameRules = {},
}: {
  playerDeck: CardData[];
  opponentDeck: CardData[];
  difficulty: Difficulty;
  onGameEnd: (result: 'win' | 'loss') => void;
  isDailyChallenge?: boolean;
  gameRules?: GameRules;
}) {
    const { toast } = useToast();
    const { addCurrency, spendCurrency } = useCurrency();
    const { addWin, addLoss } = useStats();
    const { updateMissionProgress } = useMissions();
    const { user, profile } = useUser();
    const [ratingChange, setRatingChange] = useState<number | null>(null);
    const { addItem } = useInventory();
    const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);

    const boardLimit = gameRules.boardLimit ?? DEFAULT_BOARD_LIMIT;
    const landLimit = gameRules.landLimit ?? DEFAULT_BOARD_LIMIT; // Default to same as board limit if not specified

    // Game State
    const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
    const [playerHand, setPlayerHand] = useState<CardData[]>([]);
    const [playerBoard, setPlayerBoard] = useState<CardData[]>([]);
    const [playerHealth, setPlayerHealth] = useState(gameRules.playerHealth ?? 20);
    const [playerMana, setPlayerMana] = useState(1);
    const [playerMaxMana, setPlayerMaxMana] = useState(1);
    
    const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
    const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
    const [opponentBoard, setOpponentBoard] = useState<CardData[]>([]);
    const [opponentHealth, setOpponentHealth] = useState(gameRules.opponentHealth ?? 20);
    const [opponentMana, setOpponentMana] = useState(1);
    const [opponentMaxMana, setOpponentMaxMana] = useState(1);
    
    const [turn, setTurn] = useState(1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [gameLog, setGameLog] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState('');
    const [gamePhase, setGamePhase] = useState<'main' | 'attack'>('main');

    const [cardBackImage, setCardBackImage] = useState<string | null>(null);
    const [purchasedArtifacts, setPurchasedArtifacts] = useState<string[]>([]);

    useEffect(() => {
        try {
            const savedCardBack = localStorage.getItem('cardBackImage');
            if (savedCardBack) {
                setCardBackImage(savedCardBack);
            }
            // Only apply purchased artifacts if not in a custom rules game
            if (Object.keys(gameRules).length === 0) {
                 const savedArtifacts = JSON.parse(localStorage.getItem('purchasedArtifacts') || '[]');
                 setPurchasedArtifacts(savedArtifacts);
            }
        } catch (error) {
            console.error("Failed to check for saved data", error);
        }
    }, [gameRules]);

    const shuffleDeck = (deck: CardData[]) => {
        return [...deck].sort(() => Math.random() - 0.5);
    }
    
    const recordHistory = (log: string) => {
        const historyEntry: GameHistoryEntry = {
            log,
            player1Health: playerHealth,
            player2Health: opponentHealth,
            player1Mana: playerMana,
            player2Mana: opponentMana,
            player1MaxMana: playerMaxMana,
            player2MaxMana: opponentMaxMana,
            player1Hand: playerHand.map(c => ({ id: c.id, name: c.name })),
            player2Hand: opponentHand.map(c => ({ id: c.id, name: c.name })),
            player1Board: [...playerBoard],
            player2Board: [...opponentBoard],
        };
        setGameHistory(prev => [...prev, historyEntry]);
    };

    const addToLog = (message: string) => {
        setGameLog(prev => [`[T${Math.ceil(turn/2)}] ${message}`, ...prev]);
        recordHistory(message);
    }

    const startGame = useCallback((playerDeckData: CardData[], opponentDeckData: CardData[]) => {
        const pDeck = shuffleDeck([...playerDeckData]);
        const oDeck = shuffleDeck([...opponentDeckData]);

        const hasHpBoost = purchasedArtifacts.includes('artifact-hp-boost');
        const hasHandBoost = purchasedArtifacts.includes('artifact-hand-boost');
        const hasManaBoost = purchasedArtifacts.includes('artifact-mana-boost');
        
        const initialPlayerHealth = gameRules.playerHealth ?? (hasHpBoost ? 25 : 20);
        const initialOpponentHealth = gameRules.opponentHealth ?? 20;

        const initialHandSize = hasHandBoost ? 6 : 5;
        const initialPlayerMaxMana = hasManaBoost ? 2 : 1;

        const initialPlayerHand = pDeck.splice(0, initialHandSize);
        const initialOpponentHand = oDeck.splice(0, 5);

        setPlayerDeck(pDeck);
        setPlayerHand(initialPlayerHand);
        setPlayerBoard([]);
        setPlayerHealth(initialPlayerHealth);
        setPlayerMana(initialPlayerMaxMana);
        setPlayerMaxMana(initialPlayerMaxMana);

        setOpponentDeck(oDeck);
        setOpponentHand(initialOpponentHand);
        setOpponentBoard([]);
        setOpponentHealth(initialOpponentHealth);
        setOpponentMana(1);
        setOpponentMaxMana(1);

        setTurn(1);
        const playerGoesFirst = Math.random() < 0.5;
        setIsPlayerTurn(playerGoesFirst);
        
        setGamePhase('main');
        setGameOver('');
        setRatingChange(null);
        setGameHistory([]);
        const firstTurnMessage = playerGoesFirst ? 'あなたが先攻です。' : '相手が先攻です。';
        setGameLog([`--- ターン 1: ${playerGoesFirst ? 'あなた' : '相手'}のターン ---`, firstTurnMessage, 'ゲーム開始！']);
        
        if (hasHpBoost) addToLog('生命のアミュレットの効果で、あなたの初期HPが25になった！');
        if (hasHandBoost) addToLog('マナの水晶の効果で、あなたの初期手札が6枚になった！');
        if (hasManaBoost) addToLog('マナの指輪の効果で、あなたの初期最大マナが2になった！');

        if (!playerGoesFirst) {
            setTimeout(aiTurn, 1000);
        }
    }, [purchasedArtifacts, gameRules]);

     useEffect(() => {
        if (initialPlayerDeck && initialOpponentDeck) {
            startGame(initialPlayerDeck, initialOpponentDeck);
        }
    }, [initialPlayerDeck, initialOpponentDeck, startGame]);

    const drawCard = (isPlayer: boolean) => {
        if (isPlayer) {
            let deck = [...playerDeck];
            if(deck.length === 0) {
                addToLog('あなたの山札はもうない！');
                return;
            }
            const drawnCard = deck.shift();
            setPlayerDeck(deck);
            if (drawnCard) {
                const handLimit = purchasedArtifacts.includes('artifact-hand-boost') ? 6 : 5;
                if (playerHand.length < handLimit) {
                    setPlayerHand(prev => [...prev, drawnCard]);
                    addToLog('あなたはカードを1枚引いた。');
                } else {
                    addToLog('あなたの手札がいっぱいで、引いたカードを破棄した。');
                }
            }
        } else {
            let deck = [...opponentDeck];
             if(deck.length === 0) {
                addToLog('相手の山札はもうない！');
                return;
            }
            const drawnCard = deck.shift();
            setOpponentDeck(deck);
            if (drawnCard) {
                if (opponentHand.length < 5) {
                    setOpponentHand(prev => [...prev, drawnCard]);
                    addToLog('相手はカードを1枚引いた。');
                } else {
                    addToLog('相手の手札がいっぱいで、引いたカードを破棄した。');
                }
            }
        }
    }

    const applySpellEffect = (card: CardData, isCasterPlayer: boolean) => {
        const Caster = isCasterPlayer ? 'あなた' : '相手';
        const Target = isCasterPlayer ? '相手' : 'あなた';
        let effectApplied = false;
        if (card.abilities) {
            const abilities = card.abilities.toLowerCase();
            if (abilities.includes('ダメージ')) {
                const damage = parseInt(abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10);
                if (damage > 0) {
                    if (isCasterPlayer) setOpponentHealth(prev => Math.max(0, prev - damage));
                    else setPlayerHealth(prev => Math.max(0, prev - damage));
                    addToLog(`「${card.name}」の効果で${Target}に${damage}ダメージ！`);
                    effectApplied = true;
                }
            }
            if (abilities.includes('回復')) {
                const heal = parseInt(abilities.match(/(\d+)回復/)?.[1] || '0', 10);
                if (heal > 0) {
                    if (isCasterPlayer) setPlayerHealth(prev => prev + heal);
                    else setOpponentHealth(prev => prev + heal);
                    addToLog(`「${card.name}」の効果で${Caster}はライフを${heal}回復。`);
                    effectApplied = true;
                }
            }
            if (abilities.includes('カードを引く')) {
                const drawCount = parseInt(abilities.match(/(\d+)枚/)?.[1] || '1', 10);
                addToLog(`「${card.name}」の効果で${Caster}はカードを${drawCount}枚引く。`);
                for(let i=0; i<drawCount; i++) drawCard(isCasterPlayer);
                effectApplied = true;
            }
            if (abilities.includes('マナ')) {
                const manaBoost = parseInt(abilities.match(/\+(\d+)/)?.[1] || '1', 10);
                if (isCasterPlayer) setPlayerMaxMana(prev => Math.min(MAX_MANA, prev + manaBoost));
                else setOpponentMaxMana(prev => Math.min(MAX_MANA, prev + manaBoost));
                addToLog(`「${card.name}」の効果で${Caster}の最大マナが増えた！`);
                effectApplied = true;
            }
        }
        if (!effectApplied) addToLog(`「${card.name}」は何の効果ももたらさなかった。`);
    };

    const handleEndGame = useCallback(async (result: 'win' | 'loss') => {
        if (!difficulty || !user) {
            if (onGameEnd) onGameEnd(result);
            return;
        }
        
        await saveReplay({
            player1Id: user.uid,
            player2Id: 'AI',
            player1LoginId: profile?.loginId || 'Player',
            player2LoginId: `AI (${difficulty})`,
            winnerId: result === 'win' ? user.uid : 'AI',
            history: gameHistory,
        });
    
        const winRewardMap = { 'beginner': BEGINNER_WIN_REWARD, 'advanced': ADVANCED_WIN_REWARD, 'super': SUPER_WIN_REWARD };
        const losePenaltyMap = { 'beginner': BEGINNER_LOSE_PENALTY, 'advanced': ADVANCED_LOSE_PENALTY, 'super': SUPER_LOSE_PENALTY };
        
        const winReward = winRewardMap[difficulty];
        const losePenalty = losePenaltyMap[difficulty];
        
        updateMissionProgress('play-game', 1);

        try {
            // Do not update rating if it's a custom game (story mode)
            if (Object.keys(gameRules).length === 0) {
                const { newRating, change } = await updateUserRating(user.uid, difficulty, result);
                setRatingChange(change);
                 if (result === 'win') {
                    setGameOver('あなたの勝利！');
                    addCurrency(winReward);
                    toast({
                        title: '勝利！',
                        description: `${winReward}G獲得しました！ レーティング: ${newRating} (${change > 0 ? '+' : ''}${change})`,
                      });
                 } else {
                    setGameOver('相手の勝利！');
                    spendCurrency(losePenalty);
                    toast({
                        title: '敗北...',
                        description: `${losePenalty}G失いました。レーティング: ${newRating} (${change})`,
                        variant: 'destructive',
                    });
                 }
            }
            
            if (result === 'win') {
              setGameOver('あなたの勝利！');
              addToLog('ゲーム終了！あなたが勝利しました。');
              addWin();
              updateMissionProgress('win-game', 1);
              if (isDailyChallenge) {
                  updateMissionProgress('win-daily-challenge', 1);
              }
              if (Object.keys(gameRules).length > 0) { // Story mode etc. has its own reward toast
                // Do nothing, reward is handled by the calling page
              } else if (Math.random() < DROP_RATE) {
                addItem('dragon-soul', 1);
                addCurrency(winReward);
                toast({
                    title: '勝利！',
                    description: `${winReward}Gと竜の魂x1を獲得しました！`,
                  });
              } else {
                addCurrency(winReward);
                // Rating toast is handled above
              }

            } else {
              setGameOver('相手の勝利！');
              addToLog('ゲーム終了！相手が勝利しました。');
              addLoss();
              if (Object.keys(gameRules).length === 0) {
                 spendCurrency(losePenalty);
                 // Rating toast is handled above
              }
            }
        } catch (error) {
            console.error("Rating update failed", error);
            toast({ variant: 'destructive', title: 'レーティングの更新に失敗しました。'});
            if (result === 'win') {
                setGameOver('あなたの勝利！');
                addCurrency(winReward);
                addWin();
            } else {
                setGameOver('相手の勝利！');
                spendCurrency(losePenalty);
                addLoss();
            }
        } finally {
            if (onGameEnd) onGameEnd(result);
        }
    }, [difficulty, user, profile, addCurrency, addLoss, addWin, spendCurrency, toast, updateMissionProgress, isDailyChallenge, onGameEnd, addItem, gameHistory, gameRules]);

    useEffect(() => {
        if (gameOver) return;
        if (playerHealth <= 0) {
            handleEndGame('loss');
        } else if (opponentHealth <= 0) {
            handleEndGame('win');
        }
    }, [playerHealth, opponentHealth, gameOver, handleEndGame]);

    const playCard = (card: CardData, cardIndex: number) => {
        if (!isPlayerTurn || gameOver || gamePhase !== 'main') return;
        
        if (gameRules.disallowedCardTypes?.includes(card.cardType)) {
            toast({ variant: 'destructive', title: '使用不可カード', description: `このモードでは「${card.cardType}」カードは使用できません。`});
            return;
        }

        if (playerMana < card.manaCost) {
            toast({ variant: 'destructive', title: 'マナが足りません！'});
            return;
        }
        
        const isCreature = card.cardType === 'creature';
        const isLand = card.cardType === 'land';

        const creatureCount = playerBoard.filter(c => c.cardType === 'creature').length;
        const landCount = playerBoard.filter(c => c.cardType === 'land').length;

        if (isCreature && creatureCount >= boardLimit) {
            toast({ variant: 'destructive', title: 'クリーチャーゾーンが上限です。'});
            return;
        }
        if (isLand && landCount >= landLimit) {
            toast({ variant: 'destructive', title: '土地ゾーンが上限です。'});
            return;
        }

        const newHand = [...playerHand];
        newHand.splice(cardIndex, 1);
        setPlayerMana(prev => prev - card.manaCost);
        setPlayerHand(newHand);
        addToLog(`あなたが「${card.name}」をプレイ！`);
        if (isCreature || isLand) {
            setPlayerBoard(prev => [...prev, {...card, canAttack: false}]);
        } else {
            applySpellEffect(card, true);
        }
    };

    const handleAttackPhase = () => {
        if (!isPlayerTurn || gameOver || gamePhase !== 'main') return;
        setGamePhase('attack');
        addToLog('攻撃フェーズへ！');
        let totalDamage = 0;
        playerBoard.forEach(c => {
            if (c.canAttack && c.cardType === 'creature') {
                totalDamage += c.attack;
                addToLog(`あなたの「${c.name}」(${c.attack}/${c.defense})が相手に攻撃！`);
            }
        });
        if (totalDamage > 0) {
            setOpponentHealth(prev => Math.max(0, prev - totalDamage));
            addToLog(`相手は合計${totalDamage}のダメージを受けた！`);
        } else {
            addToLog('攻撃できるクリーチャーがいませんでした。');
        }
        setTimeout(endTurn, 1000); 
    };

    const endTurn = () => {
        if (!isPlayerTurn || gameOver) return;
        addToLog('あなたがターンを終了。');
        setIsPlayerTurn(false);
        setGamePhase('main'); // Reset phase for AI
        setTimeout(aiTurn, 1000);
    };
    
    const aiChooseCard = (hand: CardData[], mana: number, myBoard: CardData[]): CardData | null => {
        let playableCards = hand.filter(c => c.manaCost <= mana);
        
        if (gameRules.disallowedCardTypes) {
            playableCards = playableCards.filter(c => !gameRules.disallowedCardTypes?.includes(c.cardType));
        }

        const creatureCount = myBoard.filter(c => c.cardType === 'creature').length;
        if (creatureCount >= boardLimit) {
            playableCards = playableCards.filter(c => c.cardType !== 'creature');
        }
        
        const landCount = myBoard.filter(c => c.cardType === 'land').length;
         if (landCount >= landLimit) {
            playableCards = playableCards.filter(c => c.cardType !== 'land');
        }

        if (playableCards.length === 0) return null;

        if (difficulty === 'beginner') {
            return playableCards.sort((a,b) => b.manaCost - a.manaCost)[0];
        }

        const creatureCards = playableCards.filter(c => c.cardType === 'creature');
        const spellCards = playableCards.filter(c => c.cardType !== 'creature' && c.cardType !== 'land');
        const damageSpells = spellCards.filter(s => s.abilities.includes('ダメージ'));

        if (difficulty === 'super') {
            if (damageSpells.length > 0 && playerHealth <= 10) {
                const lethalSpell = damageSpells.find(s => (parseInt(s.abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10)) >= playerHealth);
                if (lethalSpell) return lethalSpell;
                return damageSpells.sort((a, b) => (parseInt(b.abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10)) - (parseInt(a.abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10)))[0];
            }
        }

        if (creatureCards.length > 0) {
             const bestCreature = creatureCards.reduce((best, current) => {
                const bestScore = (best.attack + best.defense) / (best.manaCost + 1);
                const currentScore = (current.attack + current.defense) / (current.manaCost + 1);
                return currentScore > bestScore ? current : best;
            });
            return bestCreature;
        }
        
        if (spellCards.length > 0) {
            if (damageSpells.length > 0 && playerHealth < opponentHealth / 2) {
                return damageSpells.sort((a, b) => (parseInt(b.abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10)) - (parseInt(a.abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10)))[0];
            }
            const drawSpells = spellCards.filter(s => s.abilities.includes('カードを引く'));
            if (drawSpells.length > 0 && hand.length <= 2) {
                return drawSpells[0];
            }
            return spellCards.sort((a,b) => b.manaCost - a.manaCost)[0] ?? null;
        }

        return playableCards.sort((a,b) => b.manaCost - a.manaCost)[0] ?? null;
    }

    const aiTurn = () => {
        if (gameOver) return;

        const nextTurn = turn + 1;
        setTurn(nextTurn);
        addToLog(`--- ターン ${Math.ceil(nextTurn/2)}: 相手のターン ---`);

        const newOpponentMaxMana = Math.min(MAX_MANA, opponentMaxMana + 1);
        setOpponentMaxMana(newOpponentMaxMana);
        setOpponentMana(newOpponentMaxMana);
        setOpponentBoard(prev => prev.map(c => ({ ...c, canAttack: true })));
        
        drawCard(false);

        let tempHand = [...opponentHand];
        let tempMana = newOpponentMaxMana;
        let tempBoard = [...opponentBoard];

        setTimeout(() => {
            const playCardLoop = () => {
                const cardToPlay = aiChooseCard(tempHand, tempMana, tempBoard);

                if (cardToPlay) {
                    const cardIndex = tempHand.findIndex(c => c.id === cardToPlay.id);
                    tempMana -= cardToPlay.manaCost;
                    tempHand.splice(cardIndex, 1);
                    
                    setOpponentHand(h => h.filter(c => c.id !== cardToPlay.id));
                    setOpponentMana(m => m - cardToPlay.manaCost);
                    
                    addToLog(`相手が「${cardToPlay.name}」をプレイ！`);
                    
                    const isCreature = cardToPlay.cardType === 'creature';
                    const isLand = cardToPlay.cardType === 'land';

                    if (isCreature || isLand) {
                        tempBoard.push({...cardToPlay, canAttack: false});
                        setOpponentBoard(b => [...b, {...cardToPlay, canAttack: false}]);
                    } else {
                        applySpellEffect(cardToPlay, false);
                    }
                    setTimeout(playCardLoop, 1500);
                } else {
                     setTimeout(aiAttackPhase, 1000);
                }
            };
            playCardLoop();
        }, 1000);
        
        const aiAttackPhase = () => {
            if (gameOver) { setIsPlayerTurn(true); return; }

            addToLog('相手の攻撃フェーズ！');
            let totalDamage = 0;
            opponentBoard.forEach(c => {
                if (c.canAttack && c.cardType === 'creature') {
                    totalDamage += c.attack;
                    addToLog(`相手の「${c.name}」(${c.attack}/${c.defense})があなたに攻撃！`);
                }
            });
    
            if (totalDamage > 0) {
                setPlayerHealth(prev => Math.max(0, prev - totalDamage));
                addToLog(`あなたは合計${totalDamage}のダメージを受けた！`);
            } else {
                addToLog('相手は攻撃してこなかった。');
            }

            setTimeout(endAiTurn, 1000);
        }

        const endAiTurn = () => {
             if (gameOver) {
                setIsPlayerTurn(true);
                return;
            }
            addToLog('相手がターンを終了。');
            
            const newPlayerMaxMana = Math.min(MAX_MANA, playerMaxMana + 1);
            setPlayerMaxMana(newPlayerMaxMana);
            setPlayerMana(newPlayerMaxMana);
            setPlayerBoard(prev => prev.map(c => ({ ...c, canAttack: true })));
            setIsPlayerTurn(true);
            setGamePhase('main');
            
            addToLog(`--- ターン ${Math.ceil(turn/2)+1}: あなたのターン ---`);
            drawCard(true);
        }
    };
    
    if (gameOver) {
        const winReward = difficulty === 'beginner' ? BEGINNER_WIN_REWARD : difficulty === 'advanced' ? ADVANCED_WIN_REWARD : SUPER_WIN_REWARD;
        const losePenalty = difficulty === 'beginner' ? BEGINNER_LOSE_PENALTY : difficulty === 'advanced' ? ADVANCED_LOSE_PENALTY : SUPER_LOSE_PENALTY;
        
        return (
            <Card className="p-4 md:p-6 my-4 max-w-2xl text-center bg-yellow-200/90 text-slate-800 mx-auto">
                <p className="text-xl md:text-2xl font-semibold mb-2">{gameOver}</p>
                {gameOver === 'あなたの勝利！' && Object.keys(gameRules).length === 0 && (
                    <p className="flex items-center justify-center gap-2 text-md md:text-lg font-medium text-yellow-700 mb-2">
                        <Coins className="h-6 w-6" /> +{winReward}G
                    </p>
                )} 
                {gameOver !== 'あなたの勝利！' && Object.keys(gameRules).length === 0 && (
                    <p className="flex items-center justify-center gap-2 text-md md:text-lg font-medium text-red-600 mb-2">
                        <Coins className="h-6 w-6" /> -{losePenalty}G
                    </p>
                )}
                {ratingChange !== null && (
                    <p className={cn("flex items-center justify-center gap-2 text-md md:text-lg font-medium mb-4", ratingChange >= 0 ? "text-green-600" : "text-red-600")}>
                       <BarChart className="h-6 w-6" /> レーティング: {ratingChange > 0 ? '+' : ''}${ratingChange}
                    </p>
                )}
                <Button onClick={onGameEnd ? () => onGameEnd(gameOver === 'あなたの勝利！' ? 'win' : 'loss') : () => {}}>
                    <RotateCcw className="mr-2" />
                    終了
                </Button>
            </Card>
        );
    }
    
    const difficultyText = difficulty === 'beginner' ? '初級' : difficulty === 'advanced' ? '上級' : '超級';
    
    return (
        <div
            className="flex flex-col gap-4 min-h-screen bg-cover bg-center bg-fixed p-2 md:p-4"
            style={{ backgroundImage: "url('https://picsum.photos/seed/battleground/1920/1080')" }}
        >
                <div className="absolute inset-0 bg-black/50 z-0"></div>
            <div className="relative z-10 flex flex-col gap-4 flex-grow">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full">
                        <Card className="p-2 text-center w-40 bg-black/70 text-white border-slate-700 order-2 md:order-1">
                            <p className="font-bold">相手 ({difficultyText})</p>
                            <p className="flex items-center justify-center gap-2 text-red-400 font-bold text-xl"><Heart /> {opponentHealth}</p>
                            <p className="flex items-center justify-center gap-2 text-blue-400 font-bold"><Dices /> {opponentMana}/{opponentMaxMana}</p>
                        </Card>
                        <div className="flex gap-1 min-h-[100px] md:min-h-[140px] order-1 md:order-2 flex-grow justify-center">
                            {opponentHand.map((card, i) => (
                                <div key={card.id ? card.id + i.toString() : i} className="w-16 md:w-24">
                                {cardBackImage ? (
                                        <Image src={cardBackImage} alt="Card Back" width={96} height={134} className="rounded-lg shadow-md" unoptimized />
                                ) : (
                                        <Card className="h-full flex items-center justify-center text-center p-2 bg-slate-700 text-white">裏</Card>
                                )}
                                </div>
                            ))}
                        </div>
                        <Card className="p-2 text-center w-28 bg-black/70 text-white border-slate-700 order-3">
                            <p className="font-bold">山札</p>
                            <p className="text-xl md:text-2xl">{opponentDeck.length}</p>
                        </Card>
                    </div>
                    <div className="flex items-center justify-center gap-2 bg-black/40 p-2 rounded-lg min-h-[120px] md:min-h-[160px] w-full max-w-4xl mx-auto border border-slate-700 overflow-x-auto">
                        {opponentBoard.map((card, i) => (
                            <div key={card.id + i.toString()} className="w-[80px] md:w-[110px] shrink-0">
                                <CardPreview {...card} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center my-2">
                    <Card className="p-2 w-full max-w-lg h-24 overflow-y-auto text-sm bg-black/70 text-white border-slate-700">
                    {gameLog.map((log, i) => <p key={i}>{log}</p>)}
                    </Card>
                </div>
                <div className="flex items-center justify-center gap-2 bg-black/40 p-2 rounded-lg min-h-[120px] md:min-h-[160px] w-full max-w-4xl mx-auto border border-slate-700 overflow-x-auto">
                    {playerBoard.map((card, i) => (
                        <div key={card.id + i.toString()} className={cn("w-[80px] md:w-[110px] shrink-0 transform transition-transform", card.canAttack ? "border-4 border-green-500 rounded-2xl hover:scale-105" : "opacity-70")}>
                            <CardPreview {...card} />
                        </div>
                    ))}
                </div>
                <div className="flex flex-col items-center gap-2 mt-2">
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full">
                        <Card className="p-2 text-center w-40 bg-black/70 text-white border-slate-700 order-2 md:order-1">
                            <p className="font-bold">あなた</p>
                            <p className="flex items-center justify-center gap-2 text-red-400 font-bold text-xl"><Heart /> {playerHealth}</p>
                            <p className="flex items-center justify-center gap-2 text-blue-400 font-bold"><Dices /> {playerMana}/{playerMaxMana}</p>
                            <p className="mt-1 text-xs">ターン: {Math.ceil(turn/2)}</p>
                        </Card>
                        <div className="flex gap-1 min-h-[140px] md:min-h-[180px] order-1 md:order-2 flex-grow justify-center overflow-x-auto w-full px-2">
                            {playerHand.map((card, i) => (
                                <div key={card.id + i.toString()} className={cn("w-[95px] md:w-[130px] shrink-0 transition-transform", (isPlayerTurn && gamePhase === 'main' && playerMana >= card.manaCost) ? "cursor-pointer hover:scale-105 hover:-translate-y-2" : "opacity-70" )} onClick={() => playCard(card, i)}>
                                <CardPreview {...card} />
                                </div>
                            ))}
                        </div>
                        <Card className="p-2 text-center w-28 bg-black/70 text-white border-slate-700 order-3">
                            <p className="font-bold">山札</p>
                            <p className="text-xl md:text-2xl">{playerDeck.length}</p>
                        </Card>
                    </div>
                    <Button onClick={handleAttackPhase} size="lg" disabled={!isPlayerTurn || !!gameOver || gamePhase !== 'main'} className="mt-4">
                        攻撃フェーズへ
                    </Button>
                </div>
            </div>
        </div>
    );
}


export default function BattlePageWrapper(props: BattleProps) {
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);
    const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
    const [gameState, setGameState] = useState<'setup' | 'battle' | 'finished'>('setup');

    const [difficulty, setDifficulty] = useState<Difficulty | null>(props.forcedDifficulty || null);
    const [deckChoice, setDeckChoice] = useState<string | null>(null);
    const [savedDecks, setSavedDecks] = useState<Deck[]>([]);
    
    const [playerDeck, setPlayerDeck] = useState<CardData[] | null>(props.initialPlayerDeck || null);
    const [opponentDeck, setOpponentDeck] = useState<CardData[] | null>(props.initialOpponentDeck || null);
    
    const [isDailyChallenge, setIsDailyChallenge] = useState(false);

    const dailyChallengeDeckId = useMemo<StarterDeckId>(() => {
        if (!isClient) return 'starter-goblin';
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const deckIds = Object.keys(starterDecks) as StarterDeckId[];
        return deckIds[dayOfYear % deckIds.length];
    }, [isClient]);
    
    useEffect(() => {
        setIsClient(true);
        try {
            const decksFromStorage: Deck[] = JSON.parse(localStorage.getItem('decks') || '[]');
            setSavedDecks(decksFromStorage);
        } catch (error) {
            console.error("Failed to check for saved data", error);
        }
    }, []);

    useEffect(() => {
        if (props.initialPlayerDeck && props.initialOpponentDeck && props.forcedDifficulty) {
            setPlayerDeck(props.initialPlayerDeck);
            setOpponentDeck(props.initialOpponentDeck);
            setDifficulty(props.forcedDifficulty);
            setGameState('battle');
        }
    }, [props.initialPlayerDeck, props.initialOpponentDeck, props.forcedDifficulty]);
    
    const createAiDeck = useCallback(async (playerDeckData: CardData[]): Promise<CardData[]> => {
        setIsGeneratingDeck(true);
        try {
            const playerTheme = playerDeckData[0]?.theme || 'fantasy';
            const aiTheme = playerTheme === 'fantasy' ? 'SF' : 'ファンタジー';

            const result = await generateDeck({ theme: aiTheme, cardCount: DECK_SIZE });
            return result.deck.map((card, index) => ({
                ...card,
                id: `ai-${index}`,
                theme: aiTheme === 'SF' ? 'sci-fi' : 'fantasy',
                imageUrl: `https://picsum.photos/seed/ai${index}/${400}/${300}`,
            }));
        } catch (error) {
            console.error("Failed to generate AI deck", error);
            toast({ variant: 'destructive', title: 'AIデッキの生成に失敗しました。'});
            return elementalDeck;
        } finally {
            setIsGeneratingDeck(false);
        }
    }, [toast]);
    
    const handleSelectDeck = useCallback(async (choice: string) => {
        setDeckChoice(choice);
        setIsGeneratingDeck(true);
        let deckToLoad: CardData[] = [];
        let toastMessage = '';

        try {
            const starterDeck = starterDecks[choice as StarterDeckId];
            if (starterDeck) {
                deckToLoad = starterDeck.deck;
                toastMessage = `スターターデッキ「${starterDeck.name}」で開始します。`;
            } else if (choice === 'ai-fantasy' || choice === 'ai-scifi') {
                const theme = choice === 'ai-fantasy' ? 'ファンタジー' : 'SF';
                const result = await generateDeck({ theme, cardCount: DECK_SIZE });
                deckToLoad = result.deck.map((card, index) => ({
                    ...card,
                    id: `player-ai-${index}`,
                    theme: choice === 'ai-fantasy' ? 'fantasy' : 'sci-fi',
                    imageUrl: `https://picsum.photos/seed/p-ai${index}/${400}/${300}`,
                }));
                toastMessage = `AIが生成した「${theme}」デッキで開始します。`;
            } else {
                const selectedDeck = savedDecks.find(d => d.id === choice);
                if (selectedDeck && selectedDeck.cards.length === DECK_SIZE) {
                    deckToLoad = selectedDeck.cards;
                    toastMessage = `デッキ「${selectedDeck.name}」で開始します。`;
                } else {
                    deckToLoad = goblinDeck;
                    toastMessage = '選択したデッキが不正か見つかりません。ゴブリンデッキで開始します。';
                }
            }
            
            const aiDeck = await createAiDeck(deckToLoad);
            setPlayerDeck(deckToLoad);
            setOpponentDeck(aiDeck);
            setGameState('battle');
            toast({ title: toastMessage });

        } catch (error) {
            console.error("Failed to prepare player deck", error);
            toast({ variant: 'destructive', title: 'デッキの準備に失敗しました。'});
        } finally {
            setIsGeneratingDeck(false);
        }
    }, [savedDecks, createAiDeck, toast]);

    const startDailyChallenge = () => {
        setDifficulty('advanced');
        setIsDailyChallenge(true);
        handleSelectDeck(dailyChallengeDeckId);
    }

    const resetGame = () => {
        setGameState('setup');
        setDifficulty(props.forcedDifficulty || null);
        setDeckChoice(null);
        setPlayerDeck(props.initialPlayerDeck || null);
        setOpponentDeck(props.initialOpponentDeck || null);
        setIsDailyChallenge(false);
    }
    
    if (!isClient) {
        return <main className="text-center p-4 md:p-10"><Loader2 className="animate-spin inline-block mr-2" />ロード中...</main>;
    }
    
    if (gameState === 'battle' && playerDeck && opponentDeck && difficulty) {
        return (
            <BattleGame
                playerDeck={playerDeck}
                opponentDeck={opponentDeck}
                difficulty={difficulty}
                onGameEnd={props.onGameEnd ? props.onGameEnd : resetGame}
                isDailyChallenge={isDailyChallenge}
                gameRules={props.gameRules}
            />
        )
    }

    if (isGeneratingDeck) {
        return (
            <main className="text-center p-4 md:p-10">
                <div className="flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-lg text-muted-foreground">デッキを準備しています...</p>
                    <p className="text-sm text-muted-foreground">AIデッキ生成には少し時間がかかる場合があります。</p>
                </div>
            </main>
        );
    }
    
    if (!difficulty) {
        const dailyDeckInfo = starterDecks[dailyChallengeDeckId];
        return (
            <main className="text-center p-4 md:p-10 space-y-8">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">難易度を選択してください</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button onClick={() => setDifficulty('beginner')} size="lg">
                            <Bot className="mr-2" /> 初級 (+{BEGINNER_WIN_REWARD}G / -{BEGINNER_LOSE_PENALTY}G)
                        </Button>
                        <Button onClick={() => setDifficulty('advanced')} size="lg">
                           <BrainCircuit className="mr-2" /> 上級 (+{ADVANCED_WIN_REWARD}G / -{ADVANCED_LOSE_PENALTY}G)
                        </Button>
                        <Button onClick={() => setDifficulty('super')} size="lg" variant="destructive">
                           <Crown className="mr-2" /> 超級 (+{SUPER_WIN_REWARD}G / -{SUPER_LOSE_PENALTY}G)
                        </Button>
                    </CardContent>
                </Card>
                <Card className="max-w-md mx-auto border-primary">
                     <CardHeader>
                        <CardTitle className="text-2xl text-primary">デイリーチャレンジ</CardTitle>
                        <CardDescription>指定されたデッキで上級AIに挑戦しよう！勝利すると特別ボーナス！</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <p>本日の挑戦デッキ： <span className="font-bold">{dailyDeckInfo.name}</span></p>
                        <Button onClick={startDailyChallenge} size="lg">
                           挑戦する
                        </Button>
                    </CardContent>
                </Card>
            </main>
        )
    }

    if (difficulty && !deckChoice) {
        const validDecks = savedDecks.filter(d => d.cards.length === DECK_SIZE);
        return (
             <main className="text-center p-4 md:p-10">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">使用するデッキを選択してください</CardTitle>
                        <CardDescription>
                            難易度: {difficulty === 'beginner' ? '初級' : difficulty === 'advanced' ? '上級' : '超級'}
                            <Button variant="link" onClick={() => setDifficulty(null)}>変更</Button>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {validDecks.length > 0 && (
                            <div className="md:col-span-2 space-y-2">
                                <p className="font-semibold text-left">保存したデッキ</p>
                                <Select onValueChange={(deckId) => handleSelectDeck(deckId)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="保存したデッキを選択..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {validDecks.map(deck => (
                                            <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {(Object.keys(starterDecks) as StarterDeckId[]).map(deckId => (
                             <Button key={deckId} onClick={() => handleSelectDeck(deckId)} size="lg" className="h-20">
                                <Group className="mr-2" />
                                <div>
                                    <p>{starterDecks[deckId].name}</p>
                                </div>
                            </Button>
                        ))}
                        <Button onClick={() => handleSelectDeck('ai-fantasy')} size="lg" className="h-20">
                           <Wand2 className="mr-2" /> 
                           <div>
                                <p>AI生成デッキ (ファンタジー)</p>
                                <p className="text-sm font-normal">（毎回新しいデッキ）</p>
                            </div>
                        </Button>
                        <Button onClick={() => handleSelectDeck('ai-scifi')} size="lg" className="h-20">
                           <Wand2 className="mr-2" /> 
                           <div>
                                <p>AI生成デッキ (SF)</p>
                                <p className="text-sm font-normal">（毎回新しいデッキ）</p>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        )
    }

    return null;
}
