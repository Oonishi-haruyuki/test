
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateDeck } from '@/ai/flows/generate-deck';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const DRAFT_PACK_SIZE = 10;
const TOTAL_ROUNDS = 3;

export default function DraftPage() {
    const [draftState, setDraftState] = useState<'initial' | 'drafting' | 'finished'>('initial');
    const [round, setRound] = useState(1);
    const [currentPack, setCurrentPack] = useState<CardData[]>([]);
    const [pickedCards, setPickedCards] = useState<CardData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const startDraft = async () => {
        setIsLoading(true);
        setPickedCards([]);
        setRound(1);
        try {
            const result = await generateDeck({ theme: 'ランダム', cardCount: DRAFT_PACK_SIZE });
            const pack = result.deck.map(c => ({...c, id: self.crypto.randomUUID(), imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`})) as CardData[];
            setCurrentPack(pack);
            setDraftState('drafting');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'ドラフトの開始に失敗しました。'});
        } finally {
            setIsLoading(false);
        }
    };

    const pickCard = async (card: CardData) => {
        if (currentPack.length <= 1) { // Last card of the pack
            const finalPicks = [...pickedCards, card];
            setPickedCards(finalPicks);

            if (round >= TOTAL_ROUNDS) {
                setDraftState('finished');
                toast({ title: 'ドラフト完了！', description: 'デッキ構築ページで確認・保存できます。' });
                 try {
                    const savedDecks = JSON.parse(localStorage.getItem('cardDecks') || '[]');
                    const newDeck = {
                        id: `draft-${Date.now()}`,
                        name: `ドラフトデッキ (${new Date().toLocaleDateString()})`,
                        cards: finalPicks,
                    };
                    localStorage.setItem('cardDecks', JSON.stringify([...savedDecks, newDeck]));
                } catch (e) {
                    toast({ variant: 'destructive', title: 'デッキの自動保存に失敗しました。'});
                }

                return;
            }
            // Start next round
            setIsLoading(true);
            setRound(r => r + 1);
            try {
                const result = await generateDeck({ theme: 'ランダム', cardCount: DRAFT_PACK_SIZE });
                 const pack = result.deck.map(c => ({...c, id: self.crypto.randomUUID(), imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`})) as CardData[];
                setCurrentPack(pack);
            } catch (error) {
                 toast({ variant: 'destructive', title: `ラウンド ${round + 1} の開始に失敗しました。`});
            } finally {
                setIsLoading(false);
            }

        } else {
            const newPack = currentPack.filter(c => c.id !== card.id);
            // Simulate AI picking a card
            newPack.splice(Math.floor(Math.random() * newPack.length), 1);
            
            setPickedCards(prev => [...prev, card]);
            setCurrentPack(newPack);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-10 w-10" /></div>;
    }

    if (draftState === 'finished') {
        return (
            <div className="text-center">
                <h1 className="text-3xl font-bold">ドラフト完了！</h1>
                <p className="text-muted-foreground mt-2">構築したデッキは「デッキ構築」ページに保存されています。</p>
                <div className="max-w-4xl mx-auto mt-8">
                    <h2 className="text-xl font-semibold mb-4">あなたがピックしたカード ({pickedCards.length}枚)</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {pickedCards.map(card => <CardPreview key={card.id} {...card} />)}
                    </div>
                </div>
                <Button className="mt-8" onClick={() => setDraftState('initial')}>もう一度ドラフトする</Button>
            </div>
        );
    }
    
    if (draftState === 'drafting') {
         return (
             <div>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">ラウンド {round} / {TOTAL_ROUNDS}</h1>
                    <div className="text-right">
                        <p className="font-semibold">ピックしたカード</p>
                        <p>{pickedCards.length} 枚</p>
                    </div>
                </div>
                <Alert className="mb-6">
                    <AlertTitle>カードを1枚選択してください</AlertTitle>
                    <AlertDescription>
                        提示されたカードの中から1枚を選んでピックします。残りのカードは他のプレイヤー（AI）に渡されます。
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {currentPack.map(card => (
                        <div key={card.id} className="cursor-pointer transition-transform hover:scale-105" onClick={() => pickCard(card)}>
                            <CardPreview {...card} />
                        </div>
                    ))}
                </div>
             </div>
        )
    }

    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold">ドラフト</h1>
            <p className="text-muted-foreground mt-2">ランダムに提示されるカードをピックして、即席のデッキを構築して戦うモードです。</p>
            <Button className="mt-8" size="lg" onClick={startDraft}>
                ドラフトを開始
            </Button>
        </div>
    );
}
