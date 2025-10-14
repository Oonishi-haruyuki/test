
'use client';

import { useEffect, useState } from 'react';
import type { CardData } from '@/components/card-editor';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Save, Trash2, FilePlus, Pencil } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
  } from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';


const DECK_SIZE = 30;
const MAX_IDENTICAL_CARDS = 2;
const MAX_DECKS = 20;

interface Deck {
    id: string;
    name: string;
    cards: CardData[];
}

export default function DeckBuilderPage() {
  const [collection, setCollection] = useState<CardData[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const activeDeck = decks.find(d => d.id === activeDeckId);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      const savedDecks = JSON.parse(localStorage.getItem('decks') || '[]');
      setCollection(savedCollection);

      if (savedDecks.length > 0) {
        setDecks(savedDecks);
        setActiveDeckId(savedDecks[0].id);
      } else {
        // Create a default deck if none exist
        const defaultDeck: Deck = { id: self.crypto.randomUUID(), name: 'マイデッキ 1', cards: [] };
        setDecks([defaultDeck]);
        setActiveDeckId(defaultDeck.id);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setCollection([]);
      const defaultDeck: Deck = { id: self.crypto.randomUUID(), name: 'マイデッキ 1', cards: [] };
      setDecks([defaultDeck]);
      setActiveDeckId(defaultDeck.id);
    }
  }, []);

  const getCardCountInDeck = (cardId?: string) => {
    if (!cardId || !activeDeck) return 0;
    return activeDeck.cards.filter(card => card.id === cardId).length;
  }

  const updateDecks = (newDecks: Deck[]) => {
    setDecks(newDecks);
    localStorage.setItem('decks', JSON.stringify(newDecks));
  }

  const addToDeck = (card: CardData) => {
    if (!activeDeck) return;

    if (activeDeck.cards.length >= DECK_SIZE) {
      toast({
        variant: 'destructive',
        title: 'デッキがいっぱいです',
        description: `デッキには${DECK_SIZE}枚までしかカードを追加できません。`,
      });
      return;
    }
    
    const count = getCardCountInDeck(card.id);
    if (count >= MAX_IDENTICAL_CARDS) {
        toast({
            variant: 'destructive',
            title: 'カードの追加制限',
            description: `同じカードは${MAX_IDENTICAL_CARDS}枚までしか追加できません。`,
        });
        return;
    }

    const newDecks = decks.map(d => 
        d.id === activeDeckId 
        ? { ...d, cards: [...d.cards, card] }
        : d
    );
    updateDecks(newDecks);
  };

  const removeFromDeck = (cardId?: string) => {
    if (!cardId || !activeDeck) return;
    
    const cardIndex = activeDeck.cards.findIndex(c => c.id === cardId);
    if (cardIndex > -1) {
        const newCards = [...activeDeck.cards];
        newCards.splice(cardIndex, 1);
        const newDecks = decks.map(d => 
            d.id === activeDeckId 
            ? { ...d, cards: newCards }
            : d
        );
        updateDecks(newDecks);
    }
  };

  const saveDeck = () => {
    if (!activeDeck) return;
    try {
      if (activeDeck.cards.length !== DECK_SIZE) {
        toast({
            variant: 'destructive',
            title: 'デッキの枚数が不正です',
            description: `デッキはちょうど${DECK_SIZE}枚で構築する必要があります。`,
        });
        return;
      }
      // The deck is already saved on every change, so just give feedback
      toast({
        title: 'デッキを保存しました',
        description: `「${activeDeck.name}」の現在の構成が保存されました。`,
      });
    } catch (error) {
      console.error("Failed to save deck to localStorage", error);
      toast({
        variant: 'destructive',
        title: '保存に失敗しました',
        description: 'デッキを保存できませんでした。',
      });
    }
  };

  const handleAddNewDeck = () => {
    if (!newDeckName.trim()) {
        toast({ variant: 'destructive', title: 'デッキ名を入力してください。'});
        return;
    }
    if (decks.length >= MAX_DECKS) {
        toast({ variant: 'destructive', title: 'これ以上デッキを作成できません。'});
        return;
    }
    const newDeck: Deck = { id: self.crypto.randomUUID(), name: newDeckName.trim(), cards: [] };
    const newDecks = [...decks, newDeck];
    updateDecks(newDecks);
    setActiveDeckId(newDeck.id);
    setNewDeckName('');
    toast({ title: `デッキ「${newDeck.name}」を作成しました。`});
  };

  const handleDeleteDeck = () => {
    if (!activeDeckId || decks.length <= 1) {
        toast({ variant: 'destructive', title: '最後のデッキは削除できません。'});
        return;
    }
    const deckToDelete = decks.find(d => d.id === activeDeckId);
    const newDecks = decks.filter(d => d.id !== activeDeckId);
    updateDecks(newDecks);
    setActiveDeckId(newDecks[0]?.id || null);
    toast({ title: `デッキ「${deckToDelete?.name}」を削除しました。`})
  };

  const handleRenameDeck = () => {
    if (!activeDeck || !newDeckName.trim()) {
        toast({ variant: 'destructive', title: '新しいデッキ名を入力してください。'});
        return;
    }
    const newDecks = decks.map(d => d.id === activeDeckId ? {...d, name: newDeckName.trim()} : d);
    updateDecks(newDecks);
    setNewDeckName('');
    toast({ title: 'デッキ名を変更しました。'})
  };

  const getUniqueCards = (cards: CardData[]) => {
    if (!cards) return [];
    const unique: { [key: string]: CardData } = {};
    cards.forEach(card => {
        if(card.id) {
            unique[card.id] = card;
        }
    });
    return Object.values(unique);
  };
  
  const uniqueCollection = getUniqueCards(collection);


  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <main>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">デッキ構築</h1>
      </div>
      <Card className="mb-8">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-grow w-full">
                <Label htmlFor="deck-select" className="mb-2 block">編集中のデッキ</Label>
                <Select value={activeDeckId || ''} onValueChange={setActiveDeckId}>
                    <SelectTrigger id="deck-select">
                        <SelectValue placeholder="デッキを選択..." />
                    </SelectTrigger>
                    <SelectContent>
                        {decks.map(deck => (
                            <SelectItem key={deck.id} value={deck.id}>{deck.name} ({deck.cards.length}/{DECK_SIZE})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="flex items-end gap-2 w-full md:w-auto">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline"><FilePlus className="mr-2" />新規</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>新しいデッキを作成</DialogTitle>
                            <DialogDescription>
                                新しいデッキの名前を入力してください。（最大{MAX_DECKS}個まで）
                            </DialogDescription>
                        </DialogHeader>
                        <Input 
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            placeholder="例: ドラゴンデッキ"
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button onClick={handleAddNewDeck} disabled={!newDeckName.trim() || decks.length >= MAX_DECKS}>作成</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog>
                    <DialogTrigger asChild><Button variant="outline" disabled={!activeDeck}><Pencil className="mr-2"/>名前変更</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>デッキ名を変更</DialogTitle></DialogHeader>
                        <Input 
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            placeholder={activeDeck?.name}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button onClick={handleRenameDeck} disabled={!newDeckName.trim()}>変更</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={decks.length <= 1 || !activeDeck}><Trash2 className="mr-2" />削除</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <DialogHeader>
                            <DialogTitle>本当にこのデッキを削除しますか？</DialogTitle>
                            <DialogDescription>「{activeDeck?.name}」は完全に削除されます。この操作は元に戻せません。</DialogDescription>
                        </DialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteDeck}>削除</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button onClick={saveDeck} disabled={!activeDeck || activeDeck.cards.length !== DECK_SIZE}>
                    <Save className="mr-2" />
                    保存
                </Button>
            </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Collection Column */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>マイカード ({uniqueCollection.length}種類)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {collection.length > 0 ? (
                uniqueCollection.map(card => (
                  <Card key={card.id} className="flex items-center p-2">
                    <div className="flex-grow">
                      <p className="font-semibold">{card.name}</p>
                      <p className="text-sm text-muted-foreground">
                        コスト: {card.manaCost} 攻撃: {card.attack} 防御: {card.defense}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm w-8 text-center">
                           {getCardCountInDeck(card.id)}枚
                        </span>
                        <Button size="icon" variant="outline" onClick={() => addToDeck(card)}>
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-10">
                  コレクションにカードがありません。「作成」ページでカードを作りましょう。
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Deck Column */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeDeck ? `デッキ: ${activeDeck.name}` : 'デッキを選択'} ({activeDeck?.cards.length || 0}/{DECK_SIZE})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {activeDeck && activeDeck.cards.length > 0 ? (
                getUniqueCards(activeDeck.cards).map(card => (
                  <Card key={card.id} className="flex items-center p-2">
                    <div className="flex-grow">
                      <p className="font-semibold">{card.name}</p>
                      <p className="text-sm text-muted-foreground">
                        コスト: {card.manaCost} 攻撃: {card.attack} 防御: {card.defense}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm w-8 text-center">
                           {getCardCountInDeck(card.id)}枚
                        </span>
                        <Button size="icon" variant="outline" onClick={() => removeFromDeck(card.id)}>
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-10">
                  左のカードリストからデッキに追加してください。
                </p>
              )}
            </CardContent>
             {activeDeck && activeDeck.cards.length > 0 && activeDeck.cards.length !== DECK_SIZE && (
                <CardFooter className="text-sm text-destructive-foreground bg-destructive/80 p-3 mt-4">
                    <p>デッキは{DECK_SIZE}枚で構築する必要があります。</p>
                </CardFooter>
             )}
          </Card>
        </div>
      </div>
    </main>
  );
}

    