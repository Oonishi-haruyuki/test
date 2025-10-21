
'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Swords, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateDeck } from '@/ai/flows/generate-deck';

export default function StoryBattlePreparationPage() {
    const [decks, setDecks] = useState<{id: string, name: string, cards: CardData[]}[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        try {
            const savedDecks = JSON.parse(localStorage.getItem('cardDecks') || '[]');
            setDecks(savedDecks);
            if (savedDecks.length > 0) {
                setSelectedDeckId(savedDecks[0].id);
            }
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'デッキの読み込みに失敗しました' });
        }
    }, [toast]);

    const handleGenerateDeck = async () => {
        setIsLoading(true);
        try {
            const result = await generateDeck({ theme: 'ファンタジー', cardCount: 20 });
            const newDeck = {
                id: `generated-${Date.now()}`,
                name: 'AI生成デッキ (ファンタジー)',
                cards: result.deck.map(c => ({...c, id: self.crypto.randomUUID(), imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`})) as CardData[]
            };
            setDecks(prev => [...prev, newDeck]);
            setSelectedDeckId(newDeck.id);
            toast({ title: 'AIが新しいデッキを生成しました！'});
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'デッキ生成に失敗しました' });
        }
        setIsLoading(false);
    };

    const handleStart = () => {
        const selectedDeck = decks.find(d => d.id === selectedDeckId);
        if (!selectedDeck || selectedDeck.cards.length < 20) {
            toast({ variant: 'destructive', title: 'デッキが不完全です', description: '20枚のカードで構成されたデッキを選択してください。' });
            return;
        }

        // Store selected deck in localStorage to be picked up by the battle page.
        localStorage.setItem('storyModeDeck', JSON.stringify(selectedDeck.cards));
        
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
                <Button size="lg" onClick={handleStart} disabled={!selectedDeckId}>
                    <Swords className="mr-2"/>
                    対戦開始！
                </Button>
            </div>
        </div>
    );
}
