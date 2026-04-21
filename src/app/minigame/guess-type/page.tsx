
'use client';

import { useState, useEffect } from 'react';
import type { CardData, CardType } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateDeckClient } from '@/lib/generate-deck-client';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

const REWARD_PER_CORRECT = 50;
const cardTypeJapanese: Record<CardType, string> = {
    creature: 'クリーチャー',
    spell: '呪文',
    artifact: 'アーティファクト',
    land: '土地',
};
const GUESS_OPTIONS: CardType[] = ['creature', 'spell', 'artifact'];

export default function GuessTypePage() {
    const [card, setCard] = useState<CardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRevealed, setIsRevealed] = useState(false);
    const { toast } = useToast();
    const { addCurrency } = useCurrency();

    const generateNewQuestion = async () => {
        setIsLoading(true);
        setIsRevealed(false);
        try {
            const result = await generateDeckClient({ theme: 'なんでも', cardCount: 1 });
            const newCard = {
                ...result.deck[0], 
                id: self.crypto.randomUUID(), 
                imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`
            } as CardData;
            // Ensure the generated card type is one of the guessable options
            if (!GUESS_OPTIONS.includes(newCard.cardType)) {
                generateNewQuestion(); // Recursively call until a valid card is generated
                return;
            }
            setCard(newCard);

        } catch (error) {
            toast({ variant: 'destructive', title: '問題の生成に失敗しました。'});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        generateNewQuestion();
    }, []);

    const handleGuess = (guess: CardType) => {
        if (!card) return;
        setIsRevealed(true);

        if (guess === card.cardType) {
            addCurrency(REWARD_PER_CORRECT);
            toast({
                title: '正解！',
                description: `素晴らしい！ ${REWARD_PER_CORRECT}G を獲得しました！`
            });
        } else {
            toast({
                variant: 'destructive',
                title: '残念！',
                description: `正解は「${cardTypeJapanese[card.cardType]}」でした。`
            });
        }
        
        setTimeout(() => {
            generateNewQuestion();
        }, 2000);
    };

    if (isLoading || !card) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-10 w-10" /> <p className="ml-4">問題を生成中...</p></div>;
    }
    
    // Card without card type for preview
    const previewCard = { ...card, cardType: '???' as any };


    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold">種族当てクイズ！</h1>
            <p className="text-muted-foreground mt-2">このカードの種族（タイプ）は何？</p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-8 my-8">
                <div className="w-72">
                    <CardPreview {...(isRevealed ? card : previewCard)} />
                </div>
                
                <div className="flex flex-col gap-3 w-48">
                    {GUESS_OPTIONS.map(option => (
                        <Button 
                            key={option} 
                            onClick={() => handleGuess(option)}
                            disabled={isRevealed}
                            size="lg"
                            variant={isRevealed ? (option === card.cardType ? 'default' : 'destructive') : 'outline'}
                        >
                            {cardTypeJapanese[option]}
                        </Button>
                    ))}
                </div>
            </div>
             <Button onClick={generateNewQuestion} disabled={isLoading}>次の問題へ</Button>
        </div>
    );
}
