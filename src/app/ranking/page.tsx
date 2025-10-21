
'use client';
import { Button } from "@/components/ui/button";

export default function RankingPage() {
    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold">ランキング</h1>
            <p className="text-muted-foreground mt-2">この機能は現在開発中です。</p>
            <Button className="mt-4" onClick={() => window.history.back()}>戻る</Button>
        </div>
    );
}
