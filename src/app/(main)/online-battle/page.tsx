

'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Swords, Heart, Shield, Dices, RotateCcw, Loader2, Users, Group } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useUser, initializeFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { findOrCreateGame, playCardAction, attackAction } from '@/lib/actions';
import { goblinDeck, elementalDeck } from '@/app/(main)/battle/page'; // Using starter decks for now

const DECK_SIZE = 30;

interface Deck {
    id: string;
    name: string;
    cards: CardData[];
}

interface GameState {
    id: string;
    status: 'waiting' | 'active' | 'finished';
    player1Id?: string;
    player2Id?: string;
    player1LoginId?: string;
    player2LoginId?: string;
    player1Health?: number;
    player2Health?: number;
    turn?: number;
    activePlayerId?: string;
    winnerId?: string;
    lastAction?: string;
    player1Deck?: CardData[];
    player2Deck?: CardData[];
    player1Board?: CardData[];
    player2Board?: CardData[];
    player1Hand?: CardData[];
    player2Hand?: CardData[];
    player1Mana?: number;
    player2Mana?: number;
    player1MaxMana?: number;
    player2MaxMana?: number;
}


export default function OnlineBattlePage() {
    const { user, profile } = useUser();
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);
    const [savedDecks, setSavedDecks] = useState<Deck[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

    const [isFindingGame, setIsFindingGame] = useState(false);
    const [gameId, setGameId] = useState<string | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    
    const { firestore } = initializeFirebase();

    useEffect(() => {
        setIsClient(true);
        if (user) {
            try {
                const decksFromStorage: Deck[] = JSON.parse(localStorage.getItem('decks') || '[]');
                const validDecks = decksFromStorage.filter(d => d.cards.length === DECK_SIZE);
                setSavedDecks(validDecks);
                if (validDecks.length > 0) {
                    setSelectedDeck(validDecks[0]);
                } else {
                    // Provide a default fallback deck if user has no valid decks
                    const defaultGoblinDeck = {id: 'starter-goblin', name: 'ゴブリン軍団 (スターター)', cards: goblinDeck };
                    setSavedDecks([defaultGoblinDeck]);
                    setSelectedDeck(defaultGoblinDeck);
                }
            } catch (error) {
                console.error("Failed to load decks", error);
            }
        }
    }, [user]);

    useEffect(() => {
        if (gameId && firestore) {
            const unsub = onSnapshot(doc(firestore, "games", gameId), (doc) => {
                if (doc.exists()) {
                    setGameState({ id: doc.id, ...doc.data() } as GameState);
                }
            });
            return () => unsub();
        }
    }, [gameId, firestore]);

    const handleFindGame = async () => {
        if (!user || !profile || !selectedDeck) {
            toast({ variant: 'destructive', title: 'デッキが選択されていないか、ログインしていません。' });
            return;
        }
        setIsFindingGame(true);
        try {
            const id = await findOrCreateGame(user.uid, profile.loginId || '匿名', selectedDeck.cards);
            setGameId(id);
        } catch (error) {
            console.error("Failed to find or create game:", error);
            toast({ variant: 'destructive', title: 'ゲームの検索に失敗しました。' });
        } finally {
            setIsFindingGame(false);
        }
    };

    const handlePlayCard = async (card: CardData) => {
        if (!gameId || !user) return;
        try {
            await playCardAction(gameId, card, user.uid);
        } catch (error) {
            console.error("Failed to play card:", error);
        }
    };

    const handleAttack = async () => {
        if (!gameId || !user) return;
        try {
            await attackAction(gameId, user.uid);
        } catch (error) {
            console.error("Failed to attack:", error);
        }
    };
    
    if (!isClient) {
        return <main className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" />ロード中...</main>;
    }
    
    if (!user) {
        return (
            <main className="text-center p-10">
                <Card className="max-w-md mx-auto">
                    <CardHeader><CardTitle>ログインが必要です</CardTitle></CardHeader>
                    <CardContent><p>オンライン対戦をプレイするには、マイページからログインしてください。</p></CardContent>
                </Card>
            </main>
        );
    }
    
    const isPlayer1 = user?.uid === gameState?.player1Id;
    const myTurn = user?.uid === gameState?.activePlayerId;

    const myHealth = isPlayer1 ? gameState?.player1Health : gameState?.player2Health;
    const opponentHealth = isPlayer1 ? gameState?.player2Health : gameState?.player1Health;
    const myMana = isPlayer1 ? gameState?.player1Mana : gameState?.player2Mana;
    const myMaxMana = isPlayer1 ? gameState?.player1MaxMana : gameState?.player2MaxMana;
    const opponentMana = isPlayer1 ? gameState?.player2Mana : gameState?.player1Mana;
    const opponentMaxMana = isPlayer1 ? gameState?.player2MaxMana : gameState?.player1MaxMana;
    const myHand = isPlayer1 ? gameState?.player1Hand : gameState?.player2Hand;
    const opponentHandCount = isPlayer1 ? gameState?.player2Hand?.length : gameState?.player1Hand?.length;
    const myBoard = isPlayer1 ? gameState?.player1Board : gameState?.player2Board;
    const opponentBoard = isPlayer1 ? gameState?.player2Board : gameState?.player1Board;
    const myDeckCount = isPlayer1 ? gameState?.player1Deck?.length : gameState?.player2Deck?.length;
    const opponentDeckCount = isPlayer1 ? gameState?.player2Deck?.length : gameState?.player1Deck?.length;
    const opponentLoginId = isPlayer1 ? gameState?.player2LoginId : gameState?.player1LoginId;

    if (!gameId || !gameState) {
        return (
            <main className="text-center p-10">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">オンライン対戦</CardTitle>
                        <CardDescription>デッキを選択して対戦相手を探しましょう！</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Select onValueChange={(deckId) => setSelectedDeck(savedDecks.find(d => d.id === deckId) || null)} defaultValue={selectedDeck?.id}>
                            <SelectTrigger>
                                <SelectValue placeholder="対戦で使用するデッキを選択..." />
                            </SelectTrigger>
                            <SelectContent>
                                {savedDecks.map(deck => (
                                    <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleFindGame} size="lg" disabled={isFindingGame || !selectedDeck}>
                            {isFindingGame ? <Loader2 className="animate-spin mr-2" /> : <Users className="mr-2" />}
                            {isFindingGame ? '対戦相手を探しています...' : '対戦相手を探す'}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }
    
    if (gameState.status === 'waiting') {
        return (
            <main className="text-center p-10">
                 <div className="flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-lg text-muted-foreground">対戦相手を待っています...</p>
                </div>
            </main>
        )
    }

    return (
        <main
            className="flex flex-col gap-2 min-h-screen bg-cover bg-center bg-fixed p-4"
            style={{ backgroundImage: "url('https://picsum.photos/seed/battleground/1920/1080')" }}
        >
            <div className="absolute inset-0 bg-black/30 z-0"></div>
            <div className="relative z-10 flex flex-col gap-2 flex-grow">
                {/* Opponent's Area */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-4">
                        <Card className="p-2 text-center w-40 bg-black/70 text-white border-slate-700">
                            <p className="font-bold truncate">{opponentLoginId || '相手'}</p>
                            <p className="flex items-center justify-center gap-2 text-red-400 font-bold text-xl"><Heart /> {opponentHealth}</p>
                            <p className="flex items-center justify-center gap-2 text-blue-400 font-bold"><Dices /> {opponentMana}/{opponentMaxMana}</p>
                        </Card>
                        <div className="flex gap-2 min-h-[180px]">
                            {Array(opponentHandCount).fill(0).map((_, i) => (
                                <div key={i} className="w-24">
                                    <Card className="h-full flex items-center justify-center text-center p-2 bg-slate-700 text-white">裏向き</Card>
                                </div>
                            ))}
                        </div>
                        <Card className="p-2 text-center w-28 bg-black/70 text-white border-slate-700">
                             <p className="font-bold">山札</p>
                             <p className="text-2xl">{opponentDeckCount}</p>
                        </Card>
                    </div>
                    {/* Opponent's Board */}
                    <div className="flex items-center justify-center gap-2 bg-black/40 p-2 rounded-lg min-h-[160px] w-full max-w-4xl border border-slate-700">
                        {opponentBoard?.map((card, i) => (
                            <div key={card.id + i.toString()} className="w-[110px]">
                                <CardPreview {...card} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game Log / Result */}
                <div className="flex justify-center my-2">
                     {gameState.status === 'finished' ? (
                         <Card className="p-6 my-4 max-w-2xl text-center bg-yellow-200/90 text-slate-800">
                            <p className="text-2xl font-semibold mb-2">{gameState.winnerId === user.uid ? 'あなたの勝利！' : 'あなたの敗北…'}</p>
                            <Button onClick={() => setGameId(null)}>
                                <RotateCcw className="mr-2" />
                                ホームに戻る
                            </Button>
                        </Card>
                     ) : (
                        <Card className="p-2 w-full max-w-lg h-24 overflow-y-auto text-sm bg-black/70 text-white border-slate-700">
                           <p>{gameState.lastAction || 'ゲーム開始！'}</p>
                           {!myTurn && <p className="text-yellow-400">相手のターンです...</p>}
                        </Card>
                     )}
                </div>
                
                {/* Player's Board */}
                 <div className="flex items-center justify-center gap-2 bg-black/40 p-2 rounded-lg min-h-[160px] w-full max-w-4xl mx-auto border border-slate-700">
                    {myBoard?.map((card, i) => (
                        <div key={card.id + i.toString()} className={cn("w-[110px] transform transition-transform", card.canAttack && myTurn ? "border-4 border-green-500 rounded-2xl hover:scale-105" : "opacity-70")}>
                            <CardPreview {...card} />
                        </div>
                    ))}
                </div>

                {/* Player's Area */}
                <div className="flex flex-col items-center gap-2 mt-2">
                    <div className="flex items-center gap-4">
                        <Card className="p-2 text-center w-40 bg-black/70 text-white border-slate-700">
                            <p className="font-bold truncate">{profile?.loginId || 'あなた'}</p>
                            <p className="flex items-center justify-center gap-2 text-red-400 font-bold text-xl"><Heart /> {myHealth}</p>
                            <p className="flex items-center justify-center gap-2 text-blue-400 font-bold"><Dices /> {myMana}/{myMaxMana}</p>
                            <p className="mt-2 text-sm">ターン: {Math.ceil(gameState.turn!/2)}</p>
                        </Card>
                        <div className="flex gap-2 min-h-[180px]">
                            {myHand?.map((card, i) => (
                                <div key={card.id + i.toString()} className={cn("w-[130px] transition-transform", (myTurn && myMana! >= card.manaCost) ? "cursor-pointer hover:scale-105 hover:-translate-y-2" : "opacity-70" )} onClick={() => myTurn && handlePlayCard(card)}>
                                   <CardPreview {...card} />
                                </div>
                            ))}
                        </div>
                         <Card className="p-2 text-center w-28 bg-black/70 text-white border-slate-700">
                             <p className="font-bold">山札</p>
                             <p className="text-2xl">{myDeckCount}</p>
                        </Card>
                    </div>
                    <Button onClick={handleAttack} size="lg" disabled={!myTurn || gameState.status === 'finished'} className="mt-4">
                        攻撃フェーズへ
                    </Button>
                </div>
            </div>
        </main>
    );
}
