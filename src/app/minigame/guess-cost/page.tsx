
'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateDeck } from '@/ai/flows/generate-deck';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

const REWARD_PER_CORRECT = 50;
const GUESS_OPTIONS = 5;

export default function GuessCostPage() {
    const [card, setCard] = useState<CardData | null>(null);
    const [options, setOptions] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRevealed, setIsRevealed] = useState(false);
    const { toast } = useToast();
    const { addCurrency } = useCurrency();

    const generateNewQuestion = async () => {
        setIsLoading(true);
        setIsRevealed(false);
        try {
            const result = await generateDeck({ theme: 'なんでも', cardCount: 1 });
            const newCard = {
                ...result.deck[0], 
                id: self.crypto.randomUUID(), 
                imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`
            } as CardData;
            setCard(newCard);

            const correctCost = newCard.manaCost;
            const incorrectOptions = new Set<number>();
            while (incorrectOptions.size < GUESS_OPTIONS - 1) {
                const randomCost = Math.max(0, Math.min(10, correctCost + Math.floor(Math.random() * 5) - 2));
                if (randomCost !== correctCost) {
                    incorrectOptions.add(randomCost);
                }
            }
            const shuffledOptions = [...incorrectOptions, correctCost].sort(() => Math.random() - 0.5);
            setOptions(shuffledOptions);

        } catch (error) {
            toast({ variant: 'destructive', title: '問題の生成に失敗しました。'});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        generateNewQuestion();
    }, []);

    const handleGuess = (guess: number) => {
        if (!card) return;
        setIsRevealed(true);

        if (guess === card.manaCost) {
            addCurrency(REWARD_PER_CORRECT);
            toast({
                title: '正解！',
                description: `素晴らしい！ ${REWARD_PER_CORRECT}G を獲得しました！`
            });
        } else {
            toast({
                variant: 'destructive',
                title: '残念！',
                description: `正解は ${card.manaCost} でした。`
            });
        }
        
        setTimeout(() => {
            generateNewQuestion();
        }, 2000);
    };

    if (isLoading || !card) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-10 w-10" /> <p className="ml-4">問題を生成中...</p></div>;
    }
    
    // Card without mana cost for preview
    const previewCard = { ...card, manaCost: '?' as any };


    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold">マナ当てクイズ！</h1>
            <p className="text-muted-foreground mt-2">このカードのマナコストはいくつ？</p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-8 my-8">
                <div className="w-72">
                    <CardPreview {...(isRevealed ? card : previewCard)} />
                </div>
                
                <div className="flex flex-col gap-3 w-48">
                    {options.map(option => (
                        <Button 
                            key={option} 
                            onClick={() => handleGuess(option)}
                            disabled={isRevealed}
                            size="lg"
                            variant={isRevealed ? (option === card.manaCost ? 'default' : 'destructive') : 'outline'}
                        >
                            {option}
                        </Button>
                    ))}
                </div>
            </div>
             <Button onClick={generateNewQuestion}>次の問題へ</Button>
        </div>
    );
}
