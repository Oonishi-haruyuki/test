
'use client';

import { useState, useEffect } from 'react';
import { useUser, initializeFirebase } from '@/firebase';
import { CardData } from '@/components/card-editor';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, ArrowRightLeft, Check, X, Inbox, CornerUpLeft } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { createTradeOffer, respondToTradeOffer } from '@/lib/trade-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardPreview } from '@/components/card-preview';
import { Badge } from '@/components/ui/badge';

interface TradeOffer {
    id: string;
    offerorId: string;
    offerorLoginId: string;
    offereeId: string;
    offereeLoginId: string;
    offeredCards: CardData[];
    requestedCards: CardData[];
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    createdAt: any;
}


const OfferCard = ({ card, onRemove, context }: { card: CardData, onRemove?: (cardId: string) => void, context: 'offer' | 'request' }) => (
    <div className="relative border p-2 rounded-md bg-background">
        <p className="text-sm font-semibold truncate pr-6">{card.name}</p>
        <p className="text-xs text-muted-foreground">{card.cardType} / {card.rarity}</p>
         {onRemove && (
            <Button
                variant="destructive" size="icon"
                className="absolute top-1 right-1 h-5 w-5"
                onClick={() => onRemove(card.id!)}
            >
                <X className="h-3 w-3" />
            </Button>
        )}
    </div>
);


export default function TradePage() {
    const { user, profile, isUserLoading } = useUser();
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);
    
    // Trade Creation State
    const [myCollection, setMyCollection] = useState<CardData[]>([]);
    const [offereeLoginId, setOffereeLoginId] = useState('');
    const [offereeCollection, setOffereeCollection] = useState<CardData[]>([]);
    const [offeredCards, setOfferedCards] = useState<CardData[]>([]);
    const [requestedCards, setRequestedCards] = useState<CardData[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingCollection, setIsFetchingCollection] = useState(false);

    // Trade Viewing State
    const [incomingOffers, setIncomingOffers] = useState<TradeOffer[]>([]);
    const [outgoingOffers, setOutgoingOffers] = useState<TradeOffer[]>([]);
    
    const { firestore } = initializeFirebase();

    // Load my collection
    useEffect(() => {
        setIsClient(true);
        if (user) {
            try {
                const collectionFromStorage: CardData[] = JSON.parse(localStorage.getItem('cardCollection') || '[]');
                setMyCollection(collectionFromStorage);
            } catch (error) {
                console.error("Failed to load my collection", error);
            }
        }
    }, [user]);

    // Listen for trade offers
    useEffect(() => {
        if (!user || !firestore) return;

        const sortOffers = (offers: TradeOffer[]) => {
            return offers.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : 0;
                return dateB - dateA;
            });
        };

        // Incoming offers
        const incomingQuery = query(collection(firestore, 'trades'), where('offereeId', '==', user.uid));
        const unsubIncoming = onSnapshot(incomingQuery, (snapshot) => {
            const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeOffer));
            setIncomingOffers(sortOffers(offers));
        }, (error) => {
            console.error("Error fetching incoming trades:", error);
        });

        // Outgoing offers
        const outgoingQuery = query(collection(firestore, 'trades'), where('offerorId', '==', user.uid));
        const unsubOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
            const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeOffer));
            setOutgoingOffers(sortOffers(offers));
        }, (error) => {
            console.error("Error fetching outgoing trades:", error);
        });


        return () => {
            unsubIncoming();
            unsubOutgoing();
        };

    }, [user, firestore]);

    const handleSearchOfferee = async () => {
        if (!offereeLoginId.trim()) {
            toast({ variant: 'destructive', title: 'プレイヤーのログインIDを入力してください。'});
            return;
        }
        setIsFetchingCollection(true);
        setOffereeCollection([]); // Clear previous results
        try {
            // In a real app, you'd fetch this from a server/DB.
            // For this demo, we'll mock it by trying to load from THEIR localStorage key.
            // This is NOT secure and only for demonstration purposes.
            // Let's assume a user can have multiple profiles for demo-ability
            const profiles = ['test-user', 'player-1', 'player-2'];
            let found = false;
            for (const p of profiles) {
                const offereeKey = `${p}-cardCollection`;
                // This is a hack. In reality, server actions cannot access localStorage.
                // We are assuming the browser has access to other profiles' data for demo purposes.
                const collectionData = localStorage.getItem(offereeKey);
                // Also checking if the profile name matches the input
                 if (collectionData) {
                    const parsedData = JSON.parse(collectionData);
                    setOffereeCollection(parsedData);
                    found = true;
                    toast({ title: `「${offereeLoginId}」のコレクションを読み込みました。`});
                    break;
                }
            }
            if (!found) {
                 toast({ variant: 'destructive', title: 'プレイヤーが見つからないか、コレクションが空です。'});
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'コレクションの読み込みに失敗しました。'});
        } finally {
            setIsFetchingCollection(false);
        }
    }
    
    const handleAddToOffer = (card: CardData) => {
        if(offeredCards.length >= 5) {
            toast({ variant: 'destructive', title: '一度にオファーできるのは5枚までです。'});
            return;
        }
        setOfferedCards(prev => [...prev, card]);
        setMyCollection(prev => prev.filter(c => c.id !== card.id));
    };

    const handleRemoveFromOffer = (cardId: string) => {
        const card = offeredCards.find(c => c.id === cardId);
        if(card) {
            setOfferedCards(prev => prev.filter(c => c.id !== cardId));
            setMyCollection(prev => [...prev, card]);
        }
    };
    
    const handleAddToRequest = (card: CardData) => {
        if(requestedCards.length >= 5) {
            toast({ variant: 'destructive', title: '一度に要求できるのは5枚までです。'});
            return;
        }
        setRequestedCards(prev => [...prev, card]);
        setOffereeCollection(prev => prev.filter(c => c.id !== card.id));
    };

    const handleRemoveFromRequest = (cardId: string) => {
        const card = requestedCards.find(c => c.id === cardId);
        if(card) {
            setRequestedCards(prev => prev.filter(c => c.id !== cardId));
            setOffereeCollection(prev => [...prev, card]);
        }
    };
    
    const handleSubmitOffer = async () => {
        if (!user || !profile?.loginId) return;
        if (offeredCards.length === 0 || requestedCards.length === 0) {
            toast({ variant: 'destructive', title: '交換するカードを両方選択してください。' });
            return;
        }
        setIsSubmitting(true);
        const result = await createTradeOffer(user.uid, profile.loginId, offereeLoginId, offeredCards, requestedCards);
        if (result.success) {
            toast({ title: 'オファー成功', description: result.message });
            // Reset state
            setOfferedCards([]);
            setRequestedCards([]);
            setOffereeLoginId('');
            // Repopulate my collection with offered cards as the offer is now "sent"
            setMyCollection(prev => [...prev, ...offeredCards]);
            setOffereeCollection([]);
        } else {
            toast({ variant: 'destructive', title: 'オファー失敗', description: result.message });
        }
        setIsSubmitting(false);
    };

    const handleOfferResponse = async (tradeId: string, response: 'accepted' | 'rejected' | 'cancelled') => {
        if (!user) return;
        
        // Optimistically update UI
        const offer = incomingOffers.find(o => o.id === tradeId) || outgoingOffers.find(o => o.id === tradeId);
        if (!offer) return;
        
        const originalStatus = offer.status;
        offer.status = response; // Temporarily update status for UI feedback
        
        const result = await respondToTradeOffer(tradeId, user.uid, response);
        if (result.success) {
            toast({ title: `トレードを${response === 'accepted' ? '承諾' : response === 'rejected' ? '拒否' : 'キャンセル'}しました。` });
            
            // If accepted, we need to manually update localStorage for this demo
            if (response === 'accepted') {
                const myCurrentCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
                // Remove offered cards, add requested cards
                const finalCollection = myCurrentCollection
                    .filter((mc: CardData) => !offer.requestedCards.some(rc => rc.id === mc.id))
                    .concat(offer.offeredCards);
                localStorage.setItem('cardCollection', JSON.stringify(finalCollection));
                setMyCollection(finalCollection);
                toast({title: 'カードを交換しました！', description: 'あなたのコレクションが更新されました。'});
            }

        } else {
            offer.status = originalStatus; // Revert optimistic update
            toast({ variant: 'destructive', title: '処理失敗', description: result.message });
        }
    };
    
    if (!isClient || isUserLoading) {
        return <main className="text-center p-10"><Loader2 className="animate-spin" /> ロード中...</main>
    }

    if (!user) {
        return (
             <main className="text-center p-10">
                <Card className="max-w-md mx-auto">
                    <CardHeader><CardTitle>ログインが必要です</CardTitle></CardHeader>
                    <CardContent><p>カードトレード機能を利用するには、マイページからログインしてください。</p></CardContent>
                </Card>
            </main>
        )
    }
    
    const OfferList = ({ offers, type }: { offers: TradeOffer[], type: 'incoming' | 'outgoing' }) => (
        <ul className="space-y-4">
            {offers.length === 0 && <p className="text-muted-foreground text-center py-8">オファーはありません。</p>}
            {offers.map(offer => (
                <li key={offer.id}>
                    <Card className="bg-secondary/30">
                        <CardHeader>
                            <CardTitle className="text-lg flex justify-between items-center">
                                {type === 'incoming' ? (
                                    <span>From: {offer.offerorLoginId}</span>
                                ) : (
                                    <span>To: {offer.offereeLoginId}</span>
                                )}
                                <Badge variant={
                                    offer.status === 'pending' ? 'default' :
                                    offer.status === 'accepted' ? 'secondary' : 'destructive'
                                }>{offer.status}</Badge>
                            </CardTitle>
                             <CardDescription>{offer.createdAt?.toDate ? new Date(offer.createdAt.toDate()).toLocaleString() : '日付不明'}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            {/* Offered Cards */}
                            <div className="col-span-1 space-y-2">
                                <h4 className="font-semibold text-sm">{type === 'incoming' ? '相手の提示カード' : 'あなたの提示カード'}</h4>
                                {offer.offeredCards.map(c => <OfferCard key={c.id} card={c} context="offer" />)}
                            </div>
                            
                            <ArrowRightLeft className="text-muted-foreground justify-self-center hidden md:block" />

                            {/* Requested Cards */}
                             <div className="col-span-1 space-y-2">
                                 <h4 className="font-semibold text-sm">{type === 'incoming' ? 'あなたの提示カード' : '相手の希望カード'}</h4>
                                {offer.requestedCards.map(c => <OfferCard key={c.id} card={c} context="request" />)}
                            </div>
                        </CardContent>
                        {offer.status === 'pending' && (
                             <CardFooter className="justify-end gap-2">
                                {type === 'incoming' && (
                                    <>
                                        <Button variant="destructive" onClick={() => handleOfferResponse(offer.id, 'rejected')}>拒否</Button>
                                        <Button variant="default" onClick={() => handleOfferResponse(offer.id, 'accepted')}>承諾</Button>
                                    </>
                                )}
                                {type === 'outgoing' && (
                                     <Button variant="ghost" onClick={() => handleOfferResponse(offer.id, 'cancelled')}>キャンセル</Button>
                                )}
                            </CardFooter>
                        )}
                    </Card>
                </li>
            ))}
        </ul>
    );
    

    return (
        <main>
             <Tabs defaultValue="create">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="create">オファー作成</TabsTrigger>
                    <TabsTrigger value="incoming">受信箱 ({incomingOffers.filter(o => o.status === 'pending').length})</TabsTrigger>
                    <TabsTrigger value="outgoing">送信箱</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>トレードオファーを作成</CardTitle>
                            <CardDescription>プレイヤーと交換したいカードを選択して、オファーを送信します。</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="offereeId">相手のログインID</Label>
                                <div className="flex gap-2">
                                    <Input id="offereeId" value={offereeLoginId} onChange={e => setOffereeLoginId(e.target.value)} placeholder="例: player-2" />
                                    <Button onClick={handleSearchOfferee} disabled={isFetchingCollection}>
                                        {isFetchingCollection ? <Loader2 className="animate-spin"/> : 'コレクションを検索'}
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* My Collection */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg">あなたのコレクション</h3>
                                    <Card>
                                        <CardHeader className="p-2 border-b"><h4 className="text-sm font-semibold">提示するカード (最大5枚)</h4></CardHeader>
                                        <CardContent className="p-2 space-y-2 h-40 overflow-y-auto">
                                            {offeredCards.map(c => <OfferCard key={c.id} card={c} context="offer" onRemove={handleRemoveFromOffer}/>)}
                                        </CardContent>
                                    </Card>
                                    <ScrollArea className="h-64 border rounded-md">
                                        <div className="p-4 space-y-2">
                                        {myCollection.map(card => (
                                            <div key={card.id} className="flex items-center justify-between text-sm p-1 rounded-md hover:bg-muted">
                                                <span>{card.name}</span>
                                                <Button size="sm" variant="outline" onClick={() => handleAddToOffer(card)}>追加</Button>
                                            </div>
                                        ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                                {/* Offeree Collection */}
                                <div className="space-y-4">
                                     <h3 className="font-bold text-lg">相手のコレクション</h3>
                                      <Card>
                                        <CardHeader className="p-2 border-b"><h4 className="text-sm font-semibold">要求するカード (最大5枚)</h4></CardHeader>
                                        <CardContent className="p-2 space-y-2 h-40 overflow-y-auto">
                                             {requestedCards.map(c => <OfferCard key={c.id} card={c} context="request" onRemove={handleRemoveFromRequest} />)}
                                        </CardContent>
                                    </Card>
                                    <ScrollArea className="h-64 border rounded-md">
                                        <div className="p-4 space-y-2">
                                        {isFetchingCollection ? <Loader2 className="animate-spin mx-auto"/> : offereeCollection.length === 0 ? <p className="text-xs text-muted-foreground text-center">相手を検索してください。</p> : null}
                                        {offereeCollection.map(card => (
                                            <div key={card.id} className="flex items-center justify-between text-sm p-1 rounded-md hover:bg-muted">
                                                <span>{card.name}</span>
                                                <Button size="sm" variant="outline" onClick={() => handleAddToRequest(card)}>要求</Button>
                                            </div>
                                        ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" size="lg" onClick={handleSubmitOffer} disabled={isSubmitting || offeredCards.length === 0 || requestedCards.length === 0}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                                オファーを送信する
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="incoming" className="pt-6">
                    <OfferList offers={incomingOffers} type="incoming" />
                </TabsContent>
                <TabsContent value="outgoing" className="pt-6">
                     <OfferList offers={outgoingOffers} type="outgoing" />
                </TabsContent>
            </Tabs>
        </main>
    )
}
