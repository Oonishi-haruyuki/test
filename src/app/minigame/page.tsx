'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateDeck } from '@/ai/flows/generate-deck';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/use-currency';

const BOARD_SIZE = 12; // Must be an even number
const REWARD_PER_PAIR = 25;

export default function MinigamePage() {
    const [cards, setCards] = useState<CardData[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [matched, setMatched] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChecking, setIsChecking] = useState(false);
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const { toast } = useToast();
    const { addCurrency } = useCurrency();

    const cardBackImage = 'https://storage.googleapis.com/card-crafter-studio.appspot.com/backs/back_default.png';


    const initializeGame = async () => {
        setIsLoading(true);
        setFlipped([]);
        setMatched([]);
        setMoves(0);
        setGameOver(false);
        try {
            const result = await generateDeck({ theme: '動物', cardCount: BOARD_SIZE / 2 });
            const gameCards = result.deck.map((c, i) => ({...c, id: `mg-${i}`, imageUrl: `https://picsum.photos/seed/mg${i}/400/300`}));
            const duplicated = [...gameCards, ...gameCards];
            const shuffled = duplicated.sort(() => Math.random() - 0.5).map((card, index) => ({...card, uniqueId: `${card.id}-${index}`}));
            setCards(shuffled as (CardData & {uniqueId: string})[]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'ゲームの準備に失敗しました。'});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        initializeGame();
    }, []);

    useEffect(() => {
        if (flipped.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flipped;
            if (cards[firstIndex].id === cards[secondIndex].id) {
                setMatched(prev => [...prev, cards[firstIndex].id!]);
            }
            setTimeout(() => {
                setFlipped([]);
                setIsChecking(false);
            }, 1000);
        }
    }, [flipped, cards]);

    useEffect(() => {
        if (matched.length === BOARD_SIZE / 2 && cards.length > 0) {
            setGameOver(true);
            const reward = matched.length * REWARD_PER_PAIR;
            addCurrency(reward);
            toast({
                title: 'クリア！',
                description: `報酬として ${reward}G を獲得しました！`
            });
        }
    }, [matched, cards]);

    const handleCardClick = (index: number) => {
        if (isChecking || flipped.includes(index) || matched.includes(cards[index].id!)) {
            return;
        }
        if (flipped.length < 2) {
            setFlipped(prev => [...prev, index]);
            if (flipped.length === 0) { // This is the first card of a new move
                 setMoves(m => m + 1);
            }
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-10 w-10" /> <p className="ml-4">ミニゲームを準備中...</p></div>;
    }

    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold">カード神経衰弱</h1>
            <p className="text-muted-foreground mt-2">同じ絵柄のカードを揃えてGコインをゲットしよう！</p>

            <div className="flex justify-between items-center my-6 max-w-lg mx-auto">
                 <p className="text-xl font-bold">手数: {moves}</p>
                 <Button onClick={initializeGame} variant="outline" size="icon"><RefreshCw /></Button>
                 <p className="text-xl font-bold">ペア: {matched.length} / {BOARD_SIZE/2}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto">
                {cards.map((card, index) => (
                    <div key={(card as any).uniqueId} className="perspective-[1000px]" onClick={() => handleCardClick(index)}>
                        <div
                            className={cn(
                                "relative w-full aspect-[3/4] transition-transform duration-500 preserve-3d cursor-pointer",
                                (flipped.includes(index) || matched.includes(card.id!)) && "rotate-y-180"
                            )}
                        >
                            <div className="absolute w-full h-full backface-hidden">
                                <img src={cardBackImage} alt="Card Back" className="w-full h-full object-cover rounded-lg border-2 border-primary/50" />
                            </div>
                            <div className="absolute w-full h-full backface-hidden rotate-y-180">
                                <Card className={cn("w-full h-full", matched.includes(card.id!) ? 'border-green-500 border-4' : 'border-primary border-2')}>
                                    <CardContent className="p-1 h-full w-full">
                                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover rounded-md"/>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {gameOver && (
                <div className="mt-8">
                     <p className="text-2xl font-bold text-green-500">ゲームクリア！</p>
                     <Button onClick={initializeGame} className="mt-4">もう一度プレイ</Button>
                </div>
            )}
        </div>
    );
}

// Add these utility classes to globals.css if they don't exist
/*
.perspective-1000 { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
*/
