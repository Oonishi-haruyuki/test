
'use client';

import { useState, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { GameHistoryEntry } from '@/lib/replay-actions';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Swords, Heart, Sparkles, Hand, Bot, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ReplayData = {
    id: string;
    player1Id: string;
    player2Id: string;
    player1LoginId: string;
    player2LoginId: string;
    winnerId: string;
    createdAt: any;
    history: GameHistoryEntry[];
};

export default function ReplayPage({ params }: { params: { replayId: string } }) {
    const [replay, setReplay] = useState<ReplayData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [turn, setTurn] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const fetchReplay = async () => {
            const { firestore } = initializeFirebase();
            const replayRef = doc(firestore, 'replays', params.replayId);
            const docSnap = await getDoc(replayRef);

            if (docSnap.exists()) {
                setReplay({ id: docSnap.id, ...docSnap.data() } as ReplayData);
            } else {
                notFound();
            }
            setIsLoading(false);
        };
        fetchReplay();
    }, [params.replayId]);

    useEffect(() => {
        if (isPlaying && replay && turn < replay.history.length - 1) {
            const timer = setTimeout(() => {
                setTurn(t => t + 1);
            }, 1500);
            return () => clearTimeout(timer);
        }
        if (isPlaying && replay && turn >= replay.history.length -1) {
            setIsPlaying(false);
        }
    }, [isPlaying, turn, replay]);

    const handleSliderChange = (value: number[]) => {
        setTurn(value[0]);
    };

    const currentTurnData = replay?.history[turn];
    if (isLoading) {
        return <div className="text-center p-8">リプレイを読み込み中...</div>;
    }

    if (!replay || !currentTurnData) {
        return <div className="text-center p-8">リプレイが見つかりません。</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold">リプレイ再生</h1>
                <p className="text-muted-foreground">{replay.player1LoginId} vs {replay.player2LoginId}</p>
                <p className="text-sm text-muted-foreground">{new Date(replay.createdAt.toDate()).toLocaleString()}</p>
            </div>

            {/* Battle Log */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>バトルログ</CardTitle>
                </CardHeader>
                <CardContent className="h-24 overflow-y-auto bg-secondary/30 p-2 rounded-lg text-sm">
                    {replay.history.slice(0, turn + 1).map((entry, index) => (
                         <p key={index} className={index === turn ? 'font-bold text-primary' : 'text-muted-foreground'}>
                            [{index+1}] {entry.log}
                         </p>
                    ))}
                </CardContent>
            </Card>

            {/* Battle View */}
            <div className="space-y-4">
                {/* Opponent (Player 2) */}
                <ReplayPlayerArea 
                    isOpponent
                    loginId={replay.player2LoginId}
                    health={currentTurnData.player2Health}
                    mana={currentTurnData.player2Mana}
                    maxMana={currentTurnData.player2MaxMana}
                    handCount={currentTurnData.player2Hand.length}
                    board={currentTurnData.player2Board}
                />
                
                {/* Player 1 */}
                 <ReplayPlayerArea 
                    loginId={replay.player1LoginId}
                    health={currentTurnData.player1Health}
                    mana={currentTurnData.player1Mana}
                    maxMana={currentTurnData.player1MaxMana}
                    hand={currentTurnData.player1Hand}
                    board={currentTurnData.player1Board}
                />
            </div>

            {/* Controls */}
            <div className="mt-6 flex flex-col items-center gap-4">
                <div className="w-full max-w-2xl flex items-center gap-4">
                    <span className="text-sm font-mono">{turn + 1}</span>
                    <Slider
                        min={0}
                        max={replay.history.length - 1}
                        step={1}
                        value={[turn]}
                        onValueChange={handleSliderChange}
                    />
                    <span className="text-sm font-mono">{replay.history.length}</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setTurn(0)} disabled={turn === 0}><SkipBack /></Button>
                    <Button size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setTurn(replay.history.length - 1)} disabled={turn === replay.history.length - 1}><SkipForward /></Button>
                </div>
            </div>
        </div>
    );
}

interface ReplayPlayerAreaProps {
  isOpponent?: boolean;
  loginId: string;
  health: number;
  mana: number;
  maxMana: number;
  handCount?: number;
  hand?: any[];
  board: any[];
}

function ReplayPlayerArea({ isOpponent, loginId, health, mana, maxMana, handCount, hand, board }: ReplayPlayerAreaProps) {
    return (
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                    {isOpponent ? <Bot /> : <User />}
                    {loginId}
                </CardTitle>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 text-xl font-bold"><Heart className="text-red-500 fill-red-500" /> {health}</div>
                    <div className="flex items-center gap-2 text-xl font-bold"><Sparkles className="text-blue-400 fill-blue-400" /> {mana}/{maxMana}</div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Hand /> 手札</h4>
                    <div className="flex gap-2 min-h-[8rem] bg-secondary/30 p-2 rounded-lg">
                        {hand ? hand.map((card, i) => (
                            <div key={i} className="w-24"><CardPreview {...card} /></div>
                        )) : (
                            Array.from({ length: handCount || 0 }).map((_, i) => (
                                <div key={i} className="w-24 h-36 bg-slate-600 rounded-lg border-2 border-slate-400"></div>
                            ))
                        )}
                    </div>
                </div>
                <div>
                     <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Swords /> 戦場</h4>
                     <div className="flex gap-2 min-h-[8rem] bg-primary/10 p-2 rounded-lg">
                        {board.map((card, i) => (
                            <div key={i} className="w-24"><CardPreview {...card} /></div>
                        ))}
                     </div>
                </div>
            </CardContent>
        </Card>
    )
}
