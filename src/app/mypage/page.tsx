'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';
import { useMissions } from '@/hooks/use-missions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Coins, Loader2, Settings2, ShieldAlert, Sparkles, Swords, Trophy } from 'lucide-react';

function missionTypeLabel(type: 'daily' | 'weekly' | 'monthly') {
  if (type === 'daily') return 'デイリー';
  if (type === 'weekly') return 'ウィークリー';
  return 'マンスリー';
}

export default function MyPage() {
  const { user, loading } = useAuth();
  const { currency } = useCurrency();
  const { wins, losses } = useStats();
  const { missions } = useMissions();

  const summary = useMemo(() => {
    const completed = missions.filter((m) => m.progress >= m.goal).length;
    const claimable = missions.filter((m) => m.progress >= m.goal && !m.claimed).length;
    const rate = missions.length > 0 ? Math.round((completed / missions.length) * 100) : 0;

    return {
      completed,
      claimable,
      rate,
      featured: missions.slice(0, 3),
    };
  }, [missions]);

  const accountType = user?.isAnonymous ? 'ゲスト' : user ? 'Googleアカウント' : '未ログイン';
  const displayName = user?.isAnonymous
    ? 'ゲストユーザー'
    : user?.displayName || user?.email || 'ユーザー名未設定';
  const avatarFallback = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold">マイページ</h1>
        <p className="text-muted-foreground mt-2">
          プレイ情報の確認と、設定・デッキ管理へのショートカットをここに集約しました。
        </p>
      </div>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>ログイン機能の調整中でも利用できます</AlertTitle>
        <AlertDescription>
          現在の実装では、マイページと設定はログイン有無に関係なく利用できます。Google サインインが不安定な場合はゲストでも開発を継続できます。
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>アカウント情報</CardTitle>
            <CardDescription>認証状態とユーザー識別情報</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>認証状態を確認しています...</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user?.photoURL || undefined} alt={displayName} />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-lg">{displayName}</p>
                    <Badge variant={user ? 'default' : 'secondary'}>{accountType}</Badge>
                  </div>
                  {user?.email ? <p className="text-sm text-muted-foreground">{user.email}</p> : null}
                  {user ? (
                    <p className="text-xs text-muted-foreground break-all">UID: {user.uid}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">サインインするとクラウド保存の連携精度が上がります。</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイック導線</CardTitle>
            <CardDescription>よく使う画面へすぐ移動</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/settings">
                <Settings2 className="h-4 w-4 mr-2" />
                設定を開く
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/collection">マイカードを開く</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/deck-builder">デッキ構築を開く</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/shop">ショップを開く</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>所持Gコイン</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Coins className="h-6 w-6 text-yellow-500" />
              {currency.toLocaleString()} G
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>対戦成績</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Swords className="h-6 w-6" />
              {wins} 勝 {losses} 敗
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>実績進捗</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6" />
              {summary.completed}/{missions.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            ミッション進捗
          </CardTitle>
          <CardDescription>
            達成率 {summary.rate}%
            {summary.claimable > 0 ? ` / 受け取り可能報酬 ${summary.claimable} 件` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={summary.rate} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {summary.featured.map((mission) => {
              const progress = Math.min(100, Math.round((mission.progress / mission.goal) * 100));
              return (
                <div key={mission.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm line-clamp-2">{mission.title}</p>
                    <Badge variant="outline">{missionTypeLabel(mission.type)}</Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {mission.progress}/{mission.goal}
                    {mission.claimed ? ' / 受取済み' : mission.progress >= mission.goal ? ' / 受取可能' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
