
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BrainCircuit, Dices } from 'lucide-react';

const minigames = [
    {
        title: 'ハイ＆ロー',
        description: '次のカードのコストは高い？低い？運試しでGコインをゲット！',
        href: '/minigame/high-low',
        icon: Dices
    },
    {
        title: 'マナ当てクイズ',
        description: 'カードの情報からマナコストを推測する知識ゲーム。',
        href: '/minigame/guess-cost',
        icon: BrainCircuit
    },
     {
        title: '種族当てクイズ',
        description: 'カードの見た目や能力から、そのタイプを当ててみよう！',
        href: '/minigame/guess-type',
        icon: BrainCircuit
    },
]

export default function MinigameLobbyPage() {
    return (
        <div className="container mx-auto p-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold">ミニゲーム</h1>
                <p className="text-muted-foreground mt-2">
                    息抜きにぴったり！簡単なゲームでGコインを稼ごう。
                </p>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {minigames.map(game => (
                    <Card key={game.href} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <game.icon className="h-6 w-6 text-primary" />
                                {game.title}
                            </CardTitle>
                            <CardDescription>{game.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-end">
                            <Button asChild className="w-full">
                                <Link href={game.href}>
                                    プレイする <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
             </div>
        </div>
    );
}
