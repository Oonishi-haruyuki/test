
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthErrorCodes,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

export default function LoginPage() {
  const router = useRouter();
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
      router.push('/mypage');
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
      router.push('/mypage');
    } catch (error: any) {
        console.error('Sign up failed:', error);
        let description = '時間をおいて再度お試しください。';
        // Note: Firebase will return 'auth/email-already-in-use' but we show a generic message
        // because the user interacts with loginId, not email. The check above handles the user-facing error.
        toast({
            variant: 'destructive',
            title: '登録に失敗しました。',
            description,
        });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          // For Google users, we might use their email prefix as a potential loginId
          // or prompt them to create one later. For now, let's store the display name.
          await setDoc(userDocRef, {
            // We don't set a loginId for Google users here to avoid conflicts.
            // They are identified by their unique Google UID.
          });
        }
      }

      toast({ title: 'Googleアカウントでログインしました。' });
      router.push('/mypage');
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      toast({
        variant: 'destructive',
        title: 'Googleログインに失敗しました。',
        description: '時間をおいて再度お試しください。',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,34.556,44,29.865,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );

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
                ログインIDとパスワードを入力してください。
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
                    name="loginId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ログインID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your_login_id"
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
              <Separator className="my-6" />
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="mr-2 h-6 w-6" />
                )}
                Googleでログイン
              </Button>
            </CardContent>
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
                    name="loginId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ログインID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your_login_id"
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
              <Separator className="my-6" />
               <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="mr-2 h-6 w-6" />
                )}
                Googleで登録
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
