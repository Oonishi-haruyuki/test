
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase';
import { findOrCreateGame } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Swords } from 'lucide-react';
import OnlineBattlePage from '../(main)/online-battle/page';

export default function OnlineMatchmakingPage() {
    const { user, profile } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isSearching, setIsSearching] = useState(false);
    const [decks, setDecks] = useState<{id: string, name: string, cards: CardData[]}[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

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
    

    const handleFindMatch = async () => {
        if (!user || !profile?.loginId) {
            toast({
                variant: 'destructive',
                title: 'ログインが必要です',
                description: 'オンライン対戦をするにはログインしてください。',
            });
            return;
        }

        const selectedDeck = decks.find(d => d.id === selectedDeckId);
        if (!selectedDeck || selectedDeck.cards.length < 20) {
            toast({ variant: 'destructive', title: 'デッキが不完全です', description: '20枚のカードで構成されたデッキを選択してください。' });
            return;
        }

        setIsSearching(true);
        toast({ title: '対戦相手を探しています...' });

        try {
            const gameId = await findOrCreateGame(user.uid, profile.loginId, selectedDeck.cards);
            router.push(`/online-battle/${gameId}`);
        } catch (error) {
            console.error('Failed to find or create game', error);
            toast({
                variant: 'destructive',
                title: 'マッチングに失敗しました',
                description: '時間をおいて再度お試しください。',
            });
            setIsSearching(false);
        }
    };

    return (
        <div className="container mx-auto p-4 text-center">
            <h1 className="text-4xl font-bold mb-4">オンライン対戦</h1>
            <p className="text-muted-foreground mb-8">世界中のプレイヤーと腕を競い合おう！</p>

            <div className="max-w-md mx-auto space-y-6">
                 <div>
                    <h2 className="text-xl font-semibold mb-4">使用するデッキを選択</h2>
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
                 </div>
                
                <Button 
                    size="lg" 
                    onClick={handleFindMatch} 
                    disabled={isSearching || !selectedDeckId} 
                    className="w-full"
                >
                    {isSearching ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Swords className="mr-2 h-5 w-5" />
                    )}
                    {isSearching ? 'マッチング中...' : '対戦相手を探す'}
                </Button>
            </div>
        </div>
    );
}

