
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
import { Coins, HelpCircle, Shuffle, ArrowDown, ArrowUp, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { goblinDeck, elementalDeck, undeadDeck, dragonDeck, ninjaDeck } from '@/app/battle/page';

const allStarterCards = [...goblinDeck, ...elementalDeck, ...undeadDeck, ...dragonDeck, ...ninjaDeck];
const uniqueStarterCards = Array.from(new Map(allStarterCards.map(card => [card.id, card])).values());

type QuizTarget = 'manaCost' | 'attack' | 'defense';

const QUIZ_TARGET_JAPANESE: Record<QuizTarget, string> = {
    manaCost: 'マナコスト',
    attack: '攻撃力',
    defense: '防御力',
};

const DECK_THEMES = {
    'starter-goblin': 'ゴブリン軍団',
    'starter-elemental': 'エレメンタル召喚',
    'starter-undead': 'アンデッド軍団',
    'starter-dragon': 'ドラゴンズ・ホード',
    'starter-ninja': 'ニンジャ一族',
};
type DeckThemeKey = keyof typeof DECK_THEMES;

const REWARD_AMOUNT = 10;
const MAX_ATTEMPTS = 5;

// --- Stats Quiz Game ---
function StatsQuizGame() {
    const { addCurrency } = useCurrency();
    const { toast } = useToast();
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [quizTarget, setQuizTarget] = useState<QuizTarget | null>(null);
    const [guess, setGuess] = useState('');
    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
    const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
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
                description: <div className="flex items-center gap-2"><Coins className="h-5 w-5 text-yellow-500" /><span>{REWARD_AMOUNT}G を獲得！</span></div>
            });
            setShowAnswer(true);
        } else {
            setResult('incorrect');
            setAttempts(prev => prev - 1);
            if (attempts - 1 <= 0) {
                toast({ variant: 'destructive', title: '残念！', description: `正解は ${correctAnswer} でした。` });
                setShowAnswer(true);
            } else {
                 toast({ variant: 'destructive', title: '不正解！', description: `残り挑戦回数: ${attempts - 1}回` });
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
        return <CardPreview {...cardToShow as any} />;
    }

    return (
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="text-primary" /> 問題
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
                        id="guess-input" type="number" min="0" value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="数値を入力..." className="text-lg h-12" disabled={showAnswer}
                    />
                </div>

                 {showAnswer ? (
                    <Button onClick={startNewGame} size="lg">次の問題へ</Button>
                ) : (
                    <Button onClick={handleGuess} size="lg" disabled={!guess}>回答する (残り: {attempts}回)</Button>
                )}
            </div>
             <div>
                {currentCard && (
                     <div className={showAnswer ? '' : 'blur-sm pointer-events-none'}>
                        {showAnswer ? <CardPreview {...currentCard} /> : <BlurredCardPreview />}
                     </div>
                )}
             </div>
        </div>
    );
}

// --- Theme Quiz Game ---
function ThemeQuizGame() {
    const { addCurrency } = useCurrency();
    const { toast } = useToast();
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [correctTheme, setCorrectTheme] = useState<DeckThemeKey | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);

    const getThemeFromCardId = (cardId: string): DeckThemeKey | null => {
        for (const key in DECK_THEMES) {
            if (cardId.startsWith(key)) {
                return key as DeckThemeKey;
            }
        }
        return null;
    }

    const startNewGame = () => {
        const randomCard = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
        const theme = getThemeFromCardId(randomCard.id || '');
        
        if (theme) {
            setCurrentCard(randomCard);
            setCorrectTheme(theme);
            setShowAnswer(false);
        } else {
            // If for some reason a card without a valid theme ID is found, retry
            startNewGame();
        }
    };

    useEffect(() => {
        startNewGame();
    }, []);

    const handleGuess = (guess: DeckThemeKey) => {
        if (showAnswer) return;

        if (guess === correctTheme) {
            addCurrency(REWARD_AMOUNT);
            toast({ title: '正解！', description: <div className="flex items-center gap-2"><Coins className="h-5 w-5 text-yellow-500" /><span>{REWARD_AMOUNT}G を獲得！</span></div> });
        } else {
            toast({ variant: 'destructive', title: '残念！', description: `正解は「${correctTheme ? DECK_THEMES[correctTheme] : ''}」でした。` });
        }
        setShowAnswer(true);
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="text-primary" /> 問題</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-lg">このカードが属しているスターターデッキのテーマは何？</p>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(DECK_THEMES) as DeckThemeKey[]).map(themeKey => (
                         <Button key={themeKey} onClick={() => handleGuess(themeKey)} size="lg" variant="outline" disabled={showAnswer} className="h-16 text-base">
                            {DECK_THEMES[themeKey]}
                        </Button>
                    ))}
                </div>
                {showAnswer && (
                    <Button onClick={startNewGame} size="lg">次の問題へ</Button>
                )}
            </div>
            <div>
                {currentCard && <CardPreview {...currentCard} />}
            </div>
        </div>
    );
}

// --- Higher or Lower Game ---
function HigherLowerGame() {
    const { addCurrency } = useCurrency();
    const { toast } = useToast();
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [nextCard, setNextCard] = useState<CardData | null>(null);
    const [streak, setStreak] = useState(0);
    const [showNextCard, setShowNextCard] = useState(false);

    const startNewGame = () => {
        const card1 = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
        let card2 = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
        while (card1.id === card2.id) { // Ensure they are not the same card
            card2 = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
        }
        setCurrentCard(card1);
        setNextCard(card2);
        setShowNextCard(false);
    };

    useEffect(() => {
        startNewGame();
    }, []);

    const handleGuess = (guess: 'higher' | 'lower') => {
        if (!currentCard || !nextCard) return;
        
        const currentCost = currentCard.manaCost;
        const nextCost = nextCard.manaCost;

        let isCorrect = false;
        if (guess === 'higher' && nextCost > currentCost) isCorrect = true;
        if (guess === 'lower' && nextCost < currentCost) isCorrect = true;
        if (nextCost === currentCost) isCorrect = true; // Draw is a win

        setShowNextCard(true);

        setTimeout(() => {
            if (isCorrect) {
                const reward = REWARD_AMOUNT + streak * 2;
                addCurrency(reward);
                setStreak(prev => prev + 1);
                toast({ title: '正解！', description: <div className="flex items-center gap-2"><Coins className="h-5 w-5 text-yellow-500" /><span>{reward}G を獲得！</span></div> });
                setCurrentCard(nextCard); // The next card becomes the current card
                let newNextCard = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
                 while (nextCard.id === newNextCard.id) {
                    newNextCard = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
                }
                setNextCard(newNextCard);
                setShowNextCard(false);

            } else {
                toast({ variant: 'destructive', title: '残念！', description: `正解は ${nextCost} でした。連続正解記録: ${streak}` });
                setStreak(0);
                startNewGame();
            }
        }, 2000); // Show result for 2 seconds
    };
    
    return (
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="text-primary" /> 問題</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-lg mb-2">次のカードのマナコストは、このカードより...</p>
                        <p className="text-center text-muted-foreground">現在の連続正解: {streak}</p>
                    </CardContent>
                </Card>
                <div className="flex gap-4">
                    <Button onClick={() => handleGuess('higher')} size="lg" className="flex-1 h-20 bg-green-600 hover:bg-green-700" disabled={showNextCard}>
                        <ArrowUp className="mr-2" /> 高い
                    </Button>
                    <Button onClick={() => handleGuess('lower')} size="lg" className="flex-1 h-20 bg-red-600 hover:bg-red-700" disabled={showNextCard}>
                        <ArrowDown className="mr-2" /> 低い
                    </Button>
                </div>
                 <p className="text-sm text-center text-muted-foreground">（同じ場合は正解になります）</p>
            </div>
            <div className="flex justify-around items-center">
                {currentCard && <CardPreview {...currentCard} />}
                <div className="text-4xl font-bold mx-4">？</div>
                {nextCard && (
                    <div className={showNextCard ? '' : 'blur-xl'}>
                        <CardPreview {...nextCard} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MiniGamePage() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);
    if (!isClient) return null;

    return (
        <main className="container mx-auto">
            <Card className="max-w-5xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl">ミニゲームセンター</CardTitle>
                    <CardDescription>ミニゲームをクリアしてGコインを稼ごう！</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="stats-quiz">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="stats-quiz">能力値当て</TabsTrigger>
                            <TabsTrigger value="theme-quiz">テーマ当て</TabsTrigger>
                            <TabsTrigger value="higher-lower">ハイ＆ロー</TabsTrigger>
                        </TabsList>
                        <TabsContent value="stats-quiz" className="pt-6">
                            <StatsQuizGame />
                        </TabsContent>
                        <TabsContent value="theme-quiz" className="pt-6">
                            <ThemeQuizGame />
                        </TabsContent>
                        <TabsContent value="higher-lower" className="pt-6">
                            <HigherLowerGame />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    );
}
