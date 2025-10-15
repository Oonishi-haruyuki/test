
'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coins, Trophy, Star, Library, Users, Skull, LogIn, Loader2 } from 'lucide-react';
import type { CardData } from '@/components/card-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { AchievementsUI, type Achievement } from '@/components/ui/achievements';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
  } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const DUMMY_EMAIL_DOMAIN = 'cardcrafter.app';

const loginSchema = z.object({
  loginId: z.string().min(1, { message: 'ログインIDを入力してください。' }),
  password: z.string().min(1, { message: 'パスワードを入力してください。' }),
});

const signUpSchema = z.object({
    loginId: z.string().min(3, { message: 'ログインIDは3文字以上で入力してください。' }).regex(/^[a-zA-Z0-9_]+$/, { message: 'ログインIDは半角英数字とアンダースコア(_)のみ使用できます。'}),
  password: z
    .string()
    .min(6, { message: 'パスワードは6文字以上で入力してください。' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,34.556,44,29.865,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

function LoginModule() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginId: '', password: '' },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { loginId: '', password: '' },
  });
  
  const isLoginIdTaken = async (loginId: string): Promise<boolean> => {
    if (!firestore) return false;
    const q = query(collection(firestore, 'users'), where('loginId', '==', loginId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const email = `${values.loginId}@${DUMMY_EMAIL_DOMAIN}`;
      await signInWithEmailAndPassword(auth, email, values.password);
      toast({ title: 'ログインしました。' });
      // Page will automatically re-render to show MyPage content
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        variant: 'destructive',
        title: 'ログインに失敗しました。',
        description: 'ログインIDまたはパスワードが正しくありません。',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
    try {
        const idTaken = await isLoginIdTaken(values.loginId);
        if (idTaken) {
            toast({
                variant: 'destructive',
                title: '登録に失敗しました。',
                description: 'このログインIDは既に使用されています。',
              });
              setIsLoading(false);
              return;
        }

      const email = `${values.loginId}@${DUMMY_EMAIL_DOMAIN}`;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        values.password
      );
      const user = userCredential.user;

      if (firestore) {
        await setDoc(doc(firestore, 'users', user.uid), {
            loginId: values.loginId,
        });
      }

      toast({ title: 'アカウントを登録しました。' });
      // Page will automatically re-render to show MyPage content
    } catch (error: any) {
        console.error('Sign up failed:', error);
        toast({
            variant: 'destructive',
            title: '登録に失敗しました。',
            description: '時間をおいて再度お試しください。',
        });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            // loginId is not set here for Google Users initially
          });
        }
      }

      toast({ title: 'Googleアカウントでログインしました。' });
      // Page will automatically re-render to show MyPage content
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
          toast({
            variant: 'destructive',
            title: 'Googleログインに失敗しました。',
            description: error.code === 'auth/popup-blocked' 
                ? 'ポップアップがブロックされました。ブラウザの設定を確認してください。'
                : '時間をおいて再度お試しください。',
          });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="text-center">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>マイページへようこそ</CardTitle>
                <CardDescription>ログインまたは新規登録して、あなたの活動記録を確認しましょう。</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">ログイン</TabsTrigger>
                        <TabsTrigger value="signup">新規登録</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <Form {...loginForm}>
                            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 pt-4">
                                <FormField
                                    control={loginForm.control}
                                    name="loginId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ログインID</FormLabel>
                                        <FormControl>
                                        <Input placeholder="your_login_id" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={loginForm.control}
                                    name="password"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>パスワード</FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    ログイン
                                </Button>
                            </form>
                        </Form>
                        <Separator className="my-6" />
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-6 w-6" />}
                            Googleでログイン
                        </Button>
                    </TabsContent>
                    <TabsContent value="signup">
                        <Form {...signUpForm}>
                            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4 pt-4">
                                <FormField
                                    control={signUpForm.control}
                                    name="loginId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ログインID</FormLabel>
                                        <FormControl>
                                        <Input placeholder="your_login_id" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={signUpForm.control}
                                    name="password"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>パスワード</FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    登録する
                                </Button>
                            </form>
                        </Form>
                        <Separator className="my-6" />
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-6 w-6" />}
                            Googleで登録
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </main>
  );
}


export default function MyPage() {
  const { currency, addCurrency } = useCurrency();
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

  const getDisplayName = () => {
    if (profile?.loginId) return profile.loginId;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'ゲスト';
  }

  const uniqueCardCount = getUniqueCardCount(collection);

  const handleTitleChange = (title: string) => {
      setSelectedTitle(title);
      localStorage.setItem('selectedTitle', title);
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
        <main className="flex justify-center items-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin" />
        </main>
    )
  }

  if (!user) {
    return <LoginModule />;
  }

  return (
    <main>
        <div className="mb-8">
            <h1 className="text-3xl font-bold">{getDisplayName()}のマイページ</h1>
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

    