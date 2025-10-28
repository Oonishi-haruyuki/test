

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { findOrCreateGame } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import type { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Swords, Trophy, Calendar, Users, Wand2, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createTournament, type CreateTournamentOptions } from '@/lib/tournament-actions';
import { useCurrency } from '@/hooks/use-currency';

export default function OnlineMatchmakingPage() {
    const { user } = useUser();

    if (!user) {
        return <div className="text-center p-8"><p>オンライン対戦機能を利用するには、マイページからログインしてください。</p></div>
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4">オンライン対戦</h1>
            <p className="text-muted-foreground mb-8">世界中のプレイヤーと腕を競い合おう！</p>
            
            <Tabs defaultValue="random-match">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="random-match">ランダムマッチ</TabsTrigger>
                    <TabsTrigger value="tournament">大会モード</TabsTrigger>
                </TabsList>
                <TabsContent value="random-match">
                    <RandomMatch />
                </TabsContent>
                <TabsContent value="tournament">
                    <TournamentMode />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function RandomMatch() {
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
        <Card>
            <CardHeader>
                <CardTitle>ランダムマッチ</CardTitle>
                <CardDescription>すぐに対戦相手を見つけて、気軽に対戦を始めます。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
                 <div className="max-w-md mx-auto space-y-4 text-left">
                     <Label>使用するデッキ</Label>
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
                    className="w-full max-w-md"
                >
                    {isSearching ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Swords className="mr-2 h-5 w-5" />
                    )}
                    {isSearching ? 'マッチング中...' : '対戦相手を探す'}
                </Button>
            </CardContent>
        </Card>
    );
}

function TournamentMode() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>大会を探す</CardTitle>
                            <CardDescription>現在参加可能な大会の一覧です。</CardDescription>
                        </div>
                        <CreateTournamentDialog />
                    </div>
                </CardHeader>
                <CardContent>
                    {/* This will be replaced with a dynamic list of tournaments */}
                    <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                        <Trophy className="mx-auto h-12 w-12 mb-4" />
                        <p>現在開催中の大会はありません。</p>
                        <p className="text-sm">新しい大会を作成して、友達と競い合いましょう！</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


function CreateTournamentDialog() {
    const { user, profile } = useUser();
    const { currency, spendCurrency } = useCurrency();
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [options, setOptions] = useState<CreateTournamentOptions>({
        name: '',
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16), // Default to 3 hours from now
        entryFee: 100,
        deckType: 'user-created',
    });

    const handleCreate = async () => {
        if (!user || !profile?.loginId) {
            toast({ variant: 'destructive', title: 'ログイン情報が見つかりません。' });
            return;
        }
        if (options.name.trim() === '') {
            toast({ variant: 'destructive', title: '大会名を入力してください。' });
            return;
        }
        if (new Date(options.startTime) < new Date()) {
            toast({ variant: 'destructive', title: '開始時刻は未来の日時である必要があります。' });
            return;
        }
        if (currency < options.entryFee) {
             toast({ variant: 'destructive', title: '参加費分のGコインを所持していません。' });
            return;
        }

        setIsCreating(true);
        if (!spendCurrency(options.entryFee)) {
            toast({ variant: 'destructive', title: '参加費の支払いに失敗しました。' });
            setIsCreating(false);
            return;
        }

        try {
            const result = await createTournament(user.uid, profile.loginId, options);
            if (result.success) {
                toast({ title: '大会を作成しました！', description: `参加コード: ${result.tournamentId}` });
                // Here you would typically close the dialog and refresh the tournament list
            } else if (result.error) {
                 toast({ 
                    variant: 'destructive', 
                    title: result.error.name, 
                    description: <pre className="mt-2 w-full rounded-md bg-slate-950 p-4"><code className="text-white">{result.error.message}</code></pre>
                 });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: '大会の作成に失敗しました。', description: error.message });
            // Refund entry fee if creation failed
            // addCurrency(options.entryFee); // This needs to be implemented carefully to avoid abuse
        } finally {
            setIsCreating(false);
        }
    };
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button><Trophy className="mr-2"/>大会を作成</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>新しい大会を作成</DialogTitle>
                    <DialogDescription>大会のルールを設定して、参加者を募集しましょう。</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="t-name">大会名</Label>
                        <Input id="t-name" value={options.name} onChange={e => setOptions({...options, name: e.target.value})} placeholder="例: 第一回最強決定戦"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="t-start-time">開始時刻</Label>
                        <Input id="t-start-time" type="datetime-local" value={options.startTime} onChange={e => setOptions({...options, startTime: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="t-entry-fee">参加費 (Gコイン)</Label>
                        <Input id="t-entry-fee" type="number" step={50} min={0} value={options.entryFee} onChange={e => setOptions({...options, entryFee: parseInt(e.target.value, 10) || 0})} />
                    </div>
                    <div className="space-y-2">
                        <Label>デッキの種類</Label>
                        <RadioGroup defaultValue="user-created" value={options.deckType} onValueChange={value => setOptions({...options, deckType: value as 'user-created' | 'ai-generated'})}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="user-created" id="r1" />
                                <Label htmlFor="r1" className="flex items-center gap-2"><User />自作デッキのみ</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ai-generated" id="r2" />
                                <Label htmlFor="r2" className="flex items-center gap-2"><Wand2 />AI生成デッキのみ</Label>
                            </div>
                        </RadioGroup>
                    </div>
                     <Card className="bg-secondary/50">
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">賞金について</CardTitle>
                            <CardDescription className="text-xs">
                                参加費の合計が賞金総額となります。賞金は1位から4位までのプレイヤーで山分けされます (1位: 50%, 2位: 25%, 3位: 15%, 4位: 10%)。
                                主催者も参加者として参加費を支払います。
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">キャンセル</Button>
                    </DialogClose>
                    <Button onClick={handleCreate} disabled={isCreating}>
                        {isCreating && <Loader2 className="mr-2 animate-spin"/>}
                        作成する ({options.entryFee}G 消費)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
