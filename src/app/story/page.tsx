
'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { elementalDeck, goblinDeck } from '@/app/battle/page';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import BattlePage from '@/app/battle/page';
import { useUser } from '@/firebase';
import { useInventory } from '@/hooks/use-inventory';

interface StoryChapter {
    id: string;
    title: string;
    prologue: string;
    battle?: {
        playerDeck: CardData[];
        opponentName: string;
        opponentDeck: CardData[];
        reward: {
            g: number;
            items?: Record<string, number>;
        }
    }
}

const storyContent: StoryChapter[] = [
    {
        id: 'chapter-1',
        title: '第1章: 目覚めとゴブリンの森',
        prologue: 'あなたは不思議な力に導かれ、カードがすべての世界「アルカディア」に召喚されたカードクラフター。...\n\nあなたの目の前には、いたずら好きで厄介なゴブリンたちがうごめく森が広がっている。\n\n森を抜けるには、彼らのリーダーをカードバトルで打ち負かすしかないようだ。\n\n与えられた基本のエレメンタルデッキを手に、最初の戦いに挑もう。',
        battle: {
            playerDeck: elementalDeck,
            opponentName: 'ゴブリンリーダー',
            opponentDeck: goblinDeck,
            reward: {
                g: 200,
                items: { 'dragon-soul': 1 }
            },
        }
    },
    {
        id: 'chapter-2',
        title: '第2章: (近日公開)',
        prologue: 'ゴブリンたちとの戦いを経て、あなたは新たな仲間と出会う...。次なる冒険があなたを待っている。',
    }
];

export default function StoryModePage() {
    const { user } = useUser();
    const { addCurrency } = useCurrency();
    const { addItem } = useInventory();
    const { toast } = useToast();

    const [isClient, setIsClient] = useState(false);
    const [clearedChapters, setClearedChapters] = useState<string[]>([]);
    const [activeChapter, setActiveChapter] = useState<StoryChapter | null>(null);
    const [inBattle, setInBattle] = useState(false);
    
    const getStorageKey = () => user ? `story-progress-${user.uid}` : 'story-progress-guest';

    useEffect(() => {
        setIsClient(true);
        if (user) {
            const savedProgress = localStorage.getItem(getStorageKey());
            if (savedProgress) {
                setClearedChapters(JSON.parse(savedProgress));
            }
        }
    }, [user]);
    
    const handleChapterSelect = (chapter: StoryChapter) => {
        if (chapter.id === 'chapter-2') {
             toast({ title: '近日公開', description: '次の章のアップデートをお楽しみに！'});
             return;
        }
        setActiveChapter(chapter);
    }
    
    const handleWinBattle = () => {
        if (!activeChapter || !activeChapter.battle) return;
        
        const isAlreadyCleared = clearedChapters.includes(activeChapter.id);

        if (!isAlreadyCleared) {
            const { g, items } = activeChapter.battle.reward;
            addCurrency(g);
            let rewardText = `報酬として ${g}G を獲得しました。`;
            
            if (items) {
                const itemRewards = [];
                for (const [itemId, amount] of Object.entries(items)) {
                    addItem(itemId, amount);
                    itemRewards.push(`${itemId} x${amount}`);
                }
                rewardText += ` ${itemRewards.join(', ')}も獲得！`;
            }

            const newClearedChapters = [...clearedChapters, activeChapter.id];
            setClearedChapters(newClearedChapters);
            localStorage.setItem(getStorageKey(), JSON.stringify(newClearedChapters));
            toast({
                title: `${activeChapter.title}をクリア！`,
                description: rewardText
            });
        } else {
             toast({
                title: `${activeChapter.title}を再度クリア！`,
                description: '初回クリア報酬は獲得済みです。'
            });
        }
        
        setInBattle(false);
        setActiveChapter(null);
    }

    const handleLoseBattle = () => {
        toast({
            variant: 'destructive',
            title: '敗北…',
            description: '再挑戦して勝利を目指そう！'
        });
        setInBattle(false);
        // We don't reset the active chapter so the user can see the prologue again.
    }
    
    if (!isClient) return null;

    if (inBattle && activeChapter?.battle) {
        return (
           <BattlePage
                initialPlayerDeck={activeChapter.battle.playerDeck}
                initialOpponentDeck={activeChapter.battle.opponentDeck}
                forcedDifficulty="beginner" // Story mode battles are not rated
                onGameEnd={(result) => {
                    if (result === 'win') {
                        handleWinBattle();
                    } else {
                        handleLoseBattle();
                    }
                }}
            />
        );
    }

    if (activeChapter) {
        return (
            <main className="container mx-auto">
                <Button variant="ghost" onClick={() => setActiveChapter(null)} className="mb-4">
                    <ArrowLeft className="mr-2" />
                    章選択に戻る
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>{activeChapter.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-line leading-relaxed">{activeChapter.prologue}</p>
                        {activeChapter.battle && (
                            <div className="mt-8 text-center">
                                 <Button onClick={() => setInBattle(true)} size="lg">
                                    この章の対戦に挑む
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">ストーリーモード</h1>
                <p className="text-muted-foreground">カードクラフターの世界を冒険しよう。</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storyContent.map(chapter => {
                    const isCleared = clearedChapters.includes(chapter.id);
                    return (
                        <Card 
                            key={chapter.id} 
                            onClick={() => handleChapterSelect(chapter)} 
                            className="cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    {chapter.title}
                                    {isCleared && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {chapter.prologue}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </main>
    );
}
