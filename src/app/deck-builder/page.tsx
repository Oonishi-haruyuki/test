
'use client';

import { useEffect, useState } from 'react';
import type { CardData } from '@/components/card-editor';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MinusCircle, Save } from 'lucide-react';

const DECK_SIZE = 30;
const MAX_IDENTICAL_CARDS = 2;

export default function DeckBuilderPage() {
  const [collection, setCollection] = useState<CardData[]>([]);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
      const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      const savedDeck = JSON.parse(localStorage.getItem('deck') || '[]');
      setCollection(savedCollection);
      setDeck(savedDeck);
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setCollection([]);
      setDeck([]);
    }
  }, []);

  const getCardCountInDeck = (cardId?: string) => {
    if (!cardId) return 0;
    return deck.filter(card => card.id === cardId).length;
  }

  const addToDeck = (card: CardData) => {
    if (deck.length >= DECK_SIZE) {
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

    setDeck(prevDeck => [...prevDeck, card]);
  };

  const removeFromDeck = (cardId?: string) => {
    if (!cardId) return;
    setDeck(prevDeck => {
        const cardIndex = prevDeck.findIndex(c => c.id === cardId);
        if (cardIndex > -1) {
            const newDeck = [...prevDeck];
            newDeck.splice(cardIndex, 1);
            return newDeck;
        }
        return prevDeck;
    });
  };

  const saveDeck = () => {
    try {
      if (deck.length !== DECK_SIZE) {
        toast({
            variant: 'destructive',
            title: 'デッキの枚数が不正です',
            description: `デッキはちょうど${DECK_SIZE}枚で構築する必要があります。`,
        });
        return;
      }
      localStorage.setItem('deck', JSON.stringify(deck));
      toast({
        title: 'デッキを保存しました',
        description: `現在のデッキ構成が保存されました。`,
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

  const getUniqueCards = (cards: CardData[]) => {
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">デッキ構築</h1>
        <Button onClick={saveDeck} disabled={deck.length !== DECK_SIZE}>
          <Save className="mr-2" />
          デッキを保存
        </Button>
      </div>
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
              <CardTitle>現在のデッキ ({deck.length}/{DECK_SIZE})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {deck.length > 0 ? (
                getUniqueCards(deck).map(card => (
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
             {deck.length > 0 && deck.length !== DECK_SIZE && (
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
