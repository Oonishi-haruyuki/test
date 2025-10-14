
'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coins, Swords, Shield, Trophy, Star, Library, Users, Skull, Bot } from 'lucide-react';
import type { CardData } from '@/components/card-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { AchievementsUI, type Achievement } from '@/components/ui/achievements';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';

export default function MyPage() {
  const { currency, setCurrency } = useCurrency();
  const { wins, losses } = useStats();
  const [collection, setCollection] = useState<CardData[]>([]);
  const [deck, setDeck] = useState<CardData[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>('未設定');
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
      const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      const savedDeck = JSON.parse(localStorage.getItem('deck') || '[]');
      const savedTitle = localStorage.getItem('selectedTitle') || '未設定';
      const savedClaimedRewards = JSON.parse(localStorage.getItem('claimedRewards') || '[]');
      setCollection(savedCollection);
      setDeck(savedDeck);
      setSelectedTitle(savedTitle);
      setClaimedRewards(savedClaimedRewards);
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

  const handleTitleChange = (title: string) => {
      setSelectedTitle(title);
      localStorage.setItem('selectedTitle', title);
  }

  const handleClaimRewards = (reward: number) => {
    const newCurrency = currency + reward;
    setCurrency(newCurrency);
    const achievementsToClaim = achievementsList.filter(ach => {
        let unlocked = false;
        if (ach.id.startsWith('wins-')) {
            const requiredWins = parseInt(ach.id.split('-')[1]);
            unlocked = wins >= requiredWins;
        } else if (ach.id.startsWith('collection-')) {
            const requiredCount = parseInt(ach.id.split('-')[1]);
            unlocked = uniqueCardCount >= requiredCount;
        }
        return unlocked && !claimedRewards.includes(ach.id);
    });
    const newClaimedRewards = [...claimedRewards, ...achievementsToClaim.map(ach => ach.id)];
    setClaimedRewards(newClaimedRewards);
    localStorage.setItem('claimedRewards', JSON.stringify(newClaimedRewards));
    toast({
        title: "報酬を受け取りました！",
        description: `${reward}Gを獲得しました。`,
    });
  }
  
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
                title="称号"
                value={selectedTitle}
                icon={<Star className="h-4 w-4 text-muted-foreground" />}
                description="設定した称号"
                loading={!isClient}
            />
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
                value={`${deck.length} / 30 枚`}
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

        <div className="mt-8">
            <AchievementsUI wins={wins} uniqueCardCount={uniqueCardCount} onTitleChange={handleTitleChange} onClaimRewards={handleClaimRewards} claimedRewards={claimedRewards} />
        </div>

        <Card className="mt-8">
            <CardHeader>
                <CardTitle>今後のアップデート</CardTitle>
                <CardDescription>今後、マイページには以下のような機能が追加される予定です。</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>AI対戦内容の改善</li>
                    <li>デッキ登録数を30個までにすること</li>
                </ul>
            </CardContent>
        </Card>
    </main>
  );
}

const achievementsList: Omit<Achievement, 'unlocked' | 'claimed'>[] = [
    { id: 'wins-1', name: '初勝利', description: '初めてAIに勝利する', reward: 100 },
    { id: 'wins-10', name: 'ベテラン', description: 'AIに10回勝利する', reward: 500 },
    { id: 'wins-50', name: 'エキスパート', description: 'AIに50回勝利する', reward: 1000 },
    { id: 'wins-100', name: 'マスター', description: 'AIに100回勝利する', reward: 5000 },
    { id: 'collection-10', name: 'コレクター', description: '10種類のカードを集める', reward: 200 },
    { id: 'collection-50', name: 'マスターコレクター', description: '50種類のカードを集める', reward: 1000 },
    { id: 'collection-100', name: 'コンプリート', description: '100種類のカードを集める', reward: 10000 },
];
