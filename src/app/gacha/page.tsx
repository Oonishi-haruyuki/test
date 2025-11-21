
'use client';

import { useState, useTransition, useEffect } from 'react';
import type { CardData, Rarity } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Dices, Save, Gift } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
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
} from "@/components/ui/alert-dialog";
import { useMissions } from '@/hooks/use-missions';
import { cn } from '@/lib/utils';
import type { GenerateGachaPullOutput, GenerateGachaPullInput } from '@/ai/flows/generate-gacha-pull';


const PULL_COST = 100;
const TEN_PULL_COUNT = 10;
const TEN_PULL_COST = PULL_COST * TEN_PULL_COUNT * 0.9; // 10% discount

export default function GachaPage() {
  const [pulledCards, setPulledCards] = useState<CardData[]>([]);
  const [isPending, startTransition] = useTransition();
  const [animationState, setAnimationState] = useState<{ [key: string]: 'flipping' | 'revealed' }>({});
  const { toast } = useToast();
  const { currency, spendCurrency } = useCurrency();
  const { updateMissionProgress } = useMissions();
  const [canPullFreeGacha, setCanPullFreeGacha] = useState(false);

  useEffect(() => {
    const lastPullDate = localStorage.getItem('lastFreeGachaPull');
    const today = new Date().toDateString();
    if (lastPullDate !== today) {
      setCanPullFreeGacha(true);
    }
  }, []);


  const handlePull = (count: number, cost: number, allowedRarities?: Rarity[]) => {
    if (cost > 0 && currency < cost) {
      toast({
        variant: 'destructive',
        title: 'Gコインが足りません！',
        description: `ガチャを引くには ${cost}G が必要です。`,
      });
      return;
    }
    
    startTransition(async () => {
      if (cost > 0 && !spendCurrency(cost)) {
        toast({
            variant: 'destructive',
            title: 'Gコインの支払いに失敗しました。',
        });
        return;
      }
      
      if (cost === 0) { // Free gacha logic
        const today = new Date().toDateString();
        localStorage.setItem('lastFreeGachaPull', today);
        setCanPullFreeGacha(false);
      }
    
      setPulledCards([]);
      setAnimationState({});

      try {
        const response = await fetch('/api/generateGachaPull', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ count, allowedRarities } as GenerateGachaPullInput),
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const result: GenerateGachaPullOutput = await response.json();

        const newCards = result.cards.map(card => ({
            ...card,
            id: self.crypto.randomUUID(),
            imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`,
            theme: 'fantasy', // Default theme, can be adjusted
        })) as CardData[];
        setPulledCards(newCards);
        
        // Stagger the animation
        newCards.forEach((card, index) => {
            setTimeout(() => {
                setAnimationState(prev => ({ ...prev, [card.id!]: 'flipping' }));
                setTimeout(() => {
                     setAnimationState(prev => ({ ...prev, [card.id!]: 'revealed' }));
                }, 700);
            }, index * 150);
        });
        updateMissionProgress('pull-gacha', count);

      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'ガチャの実行に失敗しました',
          description: '時間をおいて再度お試しください。',
        });
        // In a real app, a more robust transaction system is needed for refunds.
      }
    });
  };

  const handleSaveAll = () => {
    try {
        const collection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
        const newCollection = [...collection, ...pulledCards];
        localStorage.setItem('cardCollection', JSON.stringify(newCollection));
        toast({
            title: `${pulledCards.length}枚のカードをコレクションに保存しました！`
        });
        setPulledCards([]); // Clear the pulled cards after saving
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: '保存に失敗しました',
            description: 'カードをコレクションに保存できませんでした。'
        });
    }
  };
  
  const defaultBack = 'https://storage.googleapis.com/card-crafter-studio.appspot.com/backs/back_default.png';
  const cardBackImage = typeof window !== 'undefined' ? localStorage.getItem('cardBackImage') || defaultBack : defaultBack;


  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">カードガチャ</h1>
        <p className="text-muted-foreground mt-2">運命の一枚を引き当てよう！</p>
      </div>

      <div className="flex justify-center flex-wrap gap-4 mb-8">
        <Button size="lg" onClick={() => handlePull(10, 0, ['common', 'rare'])} disabled={isPending || !canPullFreeGacha} variant="outline">
            <Gift className="mr-2" />
            無料10連ガチャを引く (1日1回)
        </Button>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="lg" disabled={isPending}><Dices />1回引く ({PULL_COST}G)</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>ガチャを1回引きますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                        {PULL_COST}Gを消費してカードガチャを1回引きます。よろしいですか？
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handlePull(1, PULL_COST)} disabled={isPending}>実行</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="lg" disabled={isPending} className="bg-accent text-accent-foreground hover:bg-accent/90"><Dices />{TEN_PULL_COUNT}回引く ({TEN_PULL_COST}G)</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>ガチャを{TEN_PULL_COUNT}回引きますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                        {TEN_PULL_COST}Gを消費してカードガチャを{TEN_PULL_COUNT}回引きます。1回分お得です！
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handlePull(TEN_PULL_COUNT, TEN_PULL_COST)} disabled={isPending}>実行</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>

      {isPending && !pulledCards.length && (
        <div className="flex flex-col items-center justify-center text-center my-12">
          <Loader2 className="animate-spin h-12 w-12 text-primary" />
          <p className="mt-4 text-muted-foreground">カードを生成中...</p>
        </div>
      )}

      {pulledCards.length > 0 && (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {pulledCards.map((card, index) => (
                <div key={card.id} className="perspective-[1000px]">
                    <div
                        className={cn(
                            "relative w-full aspect-[3/4] transition-transform duration-700 preserve-3d",
                            (animationState[card.id!] === 'flipping' || animationState[card.id!] === 'revealed') && "rotate-y-180",
                        )}
                    >
                        <div className="absolute w-full h-full backface-hidden">
                           <img src={cardBackImage} alt="Card Back" className="w-full h-full object-cover rounded-2xl border-4 border-black/50" />
                        </div>
                        <div className="absolute w-full h-full backface-hidden rotate-y-180">
                            <CardPreview {...card} />
                        </div>
                    </div>
                </div>
            ))}
            </div>
            <div className="text-center mt-8">
                <Button size="lg" onClick={handleSaveAll} disabled={isPending}>
                    <Save className="mr-2"/>
                    すべてコレクションに保存
                </Button>
            </div>
        </>
      )}

    </div>
  );
}
