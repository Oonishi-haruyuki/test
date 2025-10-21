
'use client';

import { useEffect, useState, useCallback } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { initializeFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Swords, Shield, Heart, Sparkles, Play, SkipForward } from 'lucide-react';
import { playCardAction, endTurnAction, attackAction } from '@/lib/actions';
import { CardPreview } from '@/components/card-preview';
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
import { cn } from '@/lib/utils';
import { useMissions } from '@/hooks/use-missions';
import { useStats } from '@/hooks/use-stats';
import { updateUserRating } from '@/lib/rating-system';

interface GameState {
    id: string;
    status: 'waiting' | 'active' | 'finished';
    player1Id: string;
    player2Id: string;
    player1LoginId: string;
    player2LoginId: string;
    player1Health: number;
    player2Health: number;
    turn: number;
    activePlayerId: string;
    winnerId?: string;
    lastAction: string;
    player1Deck: CardData[];
    player2Deck: CardData[];
    player1Hand: CardData[];
    player2Hand: CardData[];
    player1Board: CardData[];
    player2Board: CardData[];
    player1Mana: number;
    player2Mana: number;
    player1MaxMana: number;
    player2MaxMana: number;
}

export default function OnlineBattlePage({ params }: { params: { gameId: string } }) {
    const { user, profile } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
    const { addWin, addLoss } = useStats();
    const { updateMissionProgress } = useMissions();

    useEffect(() => {
        if (!params.gameId) {
            notFound();
            return;
        }

        const { firestore } = initializeFirebase();
        const gameRef = doc(firestore, 'games', params.gameId);

        const unsubscribe = onSnapshot(gameRef, (docSnap) => {
            if (docSnap.exists()) {
                const gameData = { id: docSnap.id, ...docSnap.data() } as GameState;
                setGameState(gameData);

                if (gameData.status === 'finished' && user) {
                    const isWinner = gameData.winnerId === user.uid;
                    toast({
                        title: isWinner ? '勝利！' : '敗北...',
                        description: `対戦が終了しました。`,
                        duration: 5000,
                    });
                     // updateUserRating can be called here
                }
            } else {
                notFound();
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [params.gameId, user, toast]);

    const handlePlayCard = async (card: CardData) => {
        if (!user || !gameState || user.uid !== gameState.activePlayerId) return;
        await playCardAction(gameState.id, card, user.uid);
        setSelectedCard(null);
    };

    const handleEndTurn = async () => {
        if (!user || !gameState || user.uid !== gameState.activePlayerId) return;
        await endTurnAction(gameState.id, user.uid);
    };

    const handleAttack = async () => {
         if (!user || !gameState || user.uid !== gameState.activePlayerId) return;
        await attackAction(gameState.id, user.uid);
    }
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">対戦情報を読み込み中...</div>;
    }

    if (!gameState) {
        return <div className="flex justify-center items-center h-screen">ゲームが見つかりません。</div>;
    }

    if (gameState.status === 'waiting') {
        return <div className="flex justify-center items-center h-screen">対戦相手を待っています...</div>;
    }
    
    if (gameState.status === 'finished') {
        const isWinner = user && gameState.winnerId === user.uid;
        return (
             <div className="flex flex-col items-center justify-center text-center h-full mt-20">
                <h1 className="text-6xl font-bold mb-4">
                    {isWinner ? '勝利！' : '敗北...'}
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                    {isWinner ? 'おめでとうございます！見事な戦いでした。' : '残念、また挑戦しましょう。'}
                </p>
                <Button onClick={() => router.push('/online-battle')}>新しい対戦を探す</Button>
            </div>
        );
    }

    const isPlayer1 = user?.uid === gameState.player1Id;
    const myTurn = user?.uid === gameState.activePlayerId;

    const myState = {
        health: isPlayer1 ? gameState.player1Health : gameState.player2Health,
        mana: isPlayer1 ? gameState.player1Mana : gameState.player2Mana,
        maxMana: isPlayer1 ? gameState.player1MaxMana : gameState.player2MaxMana,
        hand: isPlayer1 ? gameState.player1Hand : gameState.player2Hand,
        board: isPlayer1 ? gameState.player1Board : gameState.player2Board,
    };
    
    const opponentState = {
        loginId: isPlayer1 ? gameState.player2LoginId : gameState.player1LoginId,
        health: isPlayer1 ? gameState.player2Health : gameState.player1Health,
        mana: isPlayer1 ? gameState.player2Mana : gameState.player1Mana,
        maxMana: isPlayer1 ? gameState.player2MaxMana : gameState.player1MaxMana,
        handCount: isPlayer1 ? gameState.player2Hand.length : gameState.player1Hand.length,
        board: isPlayer1 ? gameState.player2Board : gameState.player1Board,
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] w-full max-w-7xl mx-auto bg-gray-800 text-white p-4 rounded-lg shadow-2xl">
            {/* Opponent Area */}
            <PlayerArea isOpponent {...opponentState} />
            
            {/* Middle Area */}
            <div className="flex items-center justify-center gap-4 my-2 text-center border-y-2 border-yellow-400 py-2">
                 <div className="font-semibold text-lg">{gameState.lastAction}</div>
            </div>

            {/* My Area */}
            <PlayerArea 
                health={myState.health}
                mana={myState.mana}
                maxMana={myState.maxMana}
                hand={myState.hand}
                board={myState.board}
                onCardClick={setSelectedCard}
            />

            {/* Player Actions */}
             <div className="flex justify-center items-center gap-4 mt-4 h-16">
                {myTurn ? (
                    <>
                        <Button onClick={handleAttack} size="lg" className="bg-red-600 hover:bg-red-700">
                            <Swords className="mr-2"/>総攻撃
                        </Button>
                        <Button onClick={handleEndTurn} size="lg" variant="outline">
                            <SkipForward className="mr-2"/>ターン終了
                        </Button>
                    </>
                ) : (
                    <p className="text-lg font-semibold animate-pulse">相手のターン</p>
                )}
            </div>

             {/* Selected Card Modal */}
            {selectedCard && (
                <AlertDialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>「{selectedCard.name}」をプレイしますか？</AlertDialogTitle>
                            <div className="py-4">
                                <CardPreview {...selectedCard} />
                            </div>
                            <AlertDialogDescription>
                               マナコスト: {selectedCard.manaCost}。現在マナ: {myState.mana}。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handlePlayCard(selectedCard)}
                                disabled={myState.mana < selectedCard.manaCost}
                            >
                                <Play className="mr-2"/>
                                プレイする
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    )
}

function PlayerArea({ isOpponent = false, loginId, health, mana, maxMana, handCount, hand, board, onCardClick }: any) {
    return (
        <div className={cn('flex-1 flex flex-col', isOpponent ? 'flex-col-reverse' : '')}>
            <div className="flex justify-center items-center h-48">
                 {hand ? (
                     hand.map((card: CardData, i: number) => (
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
                    <div className="flex flex-col items-center gap-4 w-32">
                        {isOpponent && <p className="font-bold truncate">{loginId}</p>}
                        <div className="flex items-center gap-2 text-2xl font-bold"><Heart className="text-red-500 fill-red-500"/> {health}</div>
                        <div className="flex items-center gap-2 text-2xl font-bold"><Sparkles className="text-blue-400 fill-blue-400"/> <span>{mana}/{maxMana}</span></div>
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-2">
                        {board.map((card: CardData, i: number) => (
                            <div key={i} className={cn("transition-all")}>
                                <CardPreview {...card} />
                            </div>
                        ))}
                        {Array.from({ length: 5 - board.length }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-black/30 rounded-lg border-2 border-dashed border-gray-500"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
