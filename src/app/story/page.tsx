

'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { elementalDeck, goblinDeck, undeadDeck, dragonDeck, ninjaDeck } from '@/lib/decks';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import BattlePage from '@/app/battle/page';
import { useUser } from '@/firebase';
import { useInventory } from '@/hooks/use-inventory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Deck {
    id: string;
    name: string;
    cards: CardData[];
}

interface StoryChapter {
    id: string;
    title: string;
    prologue: string;
    battle?: {
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
        prologue: 'あなたは不思議な力に導かれ、カードがすべての世界「アルカディア」に召喚されたカードクラフター。...\n\nあなたの目の前には、いたずら好きで厄介なゴブリンたちがうごめく森が広がっている。\n\n森を抜けるには、彼らのリーダーをカードバトルで打ち負かすしかないようだ。\n\nまずは、自分のデッキを選んで戦いに挑もう。',
        battle: {
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
        title: '第2章: 墓場のアンデッド',
        prologue: 'ゴブリンの森を抜けた先にあったのは、不気味な雰囲気が漂う古い墓場だった。そこではネクロマンサーによって操られたアンデッドたちが、侵入者を待ち構えている。',
        battle: {
            opponentName: 'ネクロマンサー',
            opponentDeck: undeadDeck,
            reward: { g: 300 },
        }
    },
    {
        id: 'chapter-3',
        title: '第3章: ドラゴンの巣窟',
        prologue: 'アンデッドの脅威を退けたあなたの次なる目的地は、燃え盛る山脈に位置するドラゴンの巣窟。強力なドラゴンたちを相手に、あなたのデッキ戦略が試される。',
        battle: {
            opponentName: 'ドラゴンロード',
            opponentDeck: dragonDeck,
            reward: { g: 500, items: { 'dragon-soul': 2 } },
        }
    },
    {
        id: 'chapter-4',
        title: '第4章: 影のニンジャ一族',
        prologue: 'ドラゴンの力を認められたあなたは、東の国からやってきた謎のニンジャ一族の存在を知る。彼らの素早い攻撃とトリッキーな戦術に対応できるか？',
        battle: {
            opponentName: 'ニンジャマスター',
            opponentDeck: ninjaDeck,
            reward: { g: 700 },
        }
    },
    {
        id: 'chapter-5',
        title: '第5章: (近日公開)',
        prologue: '数々の強敵を打ち破り、カードクラフターとして名を馳せたあなた。しかし、この世界の真の危機はまだ始まったばかりだった...。',
    }
];

const DECK_SIZE = 30;

export default function StoryModePage() {
    const { user } = useUser();
    const { addCurrency } = useCurrency();
    const { addItem } = useInventory();
    const { toast } = useToast();

    const [isClient, setIsClient] = useState(false);
    const [clearedChapters, setClearedChapters] = useState<string[]>([]);
    const [activeChapter, setActiveChapter] = useState<StoryChapter | null>(null);
    const [inBattle, setInBattle] = useState(false);

    const [savedDecks, setSavedDecks] = useState<Deck[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
    
    const getStorageKey = () => user ? `story-progress-${user.uid}` : 'story-progress-guest';

    useEffect(() => {
        setIsClient(true);
        if (user) {
            const savedProgress = localStorage.getItem(getStorageKey());
            if (savedProgress) {
                setClearedChapters(JSON.parse(savedProgress));
            }
            try {
                const decksFromStorage: Deck[] = JSON.parse(localStorage.getItem('decks') || '[]');
                const validDecks = decksFromStorage.filter(d => d.cards.length === DECK_SIZE);
                setSavedDecks(validDecks);
                if (validDecks.length > 0) {
                    setSelectedDeck(validDecks[0]);
                }
            } catch (error) {
                console.error("Failed to load decks", error);
            }
        }
    }, [user]);
    
    const handleChapterSelect = (chapter: StoryChapter) => {
        if (!chapter.battle) {
             toast({ title: '近日公開', description: '次の章のアップデートをお楽しみに！'});
             return;
        }
        setActiveChapter(chapter);
        if (savedDecks.length > 0) {
            setSelectedDeck(savedDecks[0]);
        }
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

    if (inBattle && activeChapter?.battle && selectedDeck) {
        return (
           <BattlePage
                initialPlayerDeck={selectedDeck.cards.filter(c => c.cardType !== 'artifact')}
                initialOpponentDeck={activeChapter.battle.opponentDeck}
                forcedDifficulty="beginner" // Story mode battles are not rated
                onGameEnd={(result) => {
                    if (result === 'win') {
                        handleWinBattle();
                    } else {
                        handleLoseBattle();
                    }
                }}
                gameRules={{
                    playerHealth: 20,
                    opponentHealth: 15,
                    boardLimit: 3,
                    landLimit: 2,
                    disallowedCardTypes: ['artifact']
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
                            <div className="mt-8 text-center space-y-4">
                                 <div className="max-w-xs mx-auto">
                                    <p className="font-semibold mb-2">使用するデッキを選択</p>
                                     <Select onValueChange={(deckId) => setSelectedDeck(savedDecks.find(d => d.id === deckId) || null)} defaultValue={selectedDeck?.id}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="デッキを選択..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {savedDecks.map(deck => (
                                                <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {savedDecks.length === 0 && <p className="text-xs text-destructive mt-2">対戦可能なデッキがありません。「デッキ構築」で30枚のデッキを作成してください。</p>}
                                </div>
                                 <Button onClick={() => setInBattle(true)} size="lg" disabled={!selectedDeck}>
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
