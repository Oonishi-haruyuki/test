
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TagBattlePage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4 text-center">タッグバトル (2v2)</h1>
            <p className="text-muted-foreground mb-8 text-center">
                仲間とチームを組んで、2対2の熱いタッグバトルに挑もう！
            </p>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>現在開発中です</CardTitle>
                    <CardDescription>
                        タッグバトルモードは現在開発チームが鋭意製作中です。リリースまで今しばらくお待ちください。
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center p-12">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">新しい機能にご期待ください！</p>
                </CardContent>
            </Card>
        </div>
    );
}
