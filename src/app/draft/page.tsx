

'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateDeck } from '@/ai/flows/generate-deck';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Swords } from 'lucide-react';
import { CardPreview } from '@/components/card-preview';
import { Progress } from '@/components/ui/progress';
import BattlePage from '@/app/battle/page';
import { elementalDeck } from '@/lib/decks';

type DraftTheme = 'ファンタジー' | 'SF' | 'ニンジャ' | 'ドラゴン';
const DRAFT_DECK_SIZE = 30;
const DRAFT_PICKS = 15;

export default function DraftPage() {
    const [isClient, setIsClient] = useState(false);
    const [theme, setTheme] = useState<DraftTheme | null>(null);
    const [draftedDeck, setDraftedDeck] = useState<CardData[]>([]);
    const [cardChoices, setCardChoices] = useState<CardData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBattleStarted, setIsBattleStarted] = useState(false);
    const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
    const { toast } = useToast();

    const fetchChoices = async (currentTheme: DraftTheme) => {
        setIsLoading(true);
        try {
            const result = await generateDeck({ theme: currentTheme, cardCount: 2 });
            const choices = result.deck.map((card, index) => ({
                ...card,
                id: self.crypto.randomUUID(),
                theme: 'custom',
                imageUrl: `https://picsum.photos/seed/draft${Date.now()}${index}/${400}/${300}`,
            }));
            setCardChoices(choices);
        } catch (error) {
            console.error('Failed to generate card choices:', error);
            toast({ variant: 'destructive', title: 'カード選択肢の生成に失敗しました。' });
            setTimeout(() => fetchChoices(currentTheme), 2000);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        const startBattle = async () => {
            if (draftedDeck.length >= DRAFT_DECK_SIZE) {
                toast({ title: 'デッキが完成しました！', description: 'AIとの対戦を開始します。' });
                setIsLoading(true);
                try {
                    const result = await generateDeck({ theme: 'SF', cardCount: 30 });
                    const aiDeck = result.deck.map((card, index) => ({
                        ...card,
                        id: `ai-draft-${index}`,
                        theme: 'sci-fi',
                        imageUrl: `https://picsum.photos/seed/aidraft${index}/${400}/${300}`,
                    }));
                    setOpponentDeck(aiDeck);
                    setIsBattleStarted(true);
                } catch {
                    toast({ variant: 'destructive', title: 'AIデッキ生成に失敗' });
                    setOpponentDeck(elementalDeck);
                    setIsBattleStarted(true);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (theme && draftedDeck.length < DRAFT_DECK_SIZE) {
            fetchChoices(theme);
        } else {
            startBattle();
        }
    }, [theme, draftedDeck.length]);

    const handleSelectTheme = (selectedTheme: DraftTheme) => {
        setTheme(selectedTheme);
        setDraftedDeck([]);
        setIsBattleStarted(false);
    };

    const handleSelectCard = (selectedCard: CardData) => {
        const newCards = [...draftedDeck, selectedCard, { ...selectedCard, id: self.crypto.randomUUID() }];
        setDraftedDeck(newCards);
        setCardChoices([]);
    };
    
    const resetDraft = () => {
        setTheme(null);
        setDraftedDeck([]);
        setCardChoices([]);
        setIsBattleStarted(false);
        setOpponentDeck([]);
    };

    if (!isClient) {
        return <main className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" />ロード中...</main>;
    }
    
    if (isBattleStarted) {
        return (
            <BattlePage
                initialPlayerDeck={draftedDeck}
                initialOpponentDeck={opponentDeck}
                forcedDifficulty="advanced"
                onGameEnd={resetDraft}
            />
        );
    }

    if (!theme) {
        return (
            <main className="container mx-auto text-center">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-3xl">ドラフトモードへようこそ</CardTitle>
                        <CardDescription>デッキのテーマを選択して、即席デッキ構築を始めよう！</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                         <Button onClick={() => handleSelectTheme('ファンタジー')} className="h-24 text-lg"><Wand2 className="mr-2"/>ファンタジー</Button>
                         <Button onClick={() => handleSelectTheme('SF')} className="h-24 text-lg"><Wand2 className="mr-2"/>SF</Button>
                         <Button onClick={() => handleSelectTheme('ニンジャ')} className="h-24 text-lg"><Wand2 className="mr-2"/>ニンジャ</Button>
                         <Button onClick={() => handleSelectTheme('ドラゴン')} className="h-24 text-lg"><Wand2 className="mr-2"/>ドラゴン</Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">ドラフトピック ({draftedDeck.length / 2} / {DRAFT_PICKS})</h1>
                <p className="text-muted-foreground">テーマ: {theme}</p>
                <Progress value={(draftedDeck.length / DRAFT_DECK_SIZE) * 100} className="mt-4 max-w-lg mx-auto" />
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 h-96">
                    <Loader2 className="animate-spin h-12 w-12 text-primary" />
                    <p className="text-lg text-muted-foreground">次のカードを生成中...</p>
                </div>
            ) : cardChoices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {cardChoices.map(card => (
                        <div key={card.id} className="cursor-pointer hover:scale-105 transition-transform" onClick={() => handleSelectCard(card)}>
                            <CardPreview {...card} />
                        </div>
                    ))}
                </div>
            ) : null}
            
            <div className="mt-12">
                 <h2 className="text-2xl font-bold mb-4">構築中のデッキ ({draftedDeck.length}枚)</h2>
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                     {draftedDeck.map(card => (
                         <div key={card.id}>
                            <CardPreview {...card} />
                         </div>
                     ))}
                 </div>
            </div>
        </main>
    );
}
