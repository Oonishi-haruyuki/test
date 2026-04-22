
'use client';

import { useState, useEffect, Suspense } from 'react';
import type { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Swords, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateDeckClient } from '@/lib/generate-deck-client';
import { useAuth } from '@/components/auth-provider';
import { appendUserDeck, loadUserDecks, MAX_USER_DECKS, saveStoryModeDeck, UserDataStoreError } from '@/lib/user-data-store';

function StoryBattlePreparationPageContent() {
    const [decks, setDecks] = useState<{id: string, name: string, cards: CardData[]}[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading || !user) {
            return;
        }

        const load = async () => {
            try {
                const savedDecks = await loadUserDecks(user.uid);
                setDecks(savedDecks);
                if (savedDecks.length > 0) {
                    setSelectedDeckId(savedDecks[0].id);
                }
            } catch(e) {
                console.error(e);
                toast({ variant: 'destructive', title: 'デッキの読み込みに失敗しました' });
            }
        };

        void load();
    }, [toast, authLoading, user]);

    const handleGenerateDeck = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'サインインが必要です' });
            return;
        }

        if (decks.length >= MAX_USER_DECKS) {
            toast({
                variant: 'destructive',
                title: 'デッキ上限に達しました',
                description: `デッキは最大${MAX_USER_DECKS}個までです。`,
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await generateDeckClient({ theme: 'ファンタジー', cardCount: 20 });
            const newDeck = {
                id: `generated-${Date.now()}`,
                name: 'AI生成デッキ (ファンタジー)',
                cards: result.deck.map(c => ({
                    ...c,
                    id: self.crypto.randomUUID(),
                    imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`,
                    theme: 'custom' as const,
                })) as CardData[]
            };
            const nextDecks = await appendUserDeck(user.uid, newDeck);
            setDecks(nextDecks);
            setSelectedDeckId(newDeck.id);
            toast({ title: 'AIが新しいデッキを生成しました！'});
        } catch (error) {
            console.error(error);
            if (error instanceof UserDataStoreError && error.code === 'DECK_LIMIT_REACHED') {
                toast({
                    variant: 'destructive',
                    title: 'デッキ上限に達しました',
                    description: error.message,
                });
            } else {
                toast({ variant: 'destructive', title: 'デッキ生成に失敗しました' });
            }
        }
        setIsLoading(false);
    };

    const handleStart = async () => {
        const selectedDeck = decks.find(d => d.id === selectedDeckId);
        if (!selectedDeck || selectedDeck.cards.length < 20) {
            toast({ variant: 'destructive', title: 'デッキが不完全です', description: '20枚のカードで構成されたデッキを選択してください。' });
            return;
        }

        if (!user) {
            toast({ variant: 'destructive', title: 'サインインが必要です' });
            return;
        }

        await saveStoryModeDeck(user.uid, selectedDeck.cards);
        
        const params = new URLSearchParams(searchParams);
        params.set('story', 'true'); // Add story flag for battle page
        
        // Difficulty is determined by the stage, not user selection. 
        // For now, we'll default to 'beginner' for opponent deck selection. This can be passed from stage later.
        params.set('difficulty', 'beginner');

        router.push(`/battle?${params.toString()}`);
    };
    
    const selectedDeck = decks.find(d => d.id === selectedDeckId);

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-2">対戦準備</h1>
            <p className="text-muted-foreground text-center mb-8">ストーリーに挑むデッキを選択してください。</p>

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4">デッキを選択</h2>
                    <div className="space-y-4">
                        <Select onValueChange={setSelectedDeckId} value={selectedDeckId || ''}>
                            <SelectTrigger>
                                <SelectValue placeholder="デッキを選択..." />
                            </SelectTrigger>
                            <SelectContent>
                                {decks.map(deck => (
                                    <SelectItem key={deck.id} value={deck.id}>{deck.name} ({deck.cards.length}枚)</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Button onClick={handleGenerateDeck} disabled={isLoading} variant="outline" className="w-full">
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 生成中...</> : 'AIにデッキを生成させる'}
                         </Button>
                    </div>
                     <div className="mt-4 p-2 border rounded-lg h-96 overflow-y-auto bg-secondary/30">
                        {selectedDeck ? (
                            <ul className="space-y-1 text-sm">
                                {selectedDeck.cards.map((card, i) => <li key={`${card.id}-${i}`} className="p-1 rounded bg-background/50">{card.name}</li>)}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground pt-10">デッキを選択してください。</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <Button size="lg" onClick={handleStart} disabled={!selectedDeckId || authLoading}>
                    <Swords className="mr-2"/>
                    対戦開始！
                </Button>
            </div>
        </div>
    );
}

export default function StoryBattlePreparationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-10 w-10" /><p className="ml-4">読み込み中...</p></div>}>
            <StoryBattlePreparationPageContent />
        </Suspense>
    );
}
