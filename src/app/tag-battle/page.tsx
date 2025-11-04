
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Users, Link as LinkIcon, Swords } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

type RoomState = 'idle' | 'creating' | 'waiting' | 'joining';

export default function TagBattlePage() {
    const { user, profile } = useUser();
    const { toast } = useToast();
    const [roomState, setRoomState] = useState<RoomState>('idle');
    const [roomId, setRoomId] = useState('');

    const handleCreateRoom = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'ログインが必要です。' });
            return;
        }
        setRoomState('creating');
        // In a real implementation, this would call a backend function to create a room.
        setTimeout(() => {
            const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomId(newRoomId);
            setRoomState('waiting');
            toast({ title: 'ルームを作成しました！', description: `ルームID: ${newRoomId}` });
        }, 1500);
    };

    const handleJoinRoom = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'ログインが必要です。' });
            return;
        }
        if (!roomId) {
            toast({ variant: 'destructive', title: 'ルームIDを入力してください。' });
            return;
        }
        setRoomState('joining');
        // In a real implementation, this would validate the room ID and join.
        setTimeout(() => {
            toast({ title: `ルーム「${roomId}」に参加しました。` });
            setRoomState('waiting'); // Move to waiting state after joining
        }, 1500);
    };


    if (!user) {
        return (
            <div className="container mx-auto p-4 text-center">
                <h1 className="text-4xl font-bold mb-4">タッグバトル (2v2)</h1>
                <p className="text-muted-foreground mb-8">
                    仲間とチームを組んで、2対2の熱いタッグバトルに挑もう！
                </p>
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>ログインが必要です</CardTitle>
                        <CardDescription>タッグバトルをプレイするには、マイページからログインしてください。</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    if (roomState === 'waiting' || roomState === 'creating' || roomState === 'joining') {
        return (
            <div className="container mx-auto p-4">
                 <h1 className="text-4xl font-bold mb-4 text-center">タッグバトル準備中</h1>
                 <p className="text-muted-foreground mb-8 text-center">
                    チームメンバーと対戦相手を待っています...
                </p>

                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>ルームID: {roomId}</span>
                             <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(roomId)}>
                                <LinkIcon className="mr-2" />
                                IDをコピー
                            </Button>
                        </CardTitle>
                        <CardDescription>チームメイトにルームIDを共有して参加してもらいましょう。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-8">
                            {/* Team 1 */}
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h3 className="font-bold text-lg text-blue-400">チームA</h3>
                                <div className="space-y-2">
                                    <PlayerSlot name={profile?.loginId || 'あなた'} status="準備完了" />
                                    <PlayerSlot name="チームメイトを待っています..." status="待機中" />
                                </div>
                            </div>
                             {/* Team 2 */}
                             <div className="space-y-4 p-4 border rounded-lg">
                                <h3 className="font-bold text-lg text-red-400">チームB</h3>
                                <div className="space-y-2">
                                    <PlayerSlot name="対戦相手を待っています..." status="待機中" />
                                    <PlayerSlot name="対戦相手を待っています..." status="待機中" />
                                </div>
                            </div>
                        </div>
                         <div className="text-center mt-8">
                            {(roomState === 'creating' || roomState === 'joining') && <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />}
                            {roomState === 'waiting' && (
                                <Button size="lg" disabled>
                                    <Users className="mr-2" />
                                    全員の準備が完了するまで待機中
                                </Button>
                            )}
                         </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4 text-center">タッグバトル (2v2)</h1>
            <p className="text-muted-foreground mb-8 text-center">
                仲間とチームを組んで、2対2の熱いタッグバトルに挑もう！
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Create Room */}
                <Card>
                    <CardHeader>
                        <CardTitle>ルームを作成</CardTitle>
                        <CardDescription>新しいルームを作成して、チームメイトを招待します。</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-12">
                        <Button size="lg" onClick={handleCreateRoom}>
                            <Users className="mr-2" />
                            ルームを作成する
                        </Button>
                    </CardContent>
                </Card>
                {/* Join Room */}
                <Card>
                    <CardHeader>
                        <CardTitle>ルームに参加</CardTitle>
                        <CardDescription>ルームIDを入力して、既存のルームに参加します。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <Input 
                            placeholder="ルームIDを入力..." 
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            className="text-center text-lg tracking-widest"
                        />
                        <Button className="w-full" size="lg" onClick={handleJoinRoom}>
                            <Swords className="mr-2" />
                            ルームに参加する
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const PlayerSlot = ({ name, status }: { name: string, status: string }) => {
    const isWaiting = status === '待機中';
    return (
        <div className={`flex items-center justify-between p-3 rounded-md ${isWaiting ? 'bg-secondary/50' : 'bg-green-500/20'}`}>
            <span className={`font-semibold ${isWaiting ? 'text-muted-foreground' : ''}`}>{name}</span>
            <span className={`text-sm font-bold ${isWaiting ? 'text-amber-500' : 'text-green-400'}`}>{status}</span>
        </div>
    )
}
