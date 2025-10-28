

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, loginWithId, signUpWithId, loginWithGoogle, logout, changePassword } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus, LogOut, KeyRound, History, Info, Users, Swords, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStats } from '@/hooks/use-stats';
import { useMissions } from '@/hooks/use-missions';
import { MissionsUI } from '@/components/ui/missions-ui';
import { useCurrency } from '@/hooks/use-currency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { AchievementsUI, type Achievement } from '@/components/ui/achievements';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const LoginPage = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await loginWithId(loginId, password);
            toast({ title: 'ログインしました' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'ログインに失敗しました', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
             toast({ title: 'Googleアカウントでログインしました' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Googleログインに失敗しました', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
                <Input placeholder="ログインID" value={loginId} onChange={e => setLoginId(e.target.value)} required />
                <Input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} required />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
                    ログイン
                </Button>
                 <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
                    Googleでログイン
                </Button>
            </CardContent>
        </form>
    );
};

const SignUpPage = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ variant: 'destructive', title: 'パスワードが一致しません' });
            return;
        }
        setIsSubmitting(true);
        try {
            await signUpWithId(loginId, password);
            toast({ title: 'アカウントを登録しました', description: 'ログインしてください。' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: '登録に失敗しました', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
                <Input placeholder="ログインID" value={loginId} onChange={e => setLoginId(e.target.value)} required />
                <Input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} required />
                <Input type="password" placeholder="パスワード (確認用)" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
                    登録する
                </Button>
            </CardContent>
        </form>
    );
};

const PasswordChangeDialog = () => {
    const { profile } = useUser();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isChanging, setIsChanging] = useState(false);
    const { toast } = useToast();

    const handleChangePassword = async () => {
        if (!profile?.loginId) {
            toast({ variant: 'destructive', title: 'ユーザー情報が見つかりません' });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast({ variant: 'destructive', title: '新しいパスワードが一致しません' });
            return;
        }
        if (!oldPassword || !newPassword) {
             toast({ variant: 'destructive', title: 'すべてのフィールドを入力してください' });
            return;
        }

        setIsChanging(true);
        try {
            await changePassword(profile.loginId, oldPassword, newPassword);
            toast({ title: 'パスワードが正常に変更されました' });
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'パスワードの変更に失敗しました', description: error.message });
        } finally {
            setIsChanging(false);
        }
    };
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline"><KeyRound/> パスワードを変更</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>パスワードの変更</DialogTitle>
                    <DialogDescription>
                        現在のパスワードと新しいパスワードを入力してください。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">ログインID</Label>
                        <Input value={profile?.loginId || ''} disabled className="col-span-3"/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="old-password">現在のパスワード</Label>
                        <Input id="old-password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-password">新しいパスワード</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="confirm-new-password">新しいパスワード(確認)</Label>
                        <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">キャンセル</Button>
                    </DialogClose>
                    <Button onClick={handleChangePassword} disabled={isChanging}>
                        {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        変更する
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function MyPage() {
    const { user, profile, isUserLoading } = useUser();
    const { wins, losses } = useStats();
    const { missions, claimMissionReward } = useMissions();
    const { currency, setCurrency, addCurrency } = useCurrency();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { toast } = useToast();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const { firestore } = initializeFirebase();


    useEffect(() => {
        if (!user) return;
        const baseAchievements: Achievement[] = [
            { id: 'win-10', name: '勝利の探求者', description: 'AI対戦で10回勝利する', unlocked: wins >= 10, reward: 500, claimed: false },
            { id: 'create-50', name: '創造神', description: 'カードを50枚作成する', unlocked: (JSON.parse(localStorage.getItem('cardCollection') || '[]').length) >= 50, reward: 1000, claimed: false },
            { id: 'perfect-win', name: '完全勝利', description: 'HP満タンでAI対戦に勝利する', unlocked: false, reward: 2000, claimed: false }, // This needs specific game logic to track
        ];
        
        try {
            const savedAchievements = JSON.parse(localStorage.getItem(`user-${user.uid}-achievements`) || '[]');
            const mergedAchievements = baseAchievements.map(baseAch => {
                const saved = savedAchievements.find((sa: Achievement) => sa.id === baseAch.id);
                return saved ? { ...baseAch, claimed: saved.claimed, unlocked: baseAch.unlocked || saved.unlocked } : baseAch;
            });
            setAchievements(mergedAchievements);
        } catch (e) {
            console.error(e);
            setAchievements(baseAchievements);
        }

    }, [user, wins]);

    const handleClaimRewards = (reward: number) => {
        addCurrency(reward);
        const updatedAchievements = achievements.map(ach => 
            (ach.unlocked && !ach.claimed) ? { ...ach, claimed: true } : ach
        );
        setAchievements(updatedAchievements);
        if (user) {
            localStorage.setItem(`user-${user.uid}-achievements`, JSON.stringify(updatedAchievements));
        }
        toast({ title: '実績報酬を受け取りました！', description: `${reward}Gを獲得しました。` });
    };

    const handleTitleChange = async (title: string) => {
        if (user) {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { title: title });
            toast({ title: '称号を変更しました。', description: `新しい称号: ${title}` });
        }
    };


    useEffect(() => {
        if (!user && !isUserLoading) {
            try {
                localStorage.removeItem('cardCollection');
                localStorage.removeItem('cardDecks');
                localStorage.removeItem('guest-wins');
                localStorage.removeItem('guest-losses');
                localStorage.removeItem('guest-missions');
                localStorage.removeItem('purchasedCardFrames');
                localStorage.removeItem('purchasedCardBacks');
                localStorage.removeItem('purchasedArtifacts');
                localStorage.removeItem('purchasedAnimations');
                setCurrency(500);
            } catch (e) {
                console.error("Error clearing localStorage on logout", e);
            }
        }
    }, [user, isUserLoading, setCurrency]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            toast({ title: 'ログアウトしました' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'ログアウトに失敗しました', description: error.message });
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (isUserLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-10 w-10" /></div>;
    }

    if (!user) {
        return (
            <Tabs defaultValue="login" className="max-w-md mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">ログイン</TabsTrigger>
                    <TabsTrigger value="signup">新規登録</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                    <Card>
                        <CardHeader>
                            <CardTitle>ログイン</CardTitle>
                            <CardDescription>IDとパスワードを入力してください。</CardDescription>
                        </CardHeader>
                        <LoginPage />
                    </Card>
                </TabsContent>
                <TabsContent value="signup">
                    <Card>
                        <CardHeader>
                            <CardTitle>新規登録</CardTitle>
                            <CardDescription>新しいアカウントを作成します。</CardDescription>
                        </CardHeader>
                        <SignUpPage />
                    </Card>
                </TabsContent>
            </Tabs>
        );
    }
    
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
    const statsData = [
        { name: '勝利', value: wins, fill: 'hsl(var(--primary))' },
        { name: '敗北', value: losses, fill: 'hsl(var(--destructive))' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-bold">マイページ</h1>
                 {profile?.title && <span className="font-bold text-lg text-primary bg-primary/20 px-4 py-1 rounded-full">{profile.title}</span>}
            </div>

            <Tabs defaultValue="account">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="account">アカウント</TabsTrigger>
                    <TabsTrigger value="stats">戦績</TabsTrigger>
                    <TabsTrigger value="achievements">実績</TabsTrigger>
                    <TabsTrigger value="missions">ミッション</TabsTrigger>
                    <TabsTrigger value="info">お知らせ</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>アカウント情報</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p><strong>ログインID:</strong> {profile?.loginId || '読み込み中...'}</p>
                            <p><strong>メール:</strong> {user.email || '未設定'}</p>
                            <p><strong>レーティング:</strong> {profile?.rating || 1000}</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <PasswordChangeDialog />
                                <Button onClick={handleLogout} variant="destructive" className="w-full sm:w-auto" disabled={isLoggingOut}>
                                    {isLoggingOut ? <Loader2 className="animate-spin"/> : <LogOut/>}
                                    ログアウト
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>対戦成績</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p><strong>勝利数:</strong> {wins}</p>
                                <p><strong>敗北数:</strong> {losses}</p>
                                <p><strong>勝率:</strong> {winRate.toFixed(1)}%</p>
                                <div className="h-40 mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} />
                                            <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                 <TabsContent value="achievements" className="mt-6">
                     <AchievementsUI 
                        achievements={achievements}
                        onClaimRewards={handleClaimRewards}
                        onTitleChange={handleTitleChange}
                    />
                </TabsContent>

                <TabsContent value="missions" className="mt-6">
                    <MissionsUI missions={missions} onClaimReward={claimMissionReward} />
                </TabsContent>

                 <TabsContent value="info" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Info /> お知らせ・情報</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <section>
                                <h3 className="text-lg font-semibold mb-2 border-b pb-1">アプデ情報</h3>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>2024/05/20: Ver 1.0.0 - 「カードクラフター」正式リリース！</li>
                                    <li>2024/05/21: Ver 1.0.1 - 新しいカードフレームと裏面デザインをショップに追加しました。</li>
                                    <li>2024/05/22: Ver 1.1.0 - 「ギルド」機能を追加しました。</li>
                                </ul>
                            </section>
                             <section>
                                <h3 className="text-lg font-semibold mb-2 border-b pb-1">次回アップデート予告</h3>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>カードに特殊な効果を付与する「エンチャント」システム</li>
                                    <li>日替わりで特殊なデッキと戦う「デイリーチャレンジ」</li>
                                    <li>作成したカードを公開・評価できる「カードギャラリー」</li>
                                    <li>特定のカードを禁止する「特殊レギュレーション」対戦</li>
                                    <li>ゲーム内BGMやSEのカスタマイズ機能</li>
                                    <li>2vs2の「タッグバトル」モードの実装</li>
                                    <li>ギルド間で対戦する「ギルドバトル」機能</li>
                                    <li>大会モードの実装</li>
                                    <li>観戦モードの実装</li>
                                    <li>カードの3Dモデル表示機能</li>
                                </ul>
                            </section>
                             <section>
                                <h3 className="text-lg font-semibold mb-2 border-b pb-1">お知らせ</h3>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>現在、サーバーメンテナンスの予定はありません。</li>
                                    <li>[イベント] 初代最強決定戦、開催準備中！詳細は後日発表！</li>
                                </ul>
                            </section>
                             <section>
                                <h3 className="text-lg font-semibold mb-2 border-b pb-1">使用できるデバイス</h3>
                                <p className="text-muted-foreground">
                                    カードクラフターは、以下の環境で快適にプレイいただけます。
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                                    <li>PC: Google Chrome, Firefox, Safari, Microsoft Edge (それぞれ最新版)</li>
                                    <li>スマートフォン: iOSまたはAndroidの最新版ブラウザ</li>
                                    <li>タブレット: iOSまたはAndroidの最新版ブラウザ</li>
                                </ul>
                                 <p className="text-sm text-muted-foreground mt-2">※一部機能はPCでの利用を推奨しています。</p>
                            </section>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
