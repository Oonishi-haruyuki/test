
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollectionCardEditor } from '@/components/collection-card-editor';
import { useCurrency } from '@/hooks/use-currency';

export default function CollectionPage() {
  const [collection, setCollection] = useState<CardData[]>([]);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const { toast } = useToast();
  const { currency, spendCurrency } = useCurrency();

  useEffect(() => {
    try {
      const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      setCollection(savedCollection);
    } catch (e) {
      console.error("Failed to load collection from localStorage", e);
      toast({
        variant: "destructive",
        title: "コレクションの読み込みに失敗しました",
      });
    }
  }, [toast]);

  const handleSaveEdit = (updatedCard: CardData) => {
    const cost = useMemo(() => {
        if (!editingCard) return 0;
        const EDIT_COST_PER_CHAR = 3;
        const nameDiff = updatedCard.name.length - editingCard.name.length;
        const abilitiesDiff = updatedCard.abilities.length - editingCard.abilities.length;
        const flavorTextDiff = updatedCard.flavorText.length - editingCard.flavorText.length;
        return (Math.abs(nameDiff) + Math.abs(abilitiesDiff) + Math.abs(flavorTextDiff)) * EDIT_COST_PER_CHAR;
    }, [editingCard, updatedCard])();
    
    if (currency < cost) {
        toast({
            variant: "destructive",
            title: "Gコインが足りません！",
            description: `このカードの変更には ${cost}G が必要ですが、${currency}G しかありません。`,
        });
        return;
    }

    if (!spendCurrency(cost)) {
        toast({
            variant: "destructive",
            title: "Gコインの支払いに失敗しました。",
        });
        return;
    }

    const newCollection = collection.map(c => (c.id === updatedCard.id ? updatedCard : c));
    setCollection(newCollection);
    localStorage.setItem('cardCollection', JSON.stringify(newCollection));
    setEditingCard(null);
    toast({
      title: 'カードを更新しました',
      description: `「${updatedCard.name}」への変更が保存されました。(${cost}G 消費)`,
    });
  };

  const deleteCard = (cardId: string) => {
    const newCollection = collection.filter(c => c.id !== cardId);
    setCollection(newCollection);
    localStorage.setItem('cardCollection', JSON.stringify(newCollection));
    toast({
      title: 'カードを削除しました',
    });
  };

  const filteredAndSortedCollection = useMemo(() => {
    return collection
      .filter(card => card.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        switch (sortOrder) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'manaCost-asc':
            return a.manaCost - b.manaCost;
          case 'manaCost-desc':
            return b.manaCost - a.manaCost;
          case 'rarity-asc':
            const rarities = ['common', 'uncommon', 'rare', 'mythic'];
            return rarities.indexOf(a.rarity) - rarities.indexOf(b.rarity);
          case 'rarity-desc':
            const raritiesDesc = ['common', 'uncommon', 'rare', 'mythic'];
            return raritiesDesc.indexOf(b.rarity) - raritiesDesc.indexOf(a.rarity);
          default:
            return 0;
        }
      });
  }, [collection, searchTerm, sortOrder]);
  
  if (editingCard) {
    return (
        <div className="container mx-auto p-4">
             <h1 className="text-3xl font-bold mb-6">カードの編集</h1>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <CollectionCardEditor 
                        card={editingCard} 
                        onSave={handleSaveEdit}
                        onCancel={() => setEditingCard(null)}
                    />
                </div>
                <div>
                    <CardPreview {...editingCard} />
                </div>
             </div>
        </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">マイカードコレクション ({collection.length}枚)</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="カード名で検索..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="並び順" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">名前 (昇順)</SelectItem>
            <SelectItem value="name-desc">名前 (降順)</SelectItem>
            <SelectItem value="manaCost-asc">マナコスト (低い順)</SelectItem>
            <SelectItem value="manaCost-desc">マナコスト (高い順)</SelectItem>
            <SelectItem value="rarity-desc">レアリティ (高い順)</SelectItem>
            <SelectItem value="rarity-asc">レアリティ (低い順)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {collection.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">コレクションにカードがありません。</p>
          <p className="text-muted-foreground mt-2">「作成」ページで新しいカードを作ってみましょう！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAndSortedCollection.map(card => (
            <div key={card.id} className="relative group">
              <CardPreview {...card} />
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" onClick={() => setEditingCard(card)}>編集</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">削除</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                      <AlertDialogDescription>
                        「{card.name}」をコレクションから削除します。この操作は取り消せません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCard(card.id!)}>削除</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
