
'use client';

import { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type UserRanking = {
    id: string;
    loginId: string;
    rating: number;
    title?: string;
};

export default function RankingPage() {
    const [rankings, setRankings] = useState<UserRanking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRankings = async () => {
            const { firestore } = initializeFirebase();
            const usersRef = collection(firestore, 'users');
            // 'rating'で降順に並べ替え、上位100件を取得
            const q = query(usersRef, orderBy('rating', 'desc'), limit(100));

            try {
                const querySnapshot = await getDocs(q);
                const fetchedRankings = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    loginId: doc.data().loginId || '匿名',
                    rating: doc.data().rating || 1000,
                    title: doc.data().title,
                }));
                setRankings(fetchedRankings);
            } catch (error) {
                console.error("Error fetching rankings: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRankings();
    }, []);

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-500/80 text-white"><Trophy className="mr-1" /> 1位</Badge>;
        if (rank === 2) return <Badge variant="default" className="bg-slate-400 hover:bg-slate-400/80 text-white">2位</Badge>;
        if (rank === 3) return <Badge variant="default" className="bg-amber-700 hover:bg-amber-700/80 text-white">3位</Badge>;
        return <Badge variant="outline">{rank}位</Badge>;
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold text-center mb-4">ランキング</h1>
            <p className="text-muted-foreground text-center mb-8">最強のカードクラフターは誰だ？レーティング上位100名を表示します。</p>

            <Card>
                <CardHeader>
                    <CardTitle>トッププレイヤー</CardTitle>
                    <CardDescription>現在のレーティングに基づいた順位です。</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="animate-spin h-10 w-10 text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">順位</TableHead>
                                    <TableHead>プレイヤー</TableHead>
                                    <TableHead className="text-right">レーティング</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rankings.map((player, index) => (
                                    <TableRow key={player.id}>
                                        <TableCell>{getRankBadge(index + 1)}</TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <span>{player.loginId}</span>
                                                {player.title && <Badge variant="secondary">{player.title}</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-lg">{player.rating}</TableCell>
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
