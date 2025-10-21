
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Trophy, Swords, Shield } from 'lucide-react';
import Link from 'next/link';

export default function GuildBattlePage() {
    const { user } = useUser();

    if (!user) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-4xl font-bold mb-4">ギルドバトル</h1>
                <p className="text-muted-foreground mb-8">
                    ギルドの名誉をかけた戦いが、今始まる。
                </p>
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>ログインが必要です</CardTitle>
                        <CardDescription>ギルドバトルをプレイするには、マイページからログインまたは新規登録してください。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                           <Link href="/mypage">マイページへ</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold">ギルドバトル</h1>
                <p className="text-muted-foreground mt-2">
                    ギルドの仲間と力を合わせ、最強のギルドを目指せ！
                </p>
            </div>

            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" /> ギルドバトルへようこそ</CardTitle>
                    <CardDescription>
                        ギルドバトルは現在開発中の新機能です。ギルドの名誉をかけて、他のギルドと対戦するモードが間もなく登場します。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 border rounded-lg bg-secondary/50">
                        <h3 className="font-semibold text-lg mb-2">予定されている機能</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li><span className="font-semibold text-foreground">ギルドマッチング:</span> あなたのギルドとレートの近いギルドと自動でマッチングします。</li>
                            <li><span className="font-semibold text-foreground">貢献度システム:</span> バトルでの勝利や活躍に応じてギルドへの貢献度が記録されます。</li>
                            <li><span className="font-semibold text-foreground">ギルドランキング:</span> ギルドごとの総合レートや戦績に基づいたランキングが表示されます。</li>
                            <li><span className="font-semibold text-foreground">特別報酬:</span> シーズン終了時のランキングに応じて、特別な報酬や称号が授与されます。</li>
                        </ul>
                    </div>
                     <div className="text-center">
                        <p className="font-bold text-lg">鋭意開発中！乞うご期待！</p>
                     </div>
                </CardContent>
            </Card>
        </div>
    );
}
