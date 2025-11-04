
'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateDeck } from '@/ai/flows/generate-deck';
import { Loader2, ArrowUp, ArrowDown, Repeat } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

const BASE_REWARD = 20;

export default function HighLowPage() {
    const [deck, setDeck] = useState<CardData[]>([]);
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [nextCard, setNextCard] = useState<CardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [gameState, setGameState] = useState<'playing' | 'result'>('playing');
    const [streak, setStreak] = useState(0);
    const { toast } = useToast();
    const { addCurrency } = useCurrency();

    const fetchNewDeck = async () => {
        setIsLoading(true);
        try {
            const result = await generateDeck({ theme: 'なんでも', cardCount: 30 });
            const newDeck = result.deck.map(c => ({...c, id: self.crypto.randomUUID(), imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`})) as CardData[];
            setDeck(newDeck);
            setCurrentCard(newDeck[0]);
            setNextCard(newDeck[1]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'デッキの準備に失敗しました。'});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNewDeck();
    }, []);

    const handleGuess = (guess: 'high' | 'low') => {
        if (!currentCard || !nextCard) return;

        const currentCost = currentCard.manaCost;
        const nextCost = nextCard.manaCost;
        let correct = false;

        if (guess === 'high' && nextCost >= currentCost) {
            correct = true;
        } else if (guess === 'low' && nextCost <= currentCost) {
            correct = true;
        }

        if (correct) {
            const newStreak = streak + 1;
            const reward = BASE_REWARD * newStreak;
            setStreak(newStreak);
            addCurrency(reward);
            toast({
                title: '正解！',
                description: `連続${newStreak}回正解！ ${reward}G を獲得！`
            });
            
            const nextIndex = deck.indexOf(nextCard) + 1;
            if (nextIndex < deck.length) {
                setCurrentCard(nextCard);
                setNextCard(deck[nextIndex]);
            } else {
                toast({ title: 'デッキを使い切りました！新しいデッキを準備します。'});
                fetchNewDeck();
            }

        } else {
            toast({
                variant: 'destructive',
                title: '残念！',
                description: `正解は ${nextCost} でした。連続記録は ${streak} でストップ。`
            });
            setStreak(0);
            const nextIndex = deck.indexOf(nextCard) + 1;
             if (nextIndex < deck.length) {
                setCurrentCard(nextCard);
                setNextCard(deck[nextIndex]);
            } else {
                fetchNewDeck();
            }
        }
    };
    
    if (isLoading || !currentCard) {
         return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-10 w-10" /> <p className="ml-4">ゲームを準備中...</p></div>;
    }

    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold">ハイ＆ロー</h1>
            <p className="text-muted-foreground mt-2">次のカードのマナコストは、現在のカードより高いか低いか？</p>
            
            <div className="flex justify-center items-center gap-4 my-6">
                 <p className="text-xl font-bold">連続正解: <span className="text-primary">{streak}</span></p>
                 <Button onClick={fetchNewDeck} variant="outline" size="icon"><Repeat /></Button>
            </div>

            <div className="flex justify-center items-center gap-8">
                <div className="w-64">
                    <p className="font-bold mb-2">現在のカード</p>
                    <CardPreview {...currentCard} />
                </div>
                
                <div className="flex flex-col gap-4">
                    <Button onClick={() => handleGuess('high')} size="lg" className="bg-red-500 hover:bg-red-600">
                        <ArrowUp className="mr-2"/>
                        ハイ
                    </Button>
                     <p className="text-2xl font-bold">OR</p>
                     <Button onClick={() => handleGuess('low')} size="lg" className="bg-blue-500 hover:bg-blue-600">
                        <ArrowDown className="mr-2"/>
                        ロー
                    </Button>
                </div>

                 <div className="w-64">
                    <p className="font-bold mb-2">次のカード</p>
                    <div className="w-full aspect-[3/4] bg-secondary rounded-2xl flex items-center justify-center text-6xl font-bold text-muted-foreground">?</div>
                </div>
            </div>
        </div>
    );
}
