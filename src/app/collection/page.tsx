
'use client';

import { useEffect, useState } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, ArrowUpCircle } from 'lucide-react';
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { CollectionCardEditor } from '@/components/collection-card-editor';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/use-currency';
import { useInventory } from '@/hooks/use-inventory';
import { useUser } from '@/firebase';

// Levenshtein distance to calculate the difference between two strings
const levenshtein = (s1: string, s2: string): number => {
    if (s1.length < s2.length) {
      return levenshtein(s2, s1);
    }
    if (s2.length === 0) {
      return s1.length;
    }
    let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
    for (let i = 0; i < s1.length; i++) {
      let currentRow = [i + 1];
      for (let j = 0; j < s2.length; j++) {
        let insertions = previousRow[j + 1] + 1;
        let deletions = currentRow[j] + 1;
        let substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);
        currentRow.push(Math.min(insertions, deletions, substitutions));
      }
      previousRow = currentRow;
    }
    return previousRow[previousRow.length - 1];
};

const evolutions: Record<string, { to: Partial<CardData>, cost: { 'dragon-soul': number } }> = {
    'ドラゴンの雛': {
        to: {
            id: 'starter-dragon-3', // Evolved card's ID
            name: '若きドラゴン',
            manaCost: 4,
            attack: 3,
            defense: 3,
            rarity: 'uncommon',
            abilities: '飛行、速攻',
            flavorText: '空を焦がす、若き炎。',
            imageUrl: 'https://picsum.photos/seed/sd3/400/300',
            imageHint: 'young dragon'
        },
        cost: { 'dragon-soul': 3 }
    }
};

  

export default function CollectionPage() {
  const { user } = useUser();
  const [collection, setCollection] = useState<CardData[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const { toast } = useToast();
  const { spendCurrency } = useCurrency();
  const { inventory, removeItem } = useInventory();
  const EDIT_COST_PER_CHAR = 3;

  useEffect(() => {
    setIsClient(true);
    if (user) {
        try {
          const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
          setCollection(savedCollection);
        } catch (error) {
            console.error("Failed to load card collection from localStorage", error);
            setCollection([]);
        }
    } else {
        setCollection([]);
    }
  }, [user]);

  const updateCollection = (newCollection: CardData[]) => {
    setCollection(newCollection);
    if (user) {
        localStorage.setItem('cardCollection', JSON.stringify(newCollection));
    }
  }

  const handleDeleteCard = (cardId?: string) => {
    if (!cardId) return;
    const newCollection = collection.filter(card => card.id !== cardId);
    updateCollection(newCollection);
  };

  const handleClearCollection = () => {
    updateCollection([]);
  };

  const handleSaveEdit = (originalCard: CardData, updatedCard: CardData) => {
    const nameDiff = levenshtein(originalCard.name, updatedCard.name);
    const abilitiesDiff = levenshtein(originalCard.abilities, updatedCard.abilities);
    const flavorTextDiff = levenshtein(originalCard.flavorText, updatedCard.flavorText);
    
    const totalChanges = nameDiff + abilitiesDiff + flavorTextDiff;
    const cost = totalChanges * EDIT_COST_PER_CHAR;

    if (cost > 0) {
        if (!spendCurrency(cost)) {
            toast({
                variant: 'destructive',
                title: 'Gコインが足りません！',
                description: `この変更には ${cost}G が必要です。`,
            });
            return;
        }
    }

    const newCollection = collection.map(card => card.id === updatedCard.id ? updatedCard : card);
    updateCollection(newCollection);

    toast({
        title: 'カードを更新しました',
        description: `「${updatedCard.name}」の情報を更新しました。` + (cost > 0 ? ` (${cost}G 消費)` : ''),
    });
    setEditingCard(null);
  }

  const handleEvolveCard = (cardToEvolve: CardData) => {
    const evolutionInfo = evolutions[cardToEvolve.name];
    if (!evolutionInfo) return;

    const material = Object.keys(evolutionInfo.cost)[0] as keyof typeof inventory;
    const requiredAmount = evolutionInfo.cost[material];
    const userAmount = inventory[material] || 0;
    
    if (userAmount < requiredAmount) {
        toast({ variant: 'destructive', title: '素材が足りません！', description: `進化には 竜の魂 が ${requiredAmount}個 必要です。`});
        return;
    }
    
    if (removeItem(material, requiredAmount)) {
        // Remove one instance of the old card
        const cardIndex = collection.findIndex(c => c.id === cardToEvolve.id);
        const newCollection = [...collection];
        if (cardIndex > -1) {
            newCollection.splice(cardIndex, 1);
        }

        // Add the new evolved card
        const evolvedCard: CardData = {
            ...cardToEvolve,
            ...evolutionInfo.to,
            id: self.crypto.randomUUID() // Give it a new unique ID
        };
        newCollection.push(evolvedCard);

        updateCollection(newCollection);

        toast({ title: '進化した！', description: `「${cardToEvolve.name}」が「${evolvedCard.name}」に進化しました！`});
    } else {
         toast({ variant: 'destructive', title: '進化に失敗しました', description: '素材の消費に失敗しました。'});
    }
  }

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <main>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">マイカード</h1>
            {collection.length > 0 && (
                 <AlertDialog>
                 <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2" />
                        全件削除
                    </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>本当によろしいですか？</AlertDialogTitle>
                     <AlertDialogDescription>
                       この操作は元に戻せません。コレクション内のすべてのカードが完全に削除されます。
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>キャンセル</AlertDialogCancel>
                     <AlertDialogAction onClick={handleClearCollection}>削除</AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
            )}
        </div>

      {collection.length === 0 ? (
        <Card className="text-center py-20">
          <CardHeader>
            <CardTitle className="text-2xl text-muted-foreground">{user ? 'コレクションは空です' : 'ログインしていません'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{user ? '「作成」ページで新しいカードを作ってコレクションに追加しましょう！' : 'カードを保存・閲覧するには、マイページからログインしてください。'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collection.map(card => {
            const canEvolve = card.name in evolutions;
            const evolutionInfo = canEvolve ? evolutions[card.name] : null;

            return (
            <div key={card.id} className="relative group">
              <CardPreview {...card} />
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="icon" onClick={() => setEditingCard(card)}>
                        <Pencil size={20} />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 size={20} />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>このカードを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                            この操作は元に戻せません。「{card.name}」をコレクションから削除します。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCard(card.id)}>削除</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    {canEvolve && evolutionInfo && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="default" size="icon" className="bg-yellow-500 hover:bg-yellow-600">
                                    <ArrowUpCircle size={20} />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>カードを進化させますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                    「{card.name}」を「{evolutionInfo.to.name}」に進化させます。
                                    <p className="font-bold mt-2">消費アイテム: 竜の魂 x{evolutionInfo.cost['dragon-soul']}</p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleEvolveCard(card)}>進化させる</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
          )})}
        </div>
      )}

      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>カードを編集</DialogTitle>
                <DialogDescription>
                    カードのテキスト情報を編集します。変更内容に応じてGコインが消費されます。(1文字あたり{EDIT_COST_PER_CHAR}G)
                </DialogDescription>
            </DialogHeader>
            {editingCard && (
                <CollectionCardEditor 
                    card={editingCard}
                    onSave={(updatedCard) => handleSaveEdit(editingCard, updatedCard)}
                    onCancel={() => setEditingCard(null)}
                />
            )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

    