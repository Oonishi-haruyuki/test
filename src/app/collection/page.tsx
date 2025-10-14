
'use client';

import { useEffect, useState } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
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
  

export default function CollectionPage() {
  const [collection, setCollection] = useState<CardData[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const { toast } = useToast();
  const { spendCurrency } = useCurrency();
  const EDIT_COST_PER_CHAR = 3;

  useEffect(() => {
    setIsClient(true);
    try {
      const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      setCollection(savedCollection);
    } catch (error)      console.error("Failed to load card collection from localStorage", error);
      setCollection([]);
    }
  }, []);

  const handleDeleteCard = (cardId?: string) => {
    if (!cardId) return;
    const newCollection = collection.filter(card => card.id !== cardId);
    setCollection(newCollection);
    localStorage.setItem('cardCollection', JSON.stringify(newCollection));
  };

  const handleClearCollection = () => {
    setCollection([]);
    localStorage.removeItem('cardCollection');
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
    setCollection(newCollection);
    localStorage.setItem('cardCollection', JSON.stringify(newCollection));

    toast({
        title: 'カードを更新しました',
        description: `「${updatedCard.name}」の情報を更新しました。` + (cost > 0 ? ` (${cost}G 消費)` : ''),
    });
    setEditingCard(null);
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
            <CardTitle className="text-2xl text-muted-foreground">コレクションは空です</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">「作成」ページで新しいカードを作ってコレクションに追加しましょう！</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collection.map(card => (
            <div key={card.id} className="relative group">
              <CardPreview {...card} />
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                </div>
            </div>
          ))}
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
