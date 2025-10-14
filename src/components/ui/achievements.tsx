

'use client';

import { Star, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
};

export type Title = {
  id: string;
  name: string;
};

const achievementsList: Omit<Achievement, 'unlocked'>[] = [
    { id: 'wins-1', name: '初勝利', description: '初めてAIに勝利する' },
    { id: 'wins-10', name: 'ベテラン', description: 'AIに10回勝利する' },
    { id: 'wins-50', name: 'エキスパート', description: 'AIに50回勝利する' },
    { id: 'wins-100', name: 'マスター', description: 'AIに100回勝利する' },
    { id: 'collection-10', name: 'コレクター', description: '10種類のカードを集める' },
    { id: 'collection-50', name: 'マスターコレクター', description: '50種類のカードを集める' },
    { id: 'collection-100', name: 'コンプリート', description: '100種類のカードを集める' },
];

export function AchievementsUI({ wins, uniqueCardCount, onTitleChange }: { wins: number, uniqueCardCount: number, onTitleChange: (title: string) => void }) {
    const achievements: Achievement[] = achievementsList.map(ach => {
        let unlocked = false;
        if (ach.id.startsWith('wins-')) {
            const requiredWins = parseInt(ach.id.split('-')[1]);
            unlocked = wins >= requiredWins;
        } else if (ach.id.startsWith('collection-')) {
            const requiredCount = parseInt(ach.id.split('-')[1]);
            unlocked = uniqueCardCount >= requiredCount;
        }
        return { ...ach, unlocked };
    });

    const unlockedAchievements = achievements.filter(ach => ach.unlocked);

    return (
        <Card>
            <CardHeader>
                <CardTitle>実績と称号</CardTitle>
                <CardDescription>獲得した実績一覧と称号の設定ができます。</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold mb-2">称号の選択</h4>
                        <Select onValueChange={onTitleChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="称号を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="未設定">未設定</SelectItem>
                                {unlockedAchievements.map(ach => (
                                    <SelectItem key={ach.id} value={ach.name}>{ach.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">実績一覧</h4>
                        <ul className="space-y-4">
                        {achievements.map((ach) => (
                            <li key={ach.id} className="flex items-center">
                            <div className="mr-4">
                                {ach.unlocked ? (
                                <Trophy className="h-8 w-8 text-yellow-500" />
                                ) : (
                                <Trophy className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold">{ach.name}</h4>
                                <p className="text-sm text-muted-foreground">{ach.description}</p>
                            </div>
                            </li>
                        ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
