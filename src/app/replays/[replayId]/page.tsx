'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { GameHistoryEntry } from '@/lib/replay-actions';

type ReplayData = {
    player1LoginId: string;
    player2LoginId: string;
    winnerId: string;
    history: GameHistoryEntry[];
    createdAt: any;
};

export default function ReplayPage({ params }: { params: { replayId: string } }) {
    const [replay, setReplay] = useState<ReplayData | null>(null);
    const [loading, setLoading] = useState(true);
    const { firestore } = initializeFirebase();

    useEffect(() => {
        if (!params.replayId) return;

        const fetchReplay = async () => {
            setLoading(true);
            const replayRef = doc(firestore, 'replays', params.replayId);
            const replaySnap = await getDoc(replayRef);

            if (replaySnap.exists()) {
                setReplay(replaySnap.data() as ReplayData);
            } else {
                console.error("No such document!");
            }
            setLoading(false);
        };

        fetchReplay();
    }, [params.replayId, firestore]);

    if (loading) {
        return <div>Loading replay...</div>;
    }

    if (!replay) {
        return <div>Replay not found.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">
                Replay: {replay.player1LoginId} vs {replay.player2LoginId}
            </h1>
            <div className="text-muted-foreground mb-6">
                Winner: {replay.winnerId === 'AI' ? replay.player2LoginId : replay.player1LoginId}
            </div>
            <div className="space-y-4">
                {replay.history.map((entry, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                        <p className="font-semibold">{entry.log}</p>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                                <p>Player 1 Health: {entry.player1Health}</p>
                                <p>Player 1 Mana: {entry.player1Mana}/{entry.player1MaxMana}</p>
                            </div>
                            <div>
                                <p>Player 2 Health: {entry.player2Health}</p>
                                <p>Player 2 Mana: {entry.player2Mana}/{entry.player2MaxMana}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
