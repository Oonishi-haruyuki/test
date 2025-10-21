

'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';
import { initializeFirebase } from '@/firebase';

interface RankingEntry {
    id: string;
    loginId?: string;
    rating: number;
}

export default function RankingPage() {
    const [rankings, setRankings] = useState<RankingEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const { firestore } = initializeFirebase();
                const rankingsRef = collection(firestore, 'users');
                const q = query(rankingsRef, orderBy('rating', 'desc'), limit(100));
                
                const querySnapshot = await getDocs(q);
                const rankingsData: RankingEntry[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    rankingsData.push({
                        id: doc.id,
                        loginId: data.loginId || '匿名ユーザー',
                        rating: data.rating,
                    });
                });
                setRankings(rankingsData);
            } catch (err) {
                console.error("Error fetching rankings: ", err);
                setError('ランキングの読み込みに失敗しました。');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRankings();
    }, []);
    
    const getRankIcon = (rank: number) => {
        if (rank === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
        if (rank === 1) return <Medal className="h-6 w-6 text-gray-400" />;
        if (rank === 2) return <Award className="h-6 w-6 text-orange-400" />;
        return <span className="text-sm font-bold w-6 text-center">{rank + 1}</span>;
    }


    return (
        <>
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl">ランキング</CardTitle>
                    <CardDescription>全プレイヤーの対戦レーティングに基づくトップ100ランキングです。</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                         <Skeleton className="h-4 w-1/4" />
                                    </div>
                                    <Skeleton className="h-4 w-1/6" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <p className="text-center text-destructive">{error}</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">順位</TableHead>
                                    <TableHead>プレイヤー</TableHead>
                                    <TableHead className="text-right">レーティング</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rankings.map((entry, index) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center justify-center h-full">
                                                {getRankIcon(index)}
                                            </div>
                                        </TableCell>
                                        <TableCell>{entry.loginId}</TableCell>
                                        <TableCell className="text-right font-mono">{entry.rating}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
