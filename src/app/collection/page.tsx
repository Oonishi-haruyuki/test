
'use client';

import { useEffect, useState } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
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
  

export default function CollectionPage() {
  const [collection, setCollection] = useState<CardData[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      setCollection(savedCollection);
    } catch (error) {
      console.error("Failed to load card collection from localStorage", error);
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
          ))}
        </div>
      )}
    </main>
  );
}
