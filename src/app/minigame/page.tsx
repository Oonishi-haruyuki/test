'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Bot, HelpCircle, Gamepad2, SortAsc, Brain, Shapes } from 'lucide-react';

type Minigame = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
};

const minigames: Minigame[] = [
    {
        title: 'ハイ＆ロー',
        description: '次のカードのマナは高い？低い？運試しで報酬ゲット！',
        href: '/minigame/high-low',
        icon: SortAsc,
    },
    {
        title: 'マナ当てクイズ',
        description: 'カードの絵と名前からマナコストを当てよう！',
        href: '/minigame/guess-cost',
        icon: HelpCircle,
    },
    {
        title: '種族当てクイズ',
        description: 'カードの情報から種族（タイプ）を当てよう！',
        href: '/minigame/guess-type',
        icon: Shapes,
    },
];

export default function MinigameHubPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto p-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold">ミニゲームセンター</h1>
                <p className="text-muted-foreground mt-2">
                    ちょっとした息抜きに。Gコインを稼げるミニゲームに挑戦しよう！
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {minigames.map((game) => (
                    <Card 
                        key={game.title}
                        className="flex flex-col cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                        onClick={() => router.push(game.href)}
                    >
                        <CardHeader className="flex-row items-center gap-4">
                            <game.icon className="w-10 h-10 text-primary" />
                            <div>
                                <CardTitle>{game.title}</CardTitle>
                                <CardDescription>{game.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-end justify-end">
                           <div className="flex items-center text-sm text-muted-foreground">
                                プレイする <ArrowRight className="w-4 h-4 ml-1" />
                           </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
