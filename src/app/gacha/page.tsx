
'use client';

import { useState, useTransition } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateGachaPull, type GenerateGachaPullOutput } from '@/ai/flows/generate-gacha-pull';
import { Loader2, Dices, Save } from 'lucide-react';
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


const PULL_COST = 100;
const TEN_PULL_COST = 900; // 10% discount
const TEN_PULL_COUNT = 10;

export default function GachaPage() {
  const [pulledCards, setPulledCards] = useState<CardData[]>([]);
  const [isPending, startTransition] = useTransition();
  const [animationState, setAnimationState] = useState<{ [key: number]: 'flipping' | 'revealed' }>({});
  const { toast } = useToast();
  const { currency, spendCurrency } = useCurrency();
  const { updateMissionProgress } = useMissions();

  const handlePull = (count: number, cost: number) => {
    if (currency < cost) {
      toast({
        variant: 'destructive',
        title: 'Gコインが足りません！',
        description: `ガチャを引くには ${cost}G が必要です。`,
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
    
    setPulledCards([]);
    setAnimationState({});

    startTransition(async () => {
      try {
        const result: GenerateGachaPullOutput = await generateGachaPull({ count });
        const newCards = result.cards.map(card => ({
            ...card,
            id: self.crypto.randomUUID(),
            imageUrl: `https://picsum.photos/seed/${self.crypto.randomUUID()}/400/300`,
            theme: 'fantasy', // Default theme, can be adjusted
        })) as CardData[];
        setPulledCards(newCards);
        
        // Stagger the animation
        newCards.forEach((_, index) => {
            setTimeout(() => {
                setAnimationState(prev => ({ ...prev, [index]: 'flipping' }));
            }, index * 200);
        });
        updateMissionProgress('pull-gacha', count);

      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'ガチャの実行に失敗しました',
          description: '時間をおいて再度お試しください。',
        });
        // Refund currency on failure
        // NOTE: This is a simple refund. In a real app, a more robust transaction system is needed.
        // addCurrency(cost);
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

      <div className="flex justify-center gap-4 mb-8">
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
                    <AlertDialogAction onClick={() => handlePull(1, PULL_COST)}>実行</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="lg" disabled={isPending} className="bg-accent text-accent-foreground hover:bg-accent/90"><Dices />10回引く ({TEN_PULL_COST}G)</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>ガチャを10回引きますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                        {TEN_PULL_COST}Gを消費してカードガチャを10回引きます。1回分お得です！
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handlePull(TEN_PULL_COUNT, TEN_PULL_COST)}>実行</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>

      {isPending && (
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
                        className="relative w-full h-full transition-transform duration-700 preserve-3d"
                        style={{
                            transform: animationState[index] === 'flipping' || animationState[index] === 'revealed' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                    >
                        <div className="absolute w-full h-full backface-hidden">
                           <img src={cardBackImage} alt="Card Back" className="w-full h-full object-cover rounded-2xl border-4 border-black/50" />
                        </div>
                        <div className="absolute w-full h-full backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
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

// Add these utility classes to globals.css if they don't exist
/*
.perspective-1000 { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
*/
