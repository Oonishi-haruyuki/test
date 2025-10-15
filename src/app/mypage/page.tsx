
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coins, Trophy, Star, Library, Users, Skull, User, LogIn } from 'lucide-react';
import type { CardData } from '@/components/card-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { AchievementsUI, type Achievement } from '@/components/ui/achievements';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useProfile, PROFILES, type ProfileId } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';
import { useUser, loginWithId, signUpWithId, loginWithGoogle } from '@/firebase/auth/use-user';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
    loginId: z.string().min(1, { message: 'ログインIDを入力してください。' }),
    password: z.string().min(6, { message: 'パスワードは6文字以上で入力してください。' }),
});
type LoginSchema = z.infer<typeof loginSchema>;


export default function MyPage() {
    const { user, profile, isUserLoading } = useUser();
    const { activeProfile, setActiveProfile } = useProfile();
    const { currency, addCurrency } = useCurrency();
    const { wins, losses } = useStats();

    const [collection, setCollection] = useState<CardData[]>([]);
    const [decks, setDecks] = useState<{ id: string, name: string, cards: CardData[] }[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [selectedTitle, setSelectedTitle] = useState<string>('未設定');
    const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
    const { toast } = useToast();

    const { register, handleSubmit, formState: { errors } } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        setIsClient(true);
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

    const onLoginSubmit: SubmitHandler<LoginSchema> = async (data) => {
        try {
            await loginWithId(data.loginId, data.password);
            toast({ title: 'ログインしました。' });
            // The useUser hook will trigger a re-render on successful login
        } catch (error: any) {
            console.error('Login failed:', error);
            let description = '時間をおいて再度お試しください。';
            if (error.code === 'auth/invalid-credential') {
                description = 'ログインIDまたはパスワードが正しくありません。';
            }
            toast({
                variant: 'destructive',
                title: 'ログインに失敗しました',
                description: description,
            });
        }
    };
    
    const handleGoogleSignIn = async () => {
        try {
            await loginWithGoogle();
            toast({ title: 'Googleアカウントでログインしました。' });
        } catch (error: any) {
            console.error('Google Sign-In failed:', error);
            let description = '時間をおいて再度お試しください。';
            if (error.code === 'auth/popup-blocked') {
                description = 'ポップアップがブロックされました。ブラウザの設定を確認してください。';
            }
            toast({
                variant: 'destructive',
                title: 'Googleログインに失敗しました',
                description: description,
            });
        }
    };


    const StatCard = ({ title, value, icon, description, loading }: { title: string, value: string | number, icon: React.ReactNode, description: string, loading?: boolean }) => {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {icon}
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
                    <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        )
    }

    if (!isClient || isUserLoading) {
        return (
            <main>
                <div className="mb-8">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-6 w-1/2 mt-2" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="" value="" icon={<div />} description="" loading />
                    <StatCard title="" value="" icon={<div />} description="" loading />
                    <StatCard title="" value="" icon={<div />} description="" loading />
                    <StatCard title="" value="" icon={<div />} description="" loading />
                    <StatCard title="" value="" icon={<div />} description="" loading />
                    <StatCard title="" value="" icon={<div />} description="" loading />
                </div>
            </main>
        )
    }

    if (!user) {
        return (
            <main className="flex justify-center items-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">ログイン</CardTitle>
                        <CardDescription className="text-center">
                            アカウントにログインするか、Googleで続行してください。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="loginId">ログインID</Label>
                                <Input id="loginId" {...register('loginId')} />
                                {errors.loginId && <p className="text-sm text-destructive">{errors.loginId.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">パスワード</Label>
                                <Input id="password" type="password" {...register('password')} />
                                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                            </div>
                             <Button type="submit" className="w-full">
                                <LogIn className="mr-2 h-4 w-4" /> ログイン
                            </Button>
                        </form>
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    または
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                             <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 74.9C309.2 104.5 280.4 96 248 96c-84.3 0-152.3 68.4-152.3 160s68 160 152.3 160c92.2 0 131.3-64.4 135.2-97.4H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.2z"></path></svg>
                             Googleでログイン
                        </Button>
                        <p className="mt-4 text-xs text-center text-muted-foreground">
                            アカウントをお持ちでないですか？ 新しいログインIDとパスワードでログインすると、自動的にアカウントが作成されます。
                        </p>
                    </CardContent>
                </Card>
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
                <h1 className="text-3xl font-bold">{profile?.loginId || user.email}のマイページ</h1>
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
