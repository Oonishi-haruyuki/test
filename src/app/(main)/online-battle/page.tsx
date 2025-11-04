
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, initializeFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Swords, PlusCircle } from 'lucide-react';
import { createBattleRoom, joinBattleRoom } from '@/lib/battle-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

type BattleRoom = {
    id: string;
    player1: { id: string, loginId: string };
    status: 'waiting' | 'starting' | 'in-progress' | 'finished';
    createdAt: { seconds: number, nanoseconds: number };
}

export default function OnlineBattleLobbyPage() {
    const { user, profile } = useUser();
    const { firestore } = initializeFirebase();
    const { toast } = useToast();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);

    // Query for waiting rooms
    const roomsQuery = query(
        collection(firestore, 'battleRooms'), 
        where('status', '==', 'waiting'),
        orderBy('createdAt', 'desc'),
        limit(20)
    );
    const { data: rooms, isLoading: isLoadingRooms } = useCollection<BattleRoom>(roomsQuery);

    const handleCreateRoom = async () => {
        if (!user || !profile?.loginId) return;
        setIsCreating(true);
        const result = await createBattleRoom(user.uid, profile.loginId);
        if (result.success && result.roomId) {
            toast({ title: '対戦ルームを作成しました！' });
            // Redirect to battle page which will act as a waiting room
            router.push(`/battle/${result.roomId}`);
        } else {
            toast({ variant: 'destructive', title: result.message });
        }
        setIsCreating(false);
    };

     const handleJoinRoom = async (roomId: string) => {
        if (!user || !profile?.loginId) return;
        const result = await joinBattleRoom(roomId, user.uid, profile.loginId);
         if (result.success) {
            toast({ title: '対戦ルームに参加しました！' });
            router.push(`/battle/${roomId}`);
        } else {
            toast({ variant: 'destructive', title: result.message });
        }
    };


    if (!user) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-4xl font-bold mb-4">オンライン対戦</h1>
                <p className="text-muted-foreground mb-8">
                    世界中のプレイヤーと腕を競い合おう。
                </p>
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>ログインが必要です</CardTitle>
                        <CardDescription>オンライン対戦をプレイするには、マイページからログインまたは新規登録してください。</CardDescription>
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-bold">オンライン対戦ロビー</h1>
                    <p className="text-muted-foreground mt-2">
                        対戦相手を探すか、自分でルームを作成しよう。
                    </p>
                </div>
                 <Button onClick={handleCreateRoom} disabled={isCreating} size="lg">
                    {isCreating ? <Loader2 className="mr-2 animate-spin" /> : <PlusCircle className="mr-2"/>}
                    対戦ルームを作成
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>対戦待ちルーム一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingRooms && <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>}
                    {!isLoadingRooms && (!rooms || rooms.length === 0) && (
                        <p className="text-muted-foreground text-center p-8">現在、対戦待ちのルームはありません。新しいルームを作成してみましょう！</p>
                    )}
                     {!isLoadingRooms && rooms && rooms.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>プレイヤー</TableHead>
                                    <TableHead>作成日時</TableHead>
                                    <TableHead className="text-right">アクション</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rooms.map((room) => (
                                    <TableRow key={room.id}>
                                        <TableCell className="font-medium">{room.player1.loginId}</TableCell>
                                        <TableCell>
                                             {room.createdAt ? formatDistanceToNow(new Date(room.createdAt.seconds * 1000), { addSuffix: true, locale: ja }) : '...'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleJoinRoom(room.id)} disabled={room.player1.id === user.uid}>
                                                <Swords className="mr-2" />
                                                挑戦する
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>

        </div>
    );
}
