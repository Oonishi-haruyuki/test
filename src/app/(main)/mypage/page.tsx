

'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Coins, Trophy, Star, Library, Users, Skull, User, LogIn, BarChart, History, LogOut, Eye, EyeOff, KeyRound } from 'lucide-react';
import type { CardData } from '@/components/card-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { AchievementsUI, type Achievement } from '@/components/ui/achievements';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useUser, loginWithId, signUpWithId, loginWithGoogle, initializeFirebase, logout, changePassword } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMissions } from '@/hooks/use-missions';
import { MissionsUI } from '@/components/ui/missions-ui';
import { allMissions } from '@/lib/missions';
import { shopItems } from '@/lib/shop-items';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

const authSchema = z.object({
    loginId: z.string().min(3, { message: 'ログインIDは3文字以上で入力してください。' }),
    password: z.string().min(6, { message: 'パスワードは6文字以上で入力してください。' }),
});
type AuthSchema = z.infer<typeof authSchema>;

const passwordChangeSchema = z.object({
    loginId: z.string().min(3, "ログインIDを入力してください。"),
    oldPassword: z.string().min(6, "現在のパスワードは6文字以上です。"),
    newPassword: z.string().min(6, "新しいパスワードは6文字以上で入力してください。"),
    confirmPassword: z.string().min(6, "確認用パスワードは6文字以上です。"),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "新しいパスワードが一致しません。",
    path: ["confirmPassword"], // Show error on the confirmation field
});
type PasswordChangeSchema = z.infer<typeof passwordChangeSchema>;

interface Replay {
    id: string;
    player1LoginId: string;
    player2LoginId: string;
    winnerId: string;
    createdAt: any;
}


export default function MyPage() {
    const { user, profile, isUserLoading } = useUser();
    const { firestore } = initializeFirebase();
    const { currency, addCurrency } = useCurrency();
    const { wins, losses } = useStats();
    const { missions, claimMissionReward } = useMissions();
    const { toast } = useToast();
    
    const [cardCollection, setCardCollection] = useState<CardData[]>([]);
    const [decks, setDecks] = useState<{ id: string, name: string, cards: CardData[] }[]>([]);
    const [selectedTitle, setSelectedTitle] = useState('未設定');
    const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [purchasedAnimations, setPurchasedAnimations] = useState<string[]>([]);
    const [selectedAnimation, setSelectedAnimation] = useState('anim-flip');
    const [replays, setReplays] = useState<Replay[]>([]);
    const [isLoadingReplays, setIsLoadingReplays] = useState(true);
    const [showAccountInfo, setShowAccountInfo] = useState(true);
    const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);


    const {
        register: registerAuth,
        handleSubmit: handleSubmitAuth,
        formState: { errors: authErrors },
    } = useForm<AuthSchema>({
        resolver: zodResolver(authSchema),
    });

    const {
        register: registerPasswordChange,
        handleSubmit: handleSubmitPasswordChange,
        formState: { errors: passwordChangeErrors },
        reset: resetPasswordChangeForm,
    } = useForm<PasswordChangeSchema>({
        resolver: zodResolver(passwordChangeSchema),
    });


    // Load data from localStorage when profile changes
    useEffect(() => {
        setIsClient(true);
        if (!user) return;
        try {
            const savedCollection = JSON.parse(localStorage.getItem(`cardCollection`) || '[]');
            const savedDecks = JSON.parse(localStorage.getItem(`decks`) || '[]');
            const savedTitle = localStorage.getItem(`selectedTitle`) || '未設定';
            const savedClaimedRewards = JSON.parse(localStorage.getItem(`claimedRewards`) || '[]');
            const savedAnimations = JSON.parse(localStorage.getItem(`purchasedGachaAnimations`) || '["anim-flip"]');
            const savedSelectedAnimation = localStorage.getItem(`selectedGachaAnimation`) || 'anim-flip';
            setCardCollection(savedCollection);
            setDecks(savedDecks);
            setSelectedTitle(savedTitle);
            setClaimedRewards(savedClaimedRewards);
            setPurchasedAnimations(savedAnimations);
            setSelectedAnimation(savedSelectedAnimation);
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, [user]);
    
    // Fetch replays
    useEffect(() => {
        if (!user) {
            setReplays([]);
            setIsLoadingReplays(false);
            return;
        }
        setIsLoadingReplays(true);
        const replaysRef = collection(firestore, 'replays');
        const q = query(replaysRef, where('player1Id', '==', user.uid), orderBy('createdAt', 'desc'), limit(10));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedReplays: Replay[] = [];
            querySnapshot.forEach((doc) => {
                fetchedReplays.push({ id: doc.id, ...doc.data() } as Replay);
            });
            setReplays(fetchedReplays);
            setIsLoadingReplays(false);
        }, (error) => {
            console.error("Error fetching replays:", error);
            setIsLoadingReplays(false);
        });

        return () => unsubscribe();

    }, [user, firestore]);

    // Save data when it changes
    useEffect(() => {
        if (!isClient || !user) return;
        localStorage.setItem(`selectedTitle`, selectedTitle);
    }, [selectedTitle, user, isClient]);

    useEffect(() => {
        if (!isClient || !user) return;
        localStorage.setItem(`claimedRewards`, JSON.stringify(claimedRewards));
    }, [claimedRewards, user, isClient]);

    useEffect(() => {
        if (!isClient || !user) return;
        localStorage.setItem(`selectedGachaAnimation`, selectedAnimation);
    }, [selectedAnimation, user, isClient]);


    const getUniqueCardCount = (cards: CardData[]) => {
        if (!cards || cards.length === 0) return 0;
        const ids = new Set(cards.map(card => card.id));
        return ids.size;
    };

    const uniqueCardCount = getUniqueCardCount(cardCollection);

    const handleTitleChange = (title: string) => {
        setSelectedTitle(title);
    }
    
    const handleAnimationChange = (animationId: string) => {
        setSelectedAnimation(animationId);
        toast({
            title: "アニメーションを設定しました",
            description: `ガチャの演出が変更されました。`,
        });
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

    const onLoginSubmit: SubmitHandler<AuthSchema> = async (data) => {
        try {
            await loginWithId(data.loginId, data.password);
            toast({ title: 'ログインしました。' });
        } catch (error: any) {
            console.error('Login failed:', error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                 toast({
                    variant: 'destructive',
                    title: 'ログインに失敗しました',
                    description: 'ログインIDまたはパスワードが正しくありません。',
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'エラーが発生しました',
                    description: '時間をおいて再度お試しください。',
                });
            }
        }
    };
    
    const onSignUpSubmit: SubmitHandler<AuthSchema> = async (data) => {
        try {
            await signUpWithId(data.loginId, data.password);
            toast({ title: 'アカウントを新規登録し、ログインしました。' });
        } catch (error: any) {
            console.error('Sign up failed:', error);
            let description = '時間をおいて再度お試しください。';
            if (error.code === 'auth/email-already-in-use') {
                description = 'このログインIDは既に使用されています。';
            }
             toast({
                variant: 'destructive',
                title: '新規登録に失敗しました',
                description: description,
            });
        }
    };
    
    const onPasswordChangeSubmit: SubmitHandler<PasswordChangeSchema> = async (data) => {
        try {
            await changePassword(data.loginId, data.oldPassword, data.newPassword);
            toast({ title: 'パスワードが変更されました。' });
            setIsPasswordChangeOpen(false);
            resetPasswordChangeForm();
        } catch (error: any) {
            console.error('Password change failed:', error);
            let description = '時間をおいて再度お試しください。';
            if (error.code === 'auth/wrong-password') {
                description = '現在のパスワードが正しくありません。';
            } else if (error.code === 'auth/user-not-found') {
                description = '指定されたログインIDのユーザーが見つかりません。';
            } else if (error.code === 'auth/invalid-credential') {
                description = 'ログインIDまたは現在のパスワードが正しくありません。';
            }
            toast({
                variant: 'destructive',
                title: 'パスワードの変更に失敗しました',
                description,
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

    const handleLogout = async () => {
        try {
            await logout();
            toast({ title: 'ログアウトしました。' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'ログアウトに失敗しました。'});
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
                    {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold truncate">{value}</div>}
                    <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        )
    }
    
    const availableAnimations = shopItems.animations.filter(anim => purchasedAnimations.includes(anim.id));


    if (!isClient || isUserLoading) {
        return (
            <>
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
            </>
        )
    }

    if (!user) {
        return (
            <main className="flex justify-center items-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">マイページへようこそ</CardTitle>
                         <CardDescription className="text-center">
                            ログインまたは新規登録してください。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="login">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="login">ログイン</TabsTrigger>
                                <TabsTrigger value="signup">新規登録</TabsTrigger>
                            </TabsList>
                            <TabsContent value="login" className="pt-4">
                                 <form onSubmit={handleSubmitAuth(onLoginSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="loginId">ログインID</Label>
                                        <Input id="loginId" {...registerAuth('loginId')} />
                                        {authErrors.loginId && <p className="text-sm text-destructive">{authErrors.loginId.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">パスワード</Label>
                                        <Input id="password" type="password" {...registerAuth('password')} />
                                        {authErrors.password && <p className="text-sm text-destructive">{authErrors.password.message}</p>}
                                    </div>
                                    <Button type="submit" className="w-full">
                                        <LogIn className="mr-2 h-4 w-4" /> ログイン
                                    </Button>
                                </form>
                            </TabsContent>
                            <TabsContent value="signup" className="pt-4">
                                <form onSubmit={handleSubmitAuth(onSignUpSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signupLoginId">ログインID</Label>
                                        <Input id="signupLoginId" {...registerAuth('loginId')} />
                                        {authErrors.loginId && <p className="text-sm text-destructive">{authErrors.loginId.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signupPassword">パスワード</Label>
                                        <Input id="signupPassword" type="password" {...registerAuth('password')} />
                                        {authErrors.password && <p className="text-sm text-destructive">{authErrors.password.message}</p>}
                                    </div>
                                    <Button type="submit" className="w-full">
                                        <User className="mr-2 h-4 w-4" /> 新規登録してログイン
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                        
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
                    </CardContent>
                </Card>
            </main>
        )
    }

    return (
        <>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold truncate">{(profile?.loginId || user.email) ?? 'ようこそ'}のマイページ</h1>
                    <p className="text-muted-foreground">あなたのアクティビティと実績</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2" />
                    ログアウト
                </Button>
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
                    title="レーティング"
                    value={profile?.rating || 1000}
                    icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
                    description="現在の対戦レーティング"
                    loading={isUserLoading}
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

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            アカウント情報
                            <Button variant="ghost" size="sm" onClick={() => setShowAccountInfo(!showAccountInfo)}>
                                {showAccountInfo ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
                                {showAccountInfo ? '非表示' : '表示'}
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>ログインID:</Label>
                            <span className="font-mono text-sm">{showAccountInfo ? (profile?.loginId || user.email) : '********'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>パスワード:</Label>
                            <span className="font-mono text-sm">********</span>
                        </div>
                    </CardContent>
                     <CardFooter className="flex-col items-start gap-4">
                        <p className="text-xs text-muted-foreground">
                            セキュリティ保護のため、パスワードは表示されません。
                        </p>
                        <Dialog open={isPasswordChangeOpen} onOpenChange={setIsPasswordChangeOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline"><KeyRound className="mr-2"/>パスワードを変更</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>パスワードの変更</DialogTitle>
                                    <DialogDescription>
                                        現在のパスワードと新しいパスワードを入力してください。
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmitPasswordChange(onPasswordChangeSubmit)} className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="pw-change-loginId">ログインID</Label>
                                        <Input id="pw-change-loginId" {...registerPasswordChange('loginId')} defaultValue={profile?.loginId || ''} />
                                        {passwordChangeErrors.loginId && <p className="text-sm text-destructive">{passwordChangeErrors.loginId.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pw-change-old">現在のパスワード</Label>
                                        <Input id="pw-change-old" type="password" {...registerPasswordChange('oldPassword')} />
                                        {passwordChangeErrors.oldPassword && <p className="text-sm text-destructive">{passwordChangeErrors.oldPassword.message}</p>}
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="pw-change-new">新しいパスワード</Label>
                                        <Input id="pw-change-new" type="password" {...registerPasswordChange('newPassword')} />
                                        {passwordChangeErrors.newPassword && <p className="text-sm text-destructive">{passwordChangeErrors.newPassword.message}</p>}
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="pw-change-confirm">新しいパスワード (確認用)</Label>
                                        <Input id="pw-change-confirm" type="password" {...registerPasswordChange('confirmPassword')} />
                                        {passwordChangeErrors.confirmPassword && <p className="text-sm text-destructive">{passwordChangeErrors.confirmPassword.message}</p>}
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="secondary" onClick={() => setIsPasswordChangeOpen(false)}>キャンセル</Button>
                                        <Button type="submit">変更する</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                </Card>
                <MissionsUI 
                    missions={missions}
                    onClaimReward={claimMissionReward}
                />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History /> 最近の対戦リプレイ</CardTitle>
                        <CardDescription>最近のAI対戦の記録です。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingReplays ? (
                            <div className="space-y-2">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        ) : replays.length === 0 ? (
                            <p className="text-center text-muted-foreground">リプレイ記録はありません。</p>
                        ) : (
                            <ul className="space-y-3">
                                {replays.map(replay => (
                                    <li key={replay.id} className="flex items-center justify-between p-2 rounded-md border bg-secondary/30">
                                        <div>
                                            <p className="text-sm font-semibold">vs {replay.player2LoginId}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {replay.createdAt?.toDate ? formatDistanceToNow(replay.createdAt.toDate(), { addSuffix: true, locale: ja }) : '日付不明'}
                                            </p>
                                        </div>
                                        <Badge variant={replay.winnerId === user.uid ? 'default' : 'destructive'}>
                                            {replay.winnerId === user.uid ? '勝利' : '敗北'}
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <AchievementsUI
                    achievements={achievements}
                    onTitleChange={handleTitleChange}
                    onClaimRewards={handleClaimRewards}
                >
                    <div className="space-y-2">
                        <h4 className="font-semibold">ガチャアニメーション設定</h4>
                         <Select onValueChange={handleAnimationChange} defaultValue={selectedAnimation}>
                            <SelectTrigger className="w-full md:w-[280px]">
                                <SelectValue placeholder="アニメーションを選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableAnimations.map(anim => (
                                    <SelectItem key={anim.id} value={anim.id}>{anim.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </AchievementsUI>
            </div>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>今後のアップデート</CardTitle>
                    <CardDescription>今後、カードクラフターには以下のような機能が追加される予定です。</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                        <li>**ギルド機能**: 仲間と集まり、チャットやギルド対戦を楽しめる機能。</li>
                        <li>**ドラフトモード**: その場で属性を選択しランダムに２枚ずつ生成されるカードを選んでデッキを構築し、他のプレイヤーと対戦する新しい対戦形式。</li>
                        <li>**カードの進化・強化**: 特定のカードを素材を使ってアップグレードし、新たな能力や見た目を解放するシステム。</li>
                        <li>**リプレイ機能**: 過去の対戦を見返し、戦略を分析できる機能。</li>
                        <li>**観戦モード**: 他のプレイヤーの白熱したオンライン対戦をリアルタイムで観戦できる機能。</li>
                        <li>**パズルモード**: 特殊な状況下で勝利を目指す、頭脳派向けの詰めカードパズル。</li>
                        <li>**カスタムトーナメント**: 友達やコミュニティで独自のルールでトーナメントを開催・参加できる機能。</li>
                        <li>**2v2タッグバトル**: 仲間とペアを組み、2対2で戦う新しい協力対戦モード。</li>
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}
