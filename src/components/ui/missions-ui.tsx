
'use client';

import { Mission } from '@/lib/missions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';
import { Button } from './button';
import { Progress } from './progress';
import { Check, Coins } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MissionsUIProps {
    missions: Mission[];
    onClaimReward: (missionId: string) => void;
}

export function MissionsUI({ missions, onClaimReward }: MissionsUIProps) {
    const dailyMissions = missions.filter(m => m.type === 'daily');
    const weeklyMissions = missions.filter(m => m.type === 'weekly');
    const monthlyMissions = missions.filter(m => m.type === 'monthly');
    
    const MissionItem = ({ mission }: { mission: Mission }) => {
        const isComplete = mission.progress >= mission.goal;
        
        return (
             <li className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border">
                <div className="flex-grow pr-4">
                    <p className="font-semibold">{mission.title}</p>
                    <p className="text-sm text-muted-foreground">{mission.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Progress value={(mission.progress / mission.goal) * 100} className="w-full h-3" />
                        <span className="text-xs font-mono text-muted-foreground">{mission.progress}/{mission.goal}</span>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center font-bold text-yellow-500">
                        <Coins className="mr-1 h-5 w-5" />
                        <span>{mission.reward}</span>
                    </div>
                    {mission.claimed ? (
                        <Button variant="outline" size="sm" disabled>
                            <Check className="mr-2 h-4 w-4" />
                            受取済
                        </Button>
                    ) : (
                        <Button size="sm" disabled={!isComplete} onClick={() => onClaimReward(mission.id)}>
                            受け取る
                        </Button>
                    )}
                </div>
            </li>
        )
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>ミッション</CardTitle>
                <CardDescription>ミッションを達成して報酬を獲得しましょう！</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="daily">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="daily">デイリー</TabsTrigger>
                        <TabsTrigger value="weekly">ウィークリー</TabsTrigger>
                        <TabsTrigger value="monthly">マンスリー</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily" className="pt-4">
                        <ul className="space-y-3">
                           {dailyMissions.map(m => <MissionItem key={m.id} mission={m} />)}
                        </ul>
                    </TabsContent>
                     <TabsContent value="weekly" className="pt-4">
                        <ul className="space-y-3">
                            {weeklyMissions.map(m => <MissionItem key={m.id} mission={m} />)}
                        </ul>
                    </TabsContent>
                     <TabsContent value="monthly" className="pt-4">
                        <ul className="space-y-3">
                            {monthlyMissions.map(m => <MissionItem key={m.id} mission={m} />)}
                        </ul>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
