

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
import { Coins, HelpCircle, Shuffle, ArrowDown, ArrowUp, Brain, Repeat, Lightbulb } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils';

import { goblinDeck, elementalDeck, undeadDeck, dragonDeck, ninjaDeck } from '@/lib/decks';

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
const MAX_ATTEMPTS_STATS_QUIZ = 5;
const MAX_ATTEMPTS_THEME_QUIZ = 10;
const HINT_COST = 3;

// --- Stats Quiz Game ---
function StatsQuizGame() {
    const { addCurrency } = useCurrency();
    const { toast } = useToast();
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [quizTarget, setQuizTarget] = useState<QuizTarget | null>(null);
    const [guess, setGuess] = useState('');
    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
    const [attempts, setAttempts] = useState(MAX_ATTEMPTS_STATS_QUIZ);
    const [showAnswer, setShowAnswer] = useState(false);

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
        setAttempts(MAX_ATTEMPTS_STATS_QUIZ);
        setShowAnswer(false);
    };

    useEffect(() => {
        startNewGame();
    }, []);

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

    if (!currentCard) return null;

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
    const { spendCurrency, addCurrency } = useCurrency();
    const { toast } = useToast();
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [correctTheme, setCorrectTheme] = useState<DeckThemeKey | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [attempts, setAttempts] = useState(MAX_ATTEMPTS_THEME_QUIZ);
    const [hintLevel, setHintLevel] = useState(0); // 0: none, 1: flavor, 2: abilities, 3: name, 4: image

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
            setAttempts(MAX_ATTEMPTS_THEME_QUIZ);
            setHintLevel(0);
        } else {
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
            setShowAnswer(true);
        } else {
            setAttempts(prev => prev - 1);
            if (attempts - 1 <= 0) {
                 toast({ variant: 'destructive', title: '残念！', description: `正解は「${correctTheme ? DECK_THEMES[correctTheme] : ''}」でした。` });
                 setShowAnswer(true);
            } else {
                 toast({ variant: 'destructive', title: '不正解！', description: `残り挑戦回数: ${attempts - 1}回` });
            }
        }
    };

    const showHint = () => {
        if (hintLevel >= 4 || !currentCard) return;
        if (spendCurrency(HINT_COST)) {
            setHintLevel(prev => prev + 1);
            toast({ title: 'ヒントを表示しました', description: `${HINT_COST}G を消費しました。`})
        } else {
            toast({ variant: 'destructive', title: 'Gコインが足りません！'})
        }
    };
    
    const ObscuredCardPreview = () => {
        if (!currentCard) return null;
        const cardToShow = {
            ...currentCard,
            flavorText: hintLevel >= 1 ? currentCard.flavorText : '？？？',
            abilities: hintLevel >= 2 ? currentCard.abilities : '？？？',
            name: hintLevel >= 3 ? currentCard.name : '？？？',
        };
        return (
            <div className={cn(hintLevel >= 4 ? '' : 'blur-sm pointer-events-none')}>
                <CardPreview {...cardToShow} />
            </div>
        );
    }

    if (!currentCard) return null;

    return (
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Brain className="text-primary" /> 問題</div>
                            <span className="text-sm font-normal text-muted-foreground">残り: {attempts}回</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">このカードが属しているスターターデッキのテーマは何？</p>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(DECK_THEMES) as DeckThemeKey[]).map(themeKey => (
                         <Button key={themeKey} onClick={() => handleGuess(themeKey)} size="lg" variant="outline" disabled={showAnswer || attempts <= 0} className="h-16 text-base">
                            {DECK_THEMES[themeKey]}
                        </Button>
                    ))}
                </div>
                 {!showAnswer && (
                    <Button onClick={showHint} disabled={hintLevel >= 4 || attempts <= 0}>
                        <Lightbulb className="mr-2" />ヒントを見る ({HINT_COST}G) {hintLevel > 0 && `(${hintLevel}/4)`}
                    </Button>
                 )}
                {showAnswer && (
                    <Button onClick={startNewGame} size="lg">次の問題へ</Button>
                )}
            </div>
            <div>
               {showAnswer ? <CardPreview {...currentCard} /> : <ObscuredCardPreview />}
            </div>
        </div>
    );
}


// --- Higher or Lower Game ---
const MAX_ROUNDS = 20;
const STREAK_BONUS_MULTIPLIER = 10;

function HigherLowerGame() {
    const { currency, addCurrency, spendCurrency } = useCurrency();
    const { toast } = useToast();
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);
    const [nextCard, setNextCard] = useState<CardData | null>(null);
    const [streak, setStreak] = useState(0);
    const [showNextCard, setShowNextCard] = useState(false);
    const [betAmount, setBetAmount] = useState(10);
    const [gameInProgress, setGameInProgress] = useState(false);
    const [round, setRound] = useState(1);
    const [gameOver, setGameOver] = useState(false);


    const startNewRound = () => {
        const card1 = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
        let card2 = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
        while (card1.id === card2.id) {
            card2 = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
        }
        setCurrentCard(card1);
        setNextCard(card2);
        setShowNextCard(false);
        setGameInProgress(false);
    };

    const resetGame = () => {
        startNewRound();
        setStreak(0);
        setRound(1);
        setGameOver(false);
    }

    useEffect(() => {
        resetGame();
    }, []);

    const handleGuess = (guess: 'higher' | 'lower') => {
        if (!currentCard || !nextCard || gameInProgress || gameOver) return;

        if (currency < betAmount) {
            toast({ variant: 'destructive', title: 'Gが足りません！', description: '賭け金を所持G以下に設定してください。' });
            return;
        }

        if (!spendCurrency(betAmount)) {
            toast({ variant: 'destructive', title: '賭け金の支払いに失敗しました。' });
            return;
        }
        
        setGameInProgress(true);
        const currentCost = currentCard.manaCost;
        const nextCost = nextCard.manaCost;

        let result: 'win' | 'loss' | 'draw' = 'loss';
        if (nextCost === currentCost) {
            result = 'draw';
        } else if (guess === 'higher' && nextCost > currentCost) {
            result = 'win';
        } else if (guess === 'lower' && nextCost < currentCost) {
            result = 'win';
        }

        setShowNextCard(true);

        setTimeout(() => {
            const nextRoundNumber = round + 1;
            
            if (result === 'win') {
                const newStreak = streak + 1;
                const reward = betAmount * 2;
                const bonus = newStreak * STREAK_BONUS_MULTIPLIER;
                const totalReward = reward + bonus;

                addCurrency(totalReward);
                setStreak(newStreak);
                toast({ 
                    title: `勝利！ (+${totalReward}G)`, 
                    description: `賭け金${reward}G + ${newStreak}連続正解ボーナス${bonus}G`
                });

                if (nextRoundNumber > MAX_ROUNDS) {
                    setGameOver(true);
                    toast({ title: 'ゲームクリア！', description: '20ラウンド達成しました。おめでとうございます！' });
                    return;
                }

                setRound(nextRoundNumber);
                setCurrentCard(nextCard);
                let newNextCard = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
                 while (nextCard.id === newNextCard.id) {
                    newNextCard = uniqueStarterCards[Math.floor(Math.random() * uniqueStarterCards.length)];
                }
                setNextCard(newNextCard);
                setShowNextCard(false);

            } else if (result === 'draw') {
                addCurrency(betAmount); // Refund
                toast({ title: '引き分け', description: `賭け金 ${betAmount}G が返金されました。` });
                
                if (nextRoundNumber > MAX_ROUNDS) {
                    setGameOver(true);
                    toast({ title: 'ゲーム終了', description: '20ラウンド経過しました。' });
                    return;
                }
                setRound(nextRoundNumber);
                startNewRound();

            } else { // loss
                toast({ variant: 'destructive', title: '敗北…', description: `賭け金 ${betAmount}G を失いました。連続正解記録: ${streak}` });
                setGameOver(true); // End game on loss
            }
            setGameInProgress(false);
        }, 2000); // Show result for 2 seconds
    };
    
    const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (isNaN(value)) {
            setBetAmount(0);
        } else if (value > currency) {
            setBetAmount(currency);
        } else {
            setBetAmount(value);
        }
    }
    
    if (gameOver) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
                 <h3 className="text-2xl font-bold">ゲーム終了</h3>
                 <p className="text-muted-foreground">最終記録: {streak} 連続正解</p>
                <Button onClick={resetGame} size="lg">
                    <Repeat className="mr-2" />
                    もう一度プレイする
                </Button>
            </div>
        )
    }

    if (!currentCard || !nextCard) return null;

    return (
        <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2">
                           <div className="flex items-center gap-2"><HelpCircle className="text-primary" /> 問題</div>
                           <span className="text-sm font-normal text-muted-foreground">ラウンド {round}/{MAX_ROUNDS}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg mb-2">次のカードのマナコストは、表示中のカードより高いか低いか？</p>
                        <p className="text-center text-muted-foreground">現在の連続正解: {streak} (ボーナス: {streak * STREAK_BONUS_MULTIPLIER}G)</p>
                    </CardContent>
                </Card>
                
                <div className="space-y-2">
                    <Label htmlFor="bet-input" className="text-lg">賭け金:</Label>
                    <div className="flex items-center gap-2">
                        <Coins className="h-6 w-6 text-yellow-500" />
                        <Input
                            id="bet-input"
                            type="number"
                            min="1"
                            max={currency}
                            value={betAmount}
                            onChange={handleBetChange}
                            className="text-lg h-12"
                            disabled={gameInProgress}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button onClick={() => handleGuess('higher')} size="lg" className="flex-1 h-20 bg-green-600 hover:bg-green-700" disabled={showNextCard || gameInProgress}>
                        <ArrowUp className="mr-2" /> 高い
                    </Button>
                    <Button onClick={() => handleGuess('lower')} size="lg" className="flex-1 h-20 bg-red-600 hover:bg-red-700" disabled={showNextCard || gameInProgress}>
                        <ArrowDown className="mr-2" /> 低い
                    </Button>
                </div>
                 <p className="text-sm text-center text-muted-foreground">（勝利で賭け金2倍＋ボーナス、引き分けで返金）</p>
            </div>
            <div className="flex justify-around items-center">
                {currentCard && <CardPreview {...currentCard} />}
                <div className="text-4xl font-bold mx-4">？</div>
                {nextCard && (
                    <div className={cn(showNextCard ? 'opacity-100' : 'opacity-0', 'transition-opacity duration-500')}>
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
