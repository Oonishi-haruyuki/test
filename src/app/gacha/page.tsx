
'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateGachaPull } from '@/ai/flows/generate-gacha-pull';
import { Loader2, Save, Wand2, Coins } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { useMissions } from '@/hooks/use-missions';
import Image from 'next/image';

const GACHA_COST_SINGLE = 50;
const GACHA_COST_MULTI = 500;


export default function GachaPage() {
  const [isPending, setIsPending] = useState(false);
  const [pulledCards, setPulledCards] = useState<CardData[]>([]);
  const { toast } = useToast();
  const { currency, spendCurrency } = useCurrency();
  const { updateMissionProgress } = useMissions();
  const [isClient, setIsClient] = useState(false);
  const [cardBackImage, setCardBackImage] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const savedCardBack = localStorage.getItem('cardBackImage');
    if (savedCardBack) {
        setCardBackImage(savedCardBack);
    }
  }, []);

  const handlePullGacha = async (pullCount: number) => {
    const cost = pullCount === 1 ? GACHA_COST_SINGLE : GACHA_COST_MULTI;
    
    if (currency < cost) {
        toast({
            variant: 'destructive',
            title: 'Gコインが足りません！',
            description: `ガチャを引くには${cost}Gが必要です。`,
        });
        return;
    }
    
    if (!spendCurrency(cost)) {
        toast({
            variant: 'destructive',
            title: 'Gコインの支払いに失敗しました。',
        });
        return;
    }

    setIsPending(true);
    setPulledCards([]);
    try {
      const result = await generateGachaPull({ count: pullCount });
      const newCards: CardData[] = result.cards.map((card, index) => ({
        ...card,
        id: self.crypto.randomUUID(),
        theme: 'fantasy', // Default theme for display
        imageUrl: `https://picsum.photos/seed/gacha${Date.now()}${index}/${400}/${300}`,
      }));
      setPulledCards(newCards);
      updateMissionProgress('pull-gacha', pullCount);
      toast({
        title: 'ガチャを引きました！',
        description: `${pullCount}枚のカードを獲得しました。`,
      });
    } catch (error) {
      console.error('Gacha pull failed', error);
      toast({
        variant: 'destructive',
        title: 'ガチャの実行に失敗しました',
        description: '時間をおいて再度お試しください。',
      });
      // Rollback currency if gacha fails
    //   addCurrency(cost); // This might be desired depending on UX choice
    } finally {
      setIsPending(false);
    }
  };

  const handleSaveToCollection = () => {
    if (pulledCards.length === 0) return;
    try {
      const collection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      const newCollection = [...collection, ...pulledCards];
      localStorage.setItem('cardCollection', JSON.stringify(newCollection));
      toast({
        title: 'コレクションに保存しました',
        description: `${pulledCards.length}枚のカードをマイカードに追加しました。`,
      });
      setPulledCards([]); // Clear pulled cards after saving
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: '保存に失敗しました',
        description: 'カードをコレクションに保存できませんでした。',
      });
    }
  };
  
  const CardBack = () => (
    <div className="w-full h-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-8 border-slate-700">
        {cardBackImage ? (
            <Image src={cardBackImage} alt="Card Back" width={400} height={560} className="w-full h-full object-cover" unoptimized />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">CARD</div>
        )}
    </div>
);


  if (!isClient) {
    return null;
  }

  return (
    <main className="container mx-auto">
      <Card className="max-w-2xl mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-3xl">カードガチャ</CardTitle>
          <CardDescription>新しいカードを手に入れよう！</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-stretch gap-4">
            <Button onClick={() => handlePullGacha(1)} disabled={isPending} className="flex-1 h-auto py-4">
                <div className="flex flex-col gap-2 items-center">
                    {isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    <span>1回ガチャを引く</span>
                    <div className="flex items-center gap-1 font-semibold text-base">
                        <Coins className="h-4 w-4 text-yellow-300" />
                        <span>{GACHA_COST_SINGLE} G</span>
                    </div>
                </div>
          </Button>
          <Button onClick={() => handlePullGacha(10)} disabled={isPending} size="lg" className="flex-1 h-auto py-4">
             <div className="flex flex-col gap-2 items-center">
                {isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
                <span>10連ガチャを引く</span>
                <div className="flex items-center gap-1 font-semibold text-base">
                    <Coins className="h-4 w-4 text-yellow-300" />
                    <span>{GACHA_COST_MULTI} G</span>
                </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {isPending && (
         <div className="text-center p-10">
            <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
                <p className="text-lg text-muted-foreground">カードを生成中...</p>
            </div>
        </div>
      )}

      {pulledCards.length > 0 && (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">ガチャ結果</h2>
                <Button onClick={handleSaveToCollection}>
                    <Save className="mr-2" />
                    すべてコレクションに保存
                </Button>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {pulledCards.map((card, index) => (
                <div key={card.id} className="[perspective:1000px]">
                    <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]" style={{ animation: `flip 0.8s ${index * 0.1}s 1 ease-in-out forwards` }}>
                         <div className="absolute [backface-visibility:hidden]">
                             <CardBack />
                         </div>
                         <div className="absolute [transform:rotateY(180deg)] [backface-visibility:hidden]">
                            <CardPreview {...card} />
                        </div>
                    </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
