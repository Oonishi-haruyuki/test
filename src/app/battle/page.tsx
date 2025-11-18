'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import type { CardData, Rarity, CardType } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Swords, Shield, Heart, Sparkles, Bot, Clock, Play, SkipForward, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useSearchParams } from 'next/navigation';
import { generateDeck } from '@/ai/flows/generate-deck';
import { goblinDeck, elementalDeck, undeadDeck, dragonDeck, ninjaDeck } from '@/lib/decks';
import { useMissions } from '@/hooks/use-missions';
import { useStats } from '@/hooks/use-stats';
import type { BattleProps, Difficulty, GameRules } from '@/lib/types';
import { emotes, type Emote } from '@/lib/emotes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/hooks/use-currency';

const MAX_MANA = 10;
const INITIAL_HEALTH = 20;

const shuffleDeck = (deck: CardData[]) => {
    return [...deck].sort(() => Math.random() - 0.5);
}

const opponentDecks: { [key in Difficulty]: CardData[][] } = {
    beginner: [goblinDeck, elementalDeck],
    advanced: [undeadDeck, dragonDeck],
    super: [ninjaDeck, dragonDeck, undeadDeck],
};

const defaultGameRules: GameRules = {
  playerHealth: INITIAL_HEALTH,
  opponentHealth: INITIAL_HEALTH,
  boardLimit: 5,
  disallowedCardTypes: [],
}

function BattlePageContent() {
    const searchParams = useSearchParams();
    const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
    const [gameState, setGameState] = useState<'selecting' | 'loading' | 'active' | 'finished'>('selecting');
    const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
    const { toast } = useToast();

    const [battleProps, setBattleProps] = useState<BattleProps | null>(null);

    const startGame = (selectedPlayerDeck: CardData[], selectedDifficulty: Difficulty) => {
        setDifficulty(selectedDifficulty);
        const availableDecks = opponentDecks[selectedDifficulty];
        const selectedOpponentDeck = availableDecks[Math.floor(Math.random() * availableDecks.length)];

        const playerHealth = searchParams.get('playerHealth');
        const opponentHealth = searchParams.get('opponentHealth');
        const boardLimit = searchParams.get('boardLimit');
        const disallowedCardTypes = searchParams.get('disallowedCardTypes');
        const stageId = searchParams.get('stageId');
        const reward = searchParams.get('reward');

        const gameRules: GameRules = { ...defaultGameRules };
        if (playerHealth) gameRules.playerHealth = parseInt(playerHealth, 10);
        if (opponentHealth) gameRules.opponentHealth = parseInt(opponentHealth, 10);
        if (boardLimit) gameRules.boardLimit = parseInt(boardLimit, 10);
        if (disallowedCardTypes) gameRules.disallowedCardTypes = disallowedCardTypes.split(',') as CardType[];
        if (stageId) gameRules.stageId = stageId;
        if (reward) gameRules.reward = parseInt(reward, 10);

        setBattleProps({
            initialPlayerDeck: selectedPlayerDeck,
            initialOpponentDeck: selectedOpponentDeck,
            forcedDifficulty: selectedDifficulty,
            onGameEnd: (result) => {
                setWinner(result === 'win' ? 'player' : 'opponent');
                setGameState('finished');
            },
            gameRules: gameRules,
        });

        setGameState('active');
    };

    const resetGame = () => {
        setGameState('selecting');
        setWinner(null);
        setBattleProps(null);
    };

    if (gameState === 'active' && battleProps) {
        return <BattleView {...battleProps} />;
    }

    if (gameState === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full">
                <h1 className="text-6xl font-bold mb-4">
                    {winner === 'player' ? '勝利！' : '敗北...'}
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    {winner === 'player' ? 'おめでとうございます！見事な戦いでした。' : '残念、また挑戦しましょう。'}
                </p>
                <Button onClick={resetGame}>もう一度プレイ</Button>
            </div>
        );
    }
    
    return <DeckSelection onStartGame={startGame} />;
}

export default function BattlePage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-10 w-10" /><p className="ml-4">読み込み中...</p></div>}>
            <BattlePageContent />
        </Suspense>
    );
}

function DeckSelection({ onStartGame }: { onStartGame: (deck: CardData[], difficulty: Difficulty) => void }) {
    const [decks, setDecks] = useState<{id: string, name: string, cards: CardData[]}[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const searchParams = useSearchParams();

    useEffect(() => {
        const isStoryMode = searchParams.get('story') === 'true';
        if (isStoryMode) {
            try {
                const storyDeckJSON = localStorage.getItem('storyModeDeck');
                if (storyDeckJSON) {
                    const storyDeck = JSON.parse(storyDeckJSON) as CardData[];
                    const storyDifficulty = searchParams.get('difficulty') as Difficulty || 'beginner';
                    if (storyDeck.length >= 20) {
                        onStartGame(storyDeck, storyDifficulty);
                    } else {
                         toast({ variant: 'destructive', title: 'ストーリーデッキの読み込みに失敗しました' });
                    }
                }
            } catch (e) {
                 toast({ variant: 'destructive', title: 'ストーリーデッキの読み込み中にエラーが発生しました' });
            }
        }
    }, [searchParams, onStartGame, toast]);

    useEffect(() => {
        try {
            const savedDecks = JSON.parse(localStorage.getItem('cardDecks') || '[]');
            setDecks(savedDecks);
            if (savedDecks.length > 0) {
                setSelectedDeckId(savedDecks[0].id);
            }
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'デッキの読み込みに失敗しました' });
        }
    }, [toast]);
    
    if (searchParams.get('story') === 'true') {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-10 w-10" /><p className="ml-4">対戦を開始しています...</p></div>;
    }

    const handleGenerateDeck = async () => {
        setIsLoading(true);
        try {
            const result = await generateDeck({ theme: 'ファンタジー', cardCount: 20 });
            const newDeck = {
                id: `generated-${Date.now()}`,
                name: 'AI生成デッキ (ファンタジー)',
                cards: result.deck.map(c => ({...c, id: self.crypto.randomUUID(), imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`})) as CardData[]
            };
            setDecks(prev => [...prev, newDeck]);
            setSelectedDeckId(newDeck.id);
            toast({ title: 'AIが新しいデッキを生成しました！'});
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'デッキ生成に失敗しました' });
        }
        setIsLoading(false);
    };

    const handleStart = () => {
        const selectedDeck = decks.find(d => d.id === selectedDeckId);
        if (!selectedDeck || selectedDeck.cards.length < 20) {
            toast({ variant: 'destructive', title: 'デッキが不完全です', description: '20枚のカードで構成されたデッキを選択してください。' });
            return;
        }
        onStartGame(selectedDeck.cards, difficulty);
    };
    
    const selectedDeck = decks.find(d => d.id === selectedDeckId);

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-2">AI対戦</h1>
            <p className="text-muted-foreground text-center mb-8">使用するデッキとAIの難易度を選択してください。</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">1. デッキを選択</h2>
                    <div className="space-y-4">
                        <Select onValueChange={setSelectedDeckId} value={selectedDeckId || ''}>
                            <SelectTrigger>
                                <SelectValue placeholder="デッキを選択..." />
                            </SelectTrigger>
                            <SelectContent>
                                {decks.map(deck => (
                                    <SelectItem key={deck.id} value={deck.id}>{deck.name} ({deck.cards.length}枚)</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Button onClick={handleGenerateDeck} disabled={isLoading} variant="outline" className="w-full">
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 生成中...</> : 'AIにデッキを生成させる'}
                         </Button>
                    </div>
                     <div className="mt-4 p-2 border rounded-lg h-96 overflow-y-auto bg-secondary/30">
                        {selectedDeck ? (
                            <ul className="space-y-1 text-sm">
                                {selectedDeck.cards.map((card, i) => <li key={`${card.id}-${i}`} className="p-1 rounded bg-background/50">{card.name}</li>)}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground pt-10">デッキを選択してください。</p>
                        )}
                    </div>
                </div>
                 <div>
                    <h2 className="text-xl font-semibold mb-4">2. 難易度を選択</h2>
                     <div className="space-y-2">
                        <Button onClick={() => setDifficulty('beginner')} variant={difficulty === 'beginner' ? 'default' : 'outline'} className="w-full justify-start h-16 text-left">
                            <div>
                                <p className="font-bold text-base">初級</p>
                                <p className="font-normal text-sm">基本を学びたい方向け</p>
                            </div>
                        </Button>
                        <Button onClick={() => setDifficulty('advanced')} variant={difficulty === 'advanced' ? 'default' : 'outline'} className="w-full justify-start h-16 text-left">
                            <div>
                                <p className="font-bold text-base">上級</p>
                                <p className="font-normal text-sm">手応えのある対戦を楽しみたい方向け</p>
                            </div>
                        </Button>
                        <Button onClick={() => setDifficulty('super')} variant={difficulty === 'super' ? 'default' : 'outline'} className="w-full justify-start h-16 text-left">
                             <div>
                                <p className="font-bold text-base">超級</p>
                                <p className="font-normal text-sm">最強のAIに挑戦したい方向け</p>
                            </div>
                        </Button>
                     </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <Button size="lg" onClick={handleStart} disabled={!selectedDeckId}>
                    <Swords className="mr-2"/>
                    対戦開始！
                </Button>
            </div>
        </div>
    )
}

function BattleView({ initialPlayerDeck, initialOpponentDeck, onGameEnd, gameRules }: BattleProps) {
    const { addWin, addLoss } = useStats();
    const { updateMissionProgress } = useMissions();
    const { addCurrency } = useCurrency();
    const { toast } = useToast();
    
    const [turn, setTurn] = useState(1);
    const [activePlayer, setActivePlayer] = useState<'player' | 'opponent'>('player');
    const [gameStatus, setGameStatus] = useState<'active' | 'finished'>('active');

    const [playerHealth, setPlayerHealth] = useState(gameRules?.playerHealth || INITIAL_HEALTH);
    const [playerMana, setPlayerMana] = useState(1);
    const [playerMaxMana, setPlayerMaxMana] = useState(1);
    const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
    const [playerHand, setPlayerHand] = useState<CardData[]>([]);
    const [playerBoard, setPlayerBoard] = useState<CardData[]>([]);

    const [opponentHealth, setOpponentHealth] = useState(gameRules?.opponentHealth || INITIAL_HEALTH);
    const [opponentMana, setOpponentMana] = useState(1);
    const [opponentMaxMana, setOpponentMaxMana] = useState(1);
    const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
    const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
    const [opponentBoard, setOpponentBoard] = useState<CardData[]>([]);
    
    const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
    
    const [statusMessage, setStatusMessage] = useState('対戦開始！');
    const [isOpponentThinking, setIsOpponentThinking] = useState(false);
    const [activeEmote, setActiveEmote] = useState<{ emote: Emote, sender: 'player' | 'opponent' } | null>(null);

    const searchParams = useSearchParams();
    const isStoryMode = searchParams.has('story');

    const [isPlayerTurn, setIsPlayerTurn] = useState(isStoryMode ? false : true);

    const effectiveGameRules = useMemo(() => ({ ...defaultGameRules, ...gameRules }), [gameRules]);

    const handleGameEnd = useCallback(async (winner: 'player' | 'opponent') => {
        setGameStatus('finished');
        
        if (winner === 'player') {
            addWin();
            updateMissionProgress('win-game', 1);
            if (isStoryMode && effectiveGameRules.stageId) {
                const stageKey = `story-stage-${effectiveGameRules.stageId}-cleared`;
                const alreadyCleared = localStorage.getItem(stageKey) === 'true';
                if (!alreadyCleared) {
                     if (effectiveGameRules.reward) {
                         addCurrency(effectiveGameRules.reward);
                         toast({ title: 'ステージクリア！', description: `${effectiveGameRules.reward}Gを獲得しました！` });
                     }
                     localStorage.setItem(stageKey, 'true');
                }
            }
        } else {
            addLoss();
        }
        updateMissionProgress('play-game', 1);
        
        if (onGameEnd) {
            onGameEnd(winner === 'player' ? 'win' : 'loss');
        }

    }, [onGameEnd, addWin, addLoss, updateMissionProgress, toast, isStoryMode, effectiveGameRules, addCurrency]);

    useEffect(() => {
        const pDeck = shuffleDeck(initialPlayerDeck || []);
        const oDeck = shuffleDeck(initialOpponentDeck || []);
        
        setPlayerHand(pDeck.splice(0, 5));
        setPlayerDeck(pDeck);

        setOpponentHand(oDeck.splice(0, 5));
        setOpponentDeck(oDeck);

        if (Math.random() < 0.5) {
             setIsPlayerTurn(true);
             setActivePlayer('player');
             setStatusMessage("あなたのターンです。");
        } else {
            setIsPlayerTurn(false);
            setActivePlayer('opponent');
            setStatusMessage("相手のターンです。");
        }
    }, [initialPlayerDeck, initialOpponentDeck]);

    const drawCard = (deck: CardData[], hand: CardData[]): [CardData[], CardData[]] => {
        if (deck.length > 0) {
            const newDeck = [...deck];
            const drawnCard = newDeck.shift()!;
            const newHand = [...hand, drawnCard];
            return [newDeck, newHand];
        }
        return [deck, hand];
    };

    const endTurn = useCallback(() => {
        if (!isPlayerTurn) return;
        setIsPlayerTurn(false);
        setActivePlayer('opponent');
        setStatusMessage("相手のターンです。");
        const newOpponentMaxMana = Math.min(opponentMaxMana + 1, MAX_MANA);
        setOpponentMaxMana(newOpponentMaxMana);
        setOpponentMana(newOpponentMaxMana);
        setPlayerBoard(prev => prev.map(c => ({...c, canAttack: true})));

        const [newOpponentDeck, newOpponentHand] = drawCard(opponentDeck, opponentHand);
        setOpponentDeck(newOpponentDeck);
        setOpponentHand(newOpponentHand);

    }, [isPlayerTurn, opponentMaxMana, opponentDeck, opponentHand]);

    const playCard = (card: CardData) => {
        if (!isPlayerTurn || playerMana < card.manaCost || (effectiveGameRules.disallowedCardTypes?.includes(card.cardType))) {
            if (effectiveGameRules.disallowedCardTypes?.includes(card.cardType)) {
                toast({ variant: 'destructive', title: 'このカードは使用できません' });
            }
            return;
        }

        const cardInHandIndex = playerHand.findIndex(c => c.id === card.id);
        if (cardInHandIndex === -1) return;

        if (card.cardType === 'creature' && playerBoard.length >= effectiveGameRules.boardLimit!) {
            toast({ variant: 'destructive', title: `クリーチャーは${effectiveGameRules.boardLimit}体までです` });
            return;
        }

        setPlayerMana(prev => prev - card.manaCost);
        const newHand = [...playerHand];
        newHand.splice(cardInHandIndex, 1);
        setPlayerHand(newHand);
        
        if (card.cardType === 'creature') {
            setPlayerBoard(prev => [...prev, { ...card, canAttack: false }]);
        } else {
            setStatusMessage(`「${card.name}」の呪文効果発動！`);
            if (card.abilities.includes('引く')) {
                const drawCount = (card.abilities.match(/(\d+)枚引く/) || [])[1] || '1';
                let newDeck = playerDeck;
                let latestHand = newHand;
                for (let i = 0; i < parseInt(drawCount); i++) {
                    [newDeck, latestHand] = drawCard(newDeck, latestHand);
                }
                setPlayerDeck(newDeck);
                setPlayerHand(latestHand);
            }
             if (card.abilities.includes('ダメージ')) {
                const damage = parseInt((card.abilities.match(/(\d+)ダメージ/) || [])[1] || '0');
                setOpponentHealth(h => Math.max(0, h - damage));
            }
        }

        setSelectedCard(null);
    };

    const playerAttack = () => {
        if (!isPlayerTurn) return;
        const attackingCreatures = playerBoard.filter(c => c.canAttack);
        if (attackingCreatures.length === 0) return;
        
        const totalAttack = attackingCreatures.reduce((sum, card) => sum + card.attack, 0);
        
        setOpponentHealth(h => Math.max(0, h - totalAttack));
        setPlayerBoard(prev => prev.map(c => ({...c, canAttack: false })));
        setStatusMessage(`合計 ${totalAttack} のダメージを与えた！`);

        if (opponentHealth - totalAttack <= 0) {
            return; 
        }

        endTurn();
    }
    
    useEffect(() => {
        if (!isPlayerTurn && gameStatus === 'active') {
            setIsOpponentThinking(true);
            const thinkTimer = setTimeout(() => {

                let mana = opponentMana;
                let hand = [...opponentHand];
                let board = [...opponentBoard];
                const playableCards = hand.filter(c => c.manaCost <= mana && (!effectiveGameRules.disallowedCardTypes?.includes(c.cardType)));

                if (playableCards.length > 0 && board.length < effectiveGameRules.boardLimit!) {
                    const cardToPlay = playableCards.sort((a,b) => b.manaCost - a.manaCost)[0];
                    mana -= cardToPlay.manaCost;
                    hand = hand.filter(c => c.id !== cardToPlay.id);
                    if (cardToPlay.cardType === 'creature') {
                        board.push({ ...cardToPlay, canAttack: false });
                    }
                    setStatusMessage(`相手が「${cardToPlay.name}」をプレイ！`);
                }
                
                setOpponentMana(mana);
                setOpponentHand(hand);
                setOpponentBoard(board);
                
                const attackTimer = setTimeout(() => {
                    const attackingCreatures = board.filter(c => c.canAttack);
                    if (attackingCreatures.length > 0) {
                        const totalAttack = attackingCreatures.reduce((sum, card) => sum + card.attack, 0);
                        setPlayerHealth(h => Math.max(0, h - totalAttack));
                        setOpponentBoard(b => b.map(c => ({...c, canAttack: false})));
                        setStatusMessage(`相手から合計 ${totalAttack} のダメージを受けた！`);
                    }

                    const endTimer = setTimeout(() => {
                        setIsOpponentThinking(false);
                        setIsPlayerTurn(true);
                        setActivePlayer('player');
                        const newPlayerMaxMana = Math.min(playerMaxMana + 1, MAX_MANA);
                        setPlayerMaxMana(newPlayerMaxMana);
                        setPlayerMana(newPlayerMaxMana);
                        setOpponentBoard(prev => prev.map(c => ({...c, canAttack: true})));

                        const [newPlayerDeck, newPlayerHand] = drawCard(playerDeck, playerHand);
                        setPlayerDeck(newPlayerDeck);
                        setPlayerHand(newPlayerHand);
                        setStatusMessage("あなたのターンです。");
                    }, 1000);
                    return () => clearTimeout(endTimer);
                }, 1000);
                return () => clearTimeout(attackTimer);

            }, 2000);
            return () => clearTimeout(thinkTimer);
        }
    }, [isPlayerTurn, gameStatus, effectiveGameRules.boardLimit, effectiveGameRules.disallowedCardTypes, opponentHand, opponentMana, opponentBoard, playerDeck, playerHand, playerMaxMana]);

    useEffect(() => {
        if (playerHealth <= 0) {
            handleGameEnd('opponent');
        } else if (opponentHealth <= 0) {
            handleGameEnd('player');
        }
    }, [playerHealth, opponentHealth, handleGameEnd]);

    const showEmote = (emote: Emote, sender: 'player' | 'opponent') => {
        setActiveEmote({ emote, sender });
        setTimeout(() => setActiveEmote(null), 3000);
    };

    const handleEmoteSelect = (emote: Emote) => {
        showEmote(emote, 'player');
        if (emote.id === 'hello') {
            setTimeout(() => showEmote(emotes.find(e => e.id === 'hello')!, 'opponent'), 1000);
        }
        if (emote.id === 'thanks') {
            setTimeout(() => showEmote(emotes.find(e => e.id === 'gg')!, 'opponent'), 1000);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] w-full max-w-7xl mx-auto bg-gray-800 text-white p-4 rounded-lg shadow-2xl relative">

             {activeEmote && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 rounded-xl p-6 flex flex-col items-center gap-2 animate-in fade-in zoom-in-50">
                        <activeEmote.emote.icon size={48} className="text-white" />
                        <p className="text-xl font-bold">{activeEmote.emote.label}</p>
                        <p className="text-sm text-muted-foreground">{activeEmote.sender === 'player' ? 'Player' : 'AI'}</p>
                    </div>
                </div>
            )}

            <PlayerArea
                isOpponent
                health={opponentHealth}
                mana={opponentMana}
                maxMana={opponentMaxMana}
                handCount={opponentHand.length}
                deckCount={opponentDeck.length}
                board={opponentBoard}
                gameRules={effectiveGameRules}
                onEmoteSelect={(emote) => showEmote(emote, 'opponent')}
            />

            <div className="flex items-center justify-center gap-4 my-2 text-center border-y-2 border-yellow-400 py-2">
                 {isOpponentThinking && <div className="flex items-center gap-2"><Bot className="animate-pulse" />相手が考慮中です...</div>}
                 {!isOpponentThinking && <div className="font-semibold text-lg">{statusMessage}</div>}
            </div>

            <PlayerArea
                health={playerHealth}
                mana={playerMana}
                maxMana={playerMaxMana}
                handCount={playerHand.length}
                deckCount={playerDeck.length}
                board={playerBoard}
                hand={playerHand}
                onCardClick={setSelectedCard}
                gameRules={effectiveGameRules}
                onEmoteSelect={handleEmoteSelect}
            />

            <div className="flex justify-center items-center gap-4 mt-4 h-16">
                {isPlayerTurn ? (
                    <>
                        <Button onClick={playerAttack} size="lg" className="bg-red-600 hover:bg-red-700">
                            <Swords className="mr-2"/>総攻撃
                        </Button>
                        <Button onClick={endTurn} size="lg" variant="outline">
                            <SkipForward className="mr-2"/>ターン終了
                        </Button>
                    </>
                ) : (
                    <p className="text-lg font-semibold animate-pulse">相手のターン</p>
                )}
            </div>

            {selectedCard && (
                <AlertDialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>「{selectedCard.name}」をプレイしますか？</AlertDialogTitle>
                            <div className="py-4">
                                <CardPreview {...selectedCard} />
                            </div>
                            <AlertDialogDescription>
                               マナコスト: {selectedCard.manaCost}。現在マナ: {playerMana}。
                               {(effectiveGameRules.disallowedCardTypes?.includes(selectedCard.cardType)) &&
                                <span className="text-red-500 font-bold block mt-2">このカードは現在のルールでは使用できません。</span>
                               }
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => playCard(selectedCard)}
                                disabled={playerMana < selectedCard.manaCost || effectiveGameRules.disallowedCardTypes?.includes(selectedCard.cardType)}
                            >
                                <Play className="mr-2"/>
                                プレイする
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}

interface PlayerAreaProps {
  isOpponent?: boolean;
  health: number;
  mana: number;
  maxMana: number;
  handCount: number;
  deckCount: number;
  board: CardData[];
  hand?: CardData[];
  onCardClick?: (card: CardData) => void;
  gameRules: GameRules;
  onEmoteSelect: (emote: Emote) => void;
}

function PlayerArea({ isOpponent = false, health, mana, maxMana, handCount, deckCount, board, hand, onCardClick, gameRules, onEmoteSelect }: PlayerAreaProps) {
    const boardLimit = gameRules.boardLimit || 5;

    return (
        <div className={cn('flex-1 flex flex-col', isOpponent ? 'flex-col-reverse' : '')}>
            <div className="flex justify-center items-center h-48">
                 {hand ? (
                     hand.map((card, i) => (
                        <div key={i} onClick={() => onCardClick?.(card)} className="cursor-pointer hover:scale-105 hover:-translate-y-4 transition-transform duration-200">
                             <CardPreview {...card} />
                        </div>
                     ))
                 ) : (
                     <div className="flex gap-2">
                        {Array.from({ length: handCount }).map((_, i) => (
                           <div key={i} className="w-24 h-36 bg-slate-600 rounded-lg border-2 border-slate-400"></div>
                        ))}
                     </div>
                 )}
            </div>

            <div className="flex-1 bg-black/20 rounded-lg p-2 flex items-center">
                 <div className="flex items-center gap-4 w-full">
                     <div className="flex flex-col items-center justify-between gap-4 w-32 h-full">
                         <div className="flex items-center gap-2 text-2xl font-bold">
                            <Heart className="text-red-500 fill-red-500"/> 
                            {health}
                         </div>
                         <div className="flex items-center gap-2 text-2xl font-bold">
                            <Sparkles className="text-blue-400 fill-blue-400"/> 
                            <span>{mana}/{maxMana}</span>
                         </div>

                        {!isOpponent && (
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="rounded-full"><MessageSquare /></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {emotes.map(emote => (
                                            <Button key={emote.id} variant="ghost" className="flex flex-col h-auto p-2" onClick={() => onEmoteSelect(emote)}>
                                                <emote.icon size={24} />
                                                <span className="text-xs">{emote.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                        
                         <div className="text-center">
                            <p>デッキ</p>
                            <p>{deckCount}</p>
                         </div>
                     </div>
                    <div className="flex-1 grid grid-cols-5 gap-2">
                        {board.map((card, i) => (
                            <div key={i} className={cn("transition-all", card.canAttack && !isOpponent && "cursor-pointer hover:scale-105 hover:-translate-y-2")}>
                                <CardPreview {...card} />
                            </div>
                        ))}
                         {Array.from({ length: boardLimit - board.length }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-black/30 rounded-lg border-2 border-dashed border-gray-500"></div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
