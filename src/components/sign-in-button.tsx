'use client';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'サインインに失敗しました。時間をおいて再試行してください。';
  }

  if (error.code === 'auth/unauthorized-domain') {
    return `このドメインは Firebase Auth に未登録です。Firebase Console > Authentication > Settings > Authorized domains に ${window.location.hostname} を追加してください。`;
  }

  if (error.code === 'auth/popup-blocked') {
    return 'ポップアップがブロックされています。ブラウザのポップアップ許可後に再試行してください。';
  }

  if (error.code === 'auth/popup-closed-by-user') {
    return 'サインインのポップアップが閉じられました。もう一度お試しください。';
  }

  if (error.code === 'auth/cancelled-popup-request') {
    return 'サインイン処理がキャンセルされました。もう一度お試しください。';
  }

  return `サインインに失敗しました (${error.code})`;
}

export function SignInButton() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGuestSigningIn, setIsGuestSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleGuestSignIn = async () => {
    setIsGuestSigningIn(true);
    try {
      await signInAnonymously(auth);
      toast({
        title: 'ゲストでサインインしました',
        description: 'OAuth ドメイン未設定でも Firestore 機能を利用できます。',
      });
    } catch (error) {
      console.error('Guest sign in error:', error);
      toast({
        variant: 'destructive',
        title: 'ゲストサインインに失敗しました',
        description: 'Firebase Authentication で匿名認証を有効化してください。',
      });
    } finally {
      setIsGuestSigningIn(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        variant: 'destructive',
        title: 'サインインに失敗しました',
        description: getAuthErrorMessage(error),
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        variant: 'destructive',
        title: 'サインアウトに失敗しました',
        description: '時間をおいて再試行してください。',
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <Button disabled variant="ghost">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{user.isAnonymous ? 'ゲストユーザー' : (user.displayName || user.email)}</span>
        <Button
          onClick={handleSignOut}
          disabled={isSigningOut}
          variant="outline"
          size="sm"
        >
          {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : 'サインアウト'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSignIn}
        disabled={isSigningIn || isGuestSigningIn}
        size="sm"
      >
        {isSigningIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
        Google でサインイン
      </Button>
      <Button
        onClick={handleGuestSignIn}
        disabled={isSigningIn || isGuestSigningIn}
        variant="outline"
        size="sm"
      >
        {isGuestSigningIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''}
        ゲストで開始
      </Button>
    </div>
  );
}
