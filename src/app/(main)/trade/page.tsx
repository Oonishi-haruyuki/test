
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CardData } from '@/components/card-editor';
import { Button } from '@/components/ui/button';

import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, initializeFirebase } from '@/firebase';
import { ArrowLeftRight, Loader2, Search } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createTradeOffer, respondToTradeOffer, searchUserCollection } from '@/lib/trade-actions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';

type TradeOffer = {
    id: string;
    offerorId: string;
    offerorLoginId: string;
    offereeId: string;
    offereeLoginId: string;
    offeredCards: CardData[];
    requestedCards: CardData[];
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    createdAt: any;
};

const CardMini = ({ card }: { card: CardData }) => (
    <div className="p-2 border rounded-md bg-background text-xs">
        <p className="font-semibold truncate">{card.name}</p>
        <p className="text-muted-foreground">C:{card.manaCost} A:{card.attack} D:{card.defense}</p>
    </div>
);

export default function TradePage() {
    const { user, profile } = useUser();
    const { firestore } = initializeFirebase();
    const [myCollection, setMyCollection] = useState<CardData[]>([]);
    const [offereeCollection, setOffereeCollection] = useState<CardData[]>([]);
    const [offeredCards, setOfferedCards] = useState<CardData[]>([]);
    const [requestedCards, setRequestedCards] = useState<CardData[]>([]);
    const [offereeLoginId, setOffereeLoginId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const { toast } = useToast();

    const [incomingOffers, setIncomingOffers] = useState<TradeOffer[]>([]);
    const [outgoingOffers, setOutgoingOffers] = useState<TradeOffer[]>([]);

    useEffect(() => {
        try {
            const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
            setMyCollection(savedCollection);
        } catch (e) {
            console.error("Failed to load collection", e);
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        const tradesRef = collection(firestore, 'trades');
        const incomingQuery = query(tradesRef, where('offereeId', '==', user.uid), where('status', '==', 'pending'));
        const outgoingQuery = query(tradesRef, where('offerorId', '==', user.uid));

        const unsubIncoming = onSnapshot(incomingQuery, (snapshot) => {
            const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeOffer));
            setIncomingOffers(offers);
        });
        const unsubOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
            const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradeOffer));
            setOutgoingOffers(offers.filter(o => o.status === 'pending' || o.status === 'cancelled' || o.status === 'rejected'));
        });

        return () => {
            unsubIncoming();
            unsubOutgoing();
        };
    }, [user, firestore]);
    
    const handleSearchOffereeCollection = async () => {
        if (!offereeLoginId.trim()) {
            toast({ variant: 'destructive', title: '相手のログインIDを入力してください。' });
            return;
        }
        setIsSearching(true);
        const result = await searchUserCollection(offereeLoginId);
        if (result.success) {
            setOffereeCollection(result.collection || []);
            toast({ title: `「${offereeLoginId}」のコレクションを読み込みました。`});
        } else {
            toast({ variant: 'destructive', title: '検索失敗', description: result.message });
            setOffereeCollection([]);
        }
        setIsSearching(false);
    };

    const myAvailableCollection = useMemo(() => {
        const offeredIds = new Set(offeredCards.map(c => c.id));
        return myCollection.filter(c => !offeredIds.has(c.id));
    }, [myCollection, offeredCards]);
    
    const offereeAvailableCollection = useMemo(() => {
        const requestedIds = new Set(requestedCards.map(c => c.id));
        return offereeCollection.filter(c => !requestedIds.has(c.id));
    }, [offereeCollection, requestedCards]);


    const onDragEnd = useCallback((result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        const move = (sourceList: CardData[], destList: CardData[], sourceIndex: number, destIndex: number) => {
            const newSource = Array.from(sourceList);
            const newDest = Array.from(destList);
            const [removed] = newSource.splice(sourceIndex, 1);
            newDest.splice(destIndex, 0, removed);
            return { newSource, newDest };
        };

        // From my collection to offered
        if (source.droppableId === 'my-collection' && destination.droppableId === 'offered') {
            const { newDest } = move(myAvailableCollection, offeredCards, source.index, destination.index);
            setOfferedCards(newDest);
        }
        // From offered back to my collection
        else if (source.droppableId === 'offered' && destination.droppableId === 'my-collection') {
            const { newSource } = move(offeredCards, myAvailableCollection, source.index, destination.index);
            setOfferedCards(newSource);
        }
        // From offeree's collection to requested
        else if (source.droppableId === 'offeree-collection' && destination.droppableId === 'requested') {
            const { newDest } = move(offereeAvailableCollection, requestedCards, source.index, destination.index);
            setRequestedCards(newDest);
        }
        // From requested back to offeree's collection
        else if (source.droppableId === 'requested' && destination.droppableId === 'offeree-collection') {
            const { newSource } = move(requestedCards, offereeAvailableCollection, source.index, destination.index);
            setRequestedCards(newSource);
        }
    }, [myAvailableCollection, offeredCards, offereeAvailableCollection, requestedCards]);
    
    const handleCreateOffer = async () => {
        if (!user || !profile?.loginId) {
            toast({ variant: 'destructive', title: 'ログインが必要です。' });
            return;
        }
        if (!offereeLoginId.trim()) {
            toast({ variant: 'destructive', title: '相手のログインIDを入力してください。' });
            return;
        }
        if (offeredCards.length === 0 && requestedCards.length === 0) {
            toast({ variant: 'destructive', title: 'トレードするカードを選択してください。' });
            return;
        }
        setIsSubmitting(true);
        const result = await createTradeOffer(user.uid, profile.loginId, offereeLoginId, offeredCards, requestedCards);
        if (result.success) {
            toast({ title: 'トレードオファーを送信しました。' });
            setOfferedCards([]);
            setRequestedCards([]);
            setOffereeLoginId('');
            setOffereeCollection([]);
        } else {
            toast({ variant: 'destructive', title: result.message });
        }
        setIsSubmitting(false);
    };
    
    const handleRespondToOffer = async (tradeId: string, response: 'accepted' | 'rejected' | 'cancelled') => {
        if (!user) return;
        const offer = [...incomingOffers, ...outgoingOffers].find(o => o.id === tradeId);
        if (!offer) return;
        
        const result = await respondToTradeOffer(tradeId, user.uid, response, offer.offeredCards, offer.requestedCards);

        if (result.success) {
            toast({ title: result.message });
            if (response === 'accepted') {
                try {
                    const currentCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
                    const cardsToRemoveIds = new Set(offer.offeredCards.map(c => c.id));
                    const newCollection = currentCollection.filter((c: CardData) => !cardsToRemoveIds.has(c.id));
                    localStorage.setItem('cardCollection', JSON.stringify([...newCollection, ...offer.requestedCards]));
                    setMyCollection([...newCollection, ...offer.requestedCards]);
                     toast({ title: "あなたのカードコレクションが更新されました！" });
                } catch(e) {
                    toast({ variant: 'destructive', title: "自分のカードコレクションの更新に失敗しました。" });
                }
            }
        } else {
            toast({ variant: 'destructive', title: result.message });
        }
    };


    if (!user) {
        return <div className="text-center p-8">トレード機能を利用するには、マイページからログインしてください。</div>
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">トレード</h1>
                
                <Card>
                    <CardHeader>
                        <CardTitle>トレードを作成</CardTitle>
                        <CardDescription>カードをドラッグ＆ドロップしてトレード内容を決め、オファーを送信します。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-2 items-center">
                            <Input 
                                placeholder="相手のログインID" 
                                value={offereeLoginId} 
                                onChange={(e) => setOffereeLoginId(e.target.value)}
                            />
                             <Button onClick={handleSearchOffereeCollection} disabled={isSearching}>
                                {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                                相手のカードを検索
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                             <DroppableArea droppableId="offered" title="あなたが渡すカード" cards={offeredCards} />
                             <div className="flex justify-center items-center h-full pt-10">
                                <ArrowLeftRight className="w-10 h-10 text-muted-foreground" />
                            </div>
                             <DroppableArea droppableId="requested" title="あなたが欲しいカード" cards={requestedCards} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader><CardTitle>あなたのコレクション</CardTitle></CardHeader>
                                <CardContent>
                                    <DroppableArea droppableId="my-collection" cards={myAvailableCollection} isSource />
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>相手のコレクション</CardTitle></CardHeader>
                                <CardContent>
                                     {offereeCollection.length > 0 ? (
                                        <DroppableArea droppableId="offeree-collection" cards={offereeAvailableCollection} isSource />
                                     ) : (
                                        <div className="text-center text-muted-foreground p-10">相手のIDを検索してください。</div>
                                     )}
                                </CardContent>
                            </Card>
                        </div>
                        <Button onClick={handleCreateOffer} disabled={isSubmitting || !offereeLoginId}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            オファーを送信
                        </Button>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader><CardTitle>受信したオファー</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {incomingOffers.length === 0 && <p className="text-muted-foreground">受信したオファーはありません。</p>}
                            {incomingOffers.map(offer => (
                                <OfferCard key={offer.id} offer={offer} onRespond={handleRespondToOffer} type="incoming" />
                            ))}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>送信したオファー</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             {outgoingOffers.length === 0 && <p className="text-muted-foreground">送信したオファーはありません。</p>}
                             {outgoingOffers.map(offer => (
                                <OfferCard key={offer.id} offer={offer} onRespond={handleRespondToOffer} type="outgoing" />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DragDropContext>
    );
}

const DroppableArea = ({ droppableId, title, cards, isSource = false }: { droppableId: string; title?: string; cards: CardData[]; isSource?: boolean }) => (
    <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
            <ScrollArea 
                className={`p-2 rounded-lg min-h-[200px] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-primary/20' : isSource ? 'bg-secondary/50' : 'bg-primary/10'
                } ${isSource ? 'h-96' : ''}`}
            >
                 {title && <h3 className="font-semibold mb-2 text-center">{title}</h3>}
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-2 lg:grid-cols-3 gap-1 min-h-[100px]"
                >
                    {cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id!} index={index}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                >
                                    <CardMini card={card} />
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            </ScrollArea>
        )}
    </Droppable>
);

const OfferCard = ({ offer, onRespond, type }: { offer: TradeOffer, onRespond: (tradeId: string, response: 'accepted' | 'rejected' | 'cancelled') => void, type: 'incoming' | 'outgoing' }) => {
    return (
         <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-start">
                <p className="text-sm text-muted-foreground">
                    {type === 'incoming' ? `From: ${offer.offerorLoginId}` : `To: ${offer.offereeLoginId}`}
                </p>
                 
            </div>
             <div className="grid grid-cols-3 gap-2 items-center my-2">
                <div className="space-y-1">
                     <h4 className="font-semibold text-sm">あなたが渡す</h4>
                     {offer.offeredCards.length > 0 ? offer.offeredCards.map(c => <CardMini key={c.id} card={c} />) : <p className="text-xs text-muted-foreground">なし</p>}
                </div>
                <ArrowLeftRight className="mx-auto" />
                <div className="space-y-1">
                     <h4 className="font-semibold text-sm">あなたがもらう</h4>
                     {offer.requestedCards.length > 0 ? offer.requestedCards.map(c => <CardMini key={c.id} card={c} />) : <p className="text-xs text-muted-foreground">なし</p>}
                </div>
            </div>
             {offer.status === 'pending' && (
                <>
                {type === 'incoming' ? (
                    <div className="flex gap-2 justify-end mt-2">
                        <Button size="sm" variant="outline" onClick={() => onRespond(offer.id, 'rejected')}>拒否</Button>
                        <Button size="sm" onClick={() => onRespond(offer.id, 'accepted')}>承諾</Button>
                    </div>
                ) : (
                    <div className="flex justify-end mt-2">
                        <Button size="sm" variant="destructive" onClick={() => onRespond(offer.id, 'cancelled')}>キャンセル</Button>
                    </div>
                )}
                </>
             )}
        </div>
    );
}
