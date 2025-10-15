
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthErrorCodes,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: '無効なメールアドレスです。' }),
  password: z.string().min(1, { message: 'パスワードを入力してください。' }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: '無効なメールアドレスです。' }),
  password: z
    .string()
    .min(6, { message: 'パスワードは6文字以上で入力してください。' }),
});

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'ログインしました。' });
      router.push('/mypage');
    } catch (error: any) {
      console.error('Login failed:', error);
      // Handle user not found by trying to sign up
      if (error.code === AuthErrorCodes.USER_DELETED) {
        toast({
          variant: 'destructive',
          title: 'ログインに失敗しました。',
          description: 'このユーザーは存在しません。新規登録をお試しください。',
        });
        await handleSignUp({ email: values.email, password: values.password });
      } else {
        toast({
          variant: 'destructive',
          title: 'ログインに失敗しました。',
          description: 'メールアドレスまたはパスワードが正しくありません。',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      // Create user profile in Firestore
      if (firestore) {
        await setDoc(doc(firestore, 'users', user.uid), {});
      }

      toast({ title: 'アカウントを登録しました。' });
      router.push('/mypage');
    } catch (error: any) {
      console.error('Sign up failed:', error);
      let description = '時間をおいて再度お試しください。';
      if (error.code === 'auth/email-already-in-use') {
        // If user already exists, just log them in.
        await handleLogin(values);
        return;
      }
      toast({
        variant: 'destructive',
        title: '登録に失敗しました。',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEasyLogin = async (email: string) => {
    const password = 'password';
    setIsLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'ログインしました。' });
        router.push('/mypage');
    } catch (error: any) {
        // If user not found, create account
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                if (firestore) {
                    await setDoc(doc(firestore, 'users', user.uid), {});
                }
                toast({ title: 'テストアカウントを新規作成し、ログインしました。' });
                router.push('/mypage');
            } catch (signupError: any) {
                toast({
                    variant: 'destructive',
                    title: 'アカウント作成に失敗しました。',
                    description: '時間をおいて再度お試しください。'
                });
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'ログインに失敗しました。',
                description: '予期せぬエラーが発生しました。',
            });
        }
    } finally {
        setIsLoading(false);
    }
};

  return (
    <div className="flex justify-center items-start pt-10">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">ログイン</TabsTrigger>
          <TabsTrigger value="signup">新規登録</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>ログイン</CardTitle>
              <CardDescription>
                アカウント情報を入力してログインしてください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="mail@example.com"
                            {...field}
                          />
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
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    ログイン
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">または</p>
                <div className="w-full space-y-2">
                    <Button onClick={() => handleEasyLogin('test@example.com')} variant="outline" className="w-full" disabled={isLoading}>
                       {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} テスト用アカウントでログイン
                    </Button>
                    <Button onClick={() => handleEasyLogin('player1@example.com')} variant="outline" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} プレイ用アカウント1でログイン
                    </Button>
                    <Button onClick={() => handleEasyLogin('player2@example.com')} variant="outline" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} プレイ用アカウント2でログイン
                    </Button>
                </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>新規登録</CardTitle>
              <CardDescription>
                新しいアカウントを作成します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...signUpForm}>
                <form
                  onSubmit={signUpForm.handleSubmit(handleSignUp)}
                  className="space-y-4"
                >
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="mail@example.com"
                            {...field}
                          />
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
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    登録する
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
