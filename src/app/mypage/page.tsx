
'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coins, Trophy, Star, Library, Users, Skull, User } from 'lucide-react';
import type { CardData } from '@/components/card-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { AchievementsUI, type Achievement } from '@/components/ui/achievements';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useProfile, type ProfileId, PROFILES } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';

export default function MyPage() {
  const { activeProfile, setActiveProfile } = useProfile();
  const { currency, addCurrency } = useCurrency();
  const { wins, losses } = useStats();

  const [collection, setCollection] = useState<CardData[]>([]);
  const [decks, setDecks] = useState<{id: string, name: string, cards: CardData[]}[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>('未設定');
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    // Data for the active profile is now managed by the hooks
    if (!activeProfile) return;
    try {
      const savedCollection = JSON.parse(localStorage.getItem(`${activeProfile}-cardCollection`) || '[]');
      const savedDecks = JSON.parse(localStorage.getItem(`${activeProfile}-decks`) || '[]');
      const savedTitle = localStorage.getItem(`${activeProfile}-selectedTitle`) || '未設定';
      const savedClaimedRewards = JSON.parse(localStorage.getItem(`${activeProfile}-claimedRewards`) || '[]');
      setCollection(savedCollection);
      setDecks(savedDecks);
      setSelectedTitle(savedTitle);
      setClaimedRewards(savedClaimedRewards);
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, [activeProfile]);

  // Save data when it changes
  useEffect(() => {
    if (!isClient || !activeProfile) return;
    localStorage.setItem(`${activeProfile}-selectedTitle`, selectedTitle);
  }, [selectedTitle, activeProfile, isClient]);

  useEffect(() => {
    if (!isClient || !activeProfile) return;
    localStorage.setItem(`${activeProfile}-claimedRewards`, JSON.stringify(claimedRewards));
  }, [claimedRewards, activeProfile, isClient]);
  

  const getUniqueCardCount = (cards: CardData[]) => {
    if (!cards || cards.length === 0) return 0;
    const ids = new Set(cards.map(card => card.id));
    return ids.size;
  };

  const getDisplayName = () => {
    return PROFILES[activeProfile].name;
  }

  const uniqueCardCount = getUniqueCardCount(collection);

  const handleTitleChange = (title: string) => {
      setSelectedTitle(title);
  }

 const handleClaimRewards = (reward: number) => {
    if (reward <= 0) return;
    addCurrency(reward);

    const achievementsToClaim = achievements.filter(ach => ach.unlocked && !claimedRewards.includes(ach.id));
    const newClaimedRewards = [
        ...claimedRewards,
        ...achievementsToClaim.map(ach => ach.id)
    ];

    setClaimedRewards(newClaimedRewards);

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
  
  if (!isClient) {
    return (
         <main>
            <div className="mb-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-1/2 mt-2" />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="" value="" icon={<div/>} description="" loading />
                <StatCard title="" value="" icon={<div/>} description="" loading />
                <StatCard title="" value="" icon={<div/>} description="" loading />
                <StatCard title="" value="" icon={<div/>} description="" loading />
                <StatCard title="" value="" icon={<div/>} description="" loading />
                <StatCard title="" value="" icon={<div/>} description="" loading />
             </div>
        </main>
    )
  }

  return (
    <main>
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>アカウント切り替え</CardTitle>
                <CardDescription>テストプレイ用のアカウントを切り替えます。データは各アカウントごとに保存されます。</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
                {(Object.keys(PROFILES) as ProfileId[]).map(profileId => (
                    <Button 
                        key={profileId}
                        variant={activeProfile === profileId ? 'default' : 'outline'}
                        onClick={() => setActiveProfile(profileId)}
                        className="flex-1"
                    >
                        <User className="mr-2" />
                        {PROFILES[profileId].name}
                    </Button>
                ))}
            </CardContent>
        </Card>

        <div className="mb-8">
            <h1 className="text-3xl font-bold">{getDisplayName()}のマイページ</h1>
            <p className="text-muted-foreground">あなたのアクティビティと実績</p>
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
                achievements={achievements} 
                onTitleChange={handleTitleChange} 
                onClaimRewards={handleClaimRewards}
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
