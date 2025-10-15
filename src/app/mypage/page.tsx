
'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coins, Trophy, Star, Library, Users, Skull, LogIn } from 'lucide-react';
import type { CardData } from '@/components/card-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { AchievementsUI, type Achievement } from '@/components/ui/achievements';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MyPage() {
  const { addCurrency } = useCurrency();
  const { wins, losses } = useStats();
  const { user, profile, isUserLoading } = useUser();
  const [collection, setCollection] = useState<CardData[]>([]);
  const [decks, setDecks] = useState<{id: string, name: string, cards: CardData[]}[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>('未設定');
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
      const savedCollection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
      const savedDecks = JSON.parse(localStorage.getItem('decks') || '[]');
      const savedTitle = localStorage.getItem('selectedTitle') || '未設定';
      const savedClaimedRewards = JSON.parse(localStorage.getItem('claimedRewards') || '[]');
      setCollection(savedCollection);
      setDecks(savedDecks);
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
    if (reward <= 0) return;
    addCurrency(reward);

    // This logic now happens inside the AchievementsUI component, we just need to update our state here.
    const newClaimedRewards = [
        ...claimedRewards,
        ...achievements.filter(ach => ach.unlocked && !ach.claimed).map(ach => ach.id)
    ];

    setClaimedRewards(newClaimedRewards);
    localStorage.setItem('claimedRewards', JSON.stringify(newClaimedRewards));

    toast({
        title: "報酬を受け取りました！",
        description: `${reward}Gを獲得しました。`,
    });
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

  const achievements: Achievement[] = achievementsList.map(ach => {
        let unlocked = false;
        if (ach.id.startsWith('wins-')) {
            const requiredWins = parseInt(ach.id.split('-')[1]);
            unlocked = wins >= requiredWins;
        } else if (ach.id.startsWith('collection-')) {
            const requiredCount = parseInt(ach.id.split('-')[1]);
            unlocked = uniqueCardCount >= requiredCount;
        }
        const claimed = claimedRewards.includes(ach.id);
        return { ...ach, unlocked, claimed };
    });

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

  if (isUserLoading) {
    return (
        <main>
            <div className="mb-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
        </main>
    )
  }

  if (!user) {
    return (
        <main className="text-center">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>ログインが必要です</CardTitle>
                    <CardDescription>マイページの情報を表示するには、ログインしてください。</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/login"><LogIn className="mr-2"/>ログインページへ</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    )
  }

  return (
    <main>
        <div className="mb-8">
            <h1 className="text-3xl font-bold">{profile?.name || user.email}のマイページ</h1>
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
                title="デッキ数"
                value={`${decks.length} 個`}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
                description="作成したデッキの数"
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
            <AchievementsUI 
                wins={wins} 
                uniqueCardCount={uniqueCardCount} 
                onTitleChange={handleTitleChange} 
                onClaimRewards={handleClaimRewards} 
                claimedRewards={claimedRewards} 
            />
        </div>

        <Card className="mt-8">
            <CardHeader>
                <CardTitle>今後のアップデート</CardTitle>
                <CardDescription>今後、カードクラフターには以下のような機能が追加される予定です。</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    <li>ショップ機能の実装（Gコインでカードフレームやカード裏面を購入）</li>
                    <li>オンライン対戦（PVP）モードの追加</li>
                    <li>デイリー/ウィークリーミッション機能</li>
                    <li>ランキングシステム（対戦レーティングなど）</li>
                    <li>カードトレード機能</li>
                    <li>デッキ分析AIの強化（シナジーや改善案の提案）</li>
                    <li>新しいカードテーマ（海賊、神話など）の追加</li>
                    <li>ストーリーモードの実装</li>
                    <li>AI対戦の難易度追加（超級など）</li>
                    <li>カードのアニメーション効果の追加</li>
                </ul>
            </CardContent>
        </Card>
    </main>
  );
}
