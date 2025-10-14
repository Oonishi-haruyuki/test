
'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coins, Swords, Shield, Trophy, Star, Library, Users, Skull, Bot } from 'lucide-react';
import type { CardData } from '@/components/card-editor';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyPage() {
  const { currency } = useCurrency();
  const { wins, losses } = useStats();
  const [collection, setCollection] = useState<CardData[]>([]);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      const savedDeck = JSON.parse(localStorage.getItem('deck') || '[]');
      setCollection(savedCollection);
      setDeck(savedDeck);
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const getUniqueCardCount = (cards: CardData[]) => {
    if (!cards || cards.length === 0) return 0;
    const ids = new Set(cards.map(card => card.id));
    return ids.size;
  };

  const uniqueCardCount = getUniqueCardCount(collection);
  
  const StatCard = ({ title, value, icon, description, loading }: { title: string, value: string | number, icon: React.ReactNode, description: string, loading?: boolean }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div> }
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <main>
        <div className="mb-8">
            <h1 className="text-3xl font-bold">マイページ</h1>
            <p className="text-muted-foreground">あなたの活動記録です。</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
                title="所持Gコイン"
                value={`${currency.toLocaleString()} G`}
                icon={<Coins className="h-4 w-4 text-muted-foreground" />}
                description="ガチャや今後のショップで使用できます"
                loading={!isClient}
            />
            <StatCard 
                title="カード収集率"
                value={`${uniqueCardCount} 種類`}
                icon={<Library className="h-4 w-4 text-muted-foreground" />}
                description="集めたユニークなカードの数"
                loading={!isClient}
            />
            <StatCard 
                title="現在のデッキ枚数"
                value={`${deck.length} / 20 枚`}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                description="対戦で使用するデッキ"
                loading={!isClient}
            />
             <StatCard 
                title="対戦勝利数"
                value={wins}
                icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
                description="AIとの対戦での勝利数"
                loading={!isClient}
            />
             <StatCard 
                title="対戦敗北数"
                value={losses}
                icon={<Skull className="h-4 w-4 text-muted-foreground" />}
                description="AIとの対戦での敗北数"
                loading={!isClient}
            />
        </div>
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>今後のアップデート</CardTitle>
                <CardDescription>今後、マイページには以下のような機能が追加される予定です。</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>対戦の勝率の表示</li>
                    <li>お気に入りのカードやデッキの登録機能</li>
                    <li>獲得した称号や実績の表示</li>
                    <li>カード収集率に基づいた報酬の受け取り</li>
                </ul>
            </CardContent>
        </Card>
    </main>
  );
}

    