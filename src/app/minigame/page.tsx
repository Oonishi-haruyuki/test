
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Coins, HelpCircle } from 'lucide-react';

// We can use the existing starter decks as a source for the mini-game
import { goblinDeck, elementalDeck, undeadDeck, dragonDeck, ninjaDeck } from '@/app/battle/page';

const allStarterCards = [...goblinDeck, ...elementalDeck, ...undeadDeck, ...dragonDeck, ...ninjaDeck];
const uniqueStarterCards = Array.from(new Map(allStarterCards.map(card => [card.name, card])).values());

type QuizTarget = 'manaCost' | 'attack' | 'defense';

const QUIZ_TARGET_JAPANESE: Record<QuizTarget, string> = {
    manaCost: 'マナコスト',
    attack: '攻撃力',
    defense: '防御力',
};

const REWARD_AMOUNT = 10;
const MAX_ATTEMPTS = 3;

export default function MiniGamePage() {
    const { addCurrency } = useCurrency();
    const { toast } = useToast();
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [quizTarget, setQuizTarget] = useState<QuizTarget | null>(null);
    const [guess, setGuess] = useState('');
    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
    const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        startNewGame();
    }, []);

    const startNewGame = () => {
        const randomCard = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
        const possibleTargets: QuizTarget[] = ['manaCost'];
        if (randomCard.cardType === 'creature') {
            possibleTargets.push('attack', 'defense');
        }
        const randomTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

        setCurrentCard(randomCard);
        setQuizTarget(randomTarget);
        setGuess('');
        setResult(null);
        setAttempts(MAX_ATTEMPTS);
        setShowAnswer(false);
    };

    const handleGuess = () => {
        if (!currentCard || !quizTarget) return;

        const correctAnswer = currentCard[quizTarget];
        if (parseInt(guess, 10) === correctAnswer) {
            setResult('correct');
            addCurrency(REWARD_AMOUNT);
            toast({
                title: '正解！',
                description: (
                    <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <span>{REWARD_AMOUNT}G を獲得しました！</span>
                    </div>
                )
            });
            setShowAnswer(true);
        } else {
            setResult('incorrect');
            setAttempts(prev => prev - 1);
            if (attempts - 1 <= 0) {
                toast({
                    variant: 'destructive',
                    title: '残念！',
                    description: `正解は ${correctAnswer} でした。`,
                });
                setShowAnswer(true);
            } else {
                 toast({
                    variant: 'destructive',
                    title: '不正解！',
                    description: `残り挑戦回数: ${attempts - 1}回`,
                });
            }
        }
    };
    
    const BlurredCardPreview = () => {
        if (!currentCard) return null;
        const cardToShow = {
            ...currentCard,
            name: '？？？',
            manaCost: quizTarget === 'manaCost' ? '？' : currentCard.manaCost,
            attack: quizTarget === 'attack' ? '？' : currentCard.attack,
            defense: quizTarget === 'defense' ? '？' : currentCard.defense,
            abilities: '？？？',
            flavorText: '？？？',
        };
        // This is a trick to display '?' instead of a number
        return <CardPreview {...cardToShow as any} />;
    }

    if (!isClient) return null;

    return (
        <main className="container mx-auto">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl">カード能力値当てゲーム</CardTitle>
                    <CardDescription>カードの能力値を当ててGコインを稼ごう！ 正解すると {REWARD_AMOUNT}G をゲットできます。</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HelpCircle className="text-primary" />
                                    問題
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg">
                                    このカードの <span className="font-bold text-primary text-xl">{quizTarget ? QUIZ_TARGET_JAPANESE[quizTarget] : ''}</span> はいくつ？
                                </p>
                            </CardContent>
                        </Card>
                       
                        <div className="space-y-2">
                            <Label htmlFor="guess-input" className="text-lg">あなたの回答:</Label>
                            <Input 
                                id="guess-input"
                                type="number"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                placeholder="数値を入力..."
                                className="text-lg h-12"
                                disabled={showAnswer}
                            />
                        </div>

                         {showAnswer ? (
                            <Button onClick={startNewGame} size="lg">
                                次の問題へ
                            </Button>
                        ) : (
                            <Button onClick={handleGuess} size="lg" disabled={!guess}>
                                回答する (残り: {attempts}回)
                            </Button>
                        )}
                    </div>
                     <div>
                        {currentCard && (
                             <div className={showAnswer ? '' : 'blur-sm pointer-events-none'}>
                                {showAnswer ? <CardPreview {...currentCard} /> : <BlurredCardPreview />}
                             </div>
                        )}
                     </div>
                </CardContent>
            </Card>
        </main>
    );
}
