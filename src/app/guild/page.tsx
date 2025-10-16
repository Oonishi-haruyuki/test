
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, initializeFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Users, Shield, LogOut, PlusCircle, Crown, Search, Coins } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, orderBy, limit, startAfter, updateDoc } from 'firebase/firestore';
import { createGuild, joinGuild, leaveGuild, sendChatMessage } from '@/lib/guild-actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCurrency } from '@/hooks/use-currency';

interface Guild {
    id: string;
    name: string;
    description: string;
    leaderId: string;
    memberIds: string[];
}

interface ChatMessage {
    id: string;
    userId: string;
    userLoginId: string;
    text: string;
    createdAt: any;
}

const GUILD_CREATION_COST = 5000;

const GuildChat = ({ guildId, userLoginId }: { guildId: string, userLoginId: string }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { firestore } = initializeFirebase();
    const { toast } = useToast();

    useEffect(() => {
        const messagesRef = collection(firestore, 'guilds', guildId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [guildId, firestore]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        const result = await sendChatMessage(guildId, userLoginId, newMessage);
        if (result.success) {
            setNewMessage('');
        } else {
            toast({ variant: 'destructive', title: '送信失敗', description: result.message });
        }
        setIsSending(false);
    };

    return (
        <div className="flex flex-col h-[500px]">
            <ScrollArea className="flex-grow p-4 border rounded-md">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id}>
                            <span className="font-bold text-sm">{msg.userLoginId}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                                {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true, locale: ja }) : ''}
                            </span>
                            <p className="bg-muted p-2 rounded-md">{msg.text}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="メッセージを入力..." disabled={isSending} />
                <Button type="submit" disabled={isSending}>
                    {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </form>
        </div>
    );
};

export default function GuildPage() {
    const { user, profile, isUserLoading } = useUser();
    const { currency, spendCurrency } = useCurrency();
    const { toast } = useToast();
    const [myGuild, setMyGuild] = useState<Guild | null>(null);
    const [guildMembers, setGuildMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const { firestore } = initializeFirebase();

    // Guild Creation
    const [newGuildName, setNewGuildName] = useState('');
    const [newGuildDesc, setNewGuildDesc] = useState('');

    // Guild Search
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Guild[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [lastVisible, setLastVisible] = useState<any>(null);

    const fetchMyGuildData = useCallback(async (guildId: string) => {
        const guildRef = doc(firestore, 'guilds', guildId);
        const guildSnap = await getDoc(guildRef);
        if (guildSnap.exists()) {
            const guildData = { id: guildSnap.id, ...guildSnap.data() } as Guild;
            setMyGuild(guildData);

            // Fetch member profiles
            const memberProfiles: any[] = [];
            for (const memberId of guildData.memberIds) {
                const userRef = doc(firestore, 'users', memberId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    memberProfiles.push({ id: userSnap.id, ...userSnap.data() });
                }
            }
            setGuildMembers(memberProfiles);

        } else {
            // User has a guildId but guild doesn't exist, likely deleted. Clear from user profile.
             if (user) {
                const userRef = doc(firestore, 'users', user.uid);
                await updateDoc(userRef, { guildId: null });
             }
        }
        setIsLoading(false);
    }, [firestore, user]);

    useEffect(() => {
        if (isUserLoading) return;
        if (profile?.guildId) {
            fetchMyGuildData(profile.guildId);
        } else {
            setMyGuild(null);
            setIsLoading(false);
        }
    }, [profile, isUserLoading, fetchMyGuildData]);

    const handleCreateGuild = async () => {
        if (!user || !profile?.loginId) return;
        if (!newGuildName.trim()) {
            toast({ variant: 'destructive', title: 'ギルド名を入力してください。' });
            return;
        }

        if (currency < GUILD_CREATION_COST) {
            toast({ variant: 'destructive', title: 'Gコインが足りません！', description: `ギルド作成には ${GUILD_CREATION_COST}G が必要です。` });
            return;
        }

        setIsProcessing(true);
        if (spendCurrency(GUILD_CREATION_COST)) {
            const result = await createGuild(user.uid, profile.loginId, newGuildName, newGuildDesc);
            if (result.success && result.guildId) {
                toast({ title: 'ギルドを作成しました！', description: `${GUILD_CREATION_COST}G を消費しました。` });
                fetchMyGuildData(result.guildId);
            } else {
                toast({ variant: 'destructive', title: '作成失敗', description: result.message });
            }
        } else {
             toast({ variant: 'destructive', title: 'Gコインの支払いに失敗しました。' });
        }
        setIsProcessing(false);
    };
    
    const handleSearchGuilds = async () => {
        setIsSearching(true);
        setSearchResults([]);
        
        let q;
        if(searchTerm.trim()) {
            q = query(collection(firestore, 'guilds'), where('name', '>=', searchTerm.trim()), where('name', '<=', searchTerm.trim() + '\uf8ff'), limit(10));
        } else {
            q = query(collection(firestore, 'guilds'), orderBy('name'), limit(10));
        }
        
        const docSnaps = await getDocs(q);
        const guilds = docSnaps.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guild));
        setSearchResults(guilds);
        setLastVisible(docSnaps.docs[docSnaps.docs.length - 1]);
        setIsSearching(false);
    }
    
    const handleJoinGuild = async (guildId: string) => {
        if (!user || !profile?.loginId) return;
        setIsProcessing(true);
        const result = await joinGuild(guildId, user.uid);
         if (result.success) {
            toast({ title: 'ギルドに参加しました！' });
            fetchMyGuildData(guildId);
        } else {
            toast({ variant: 'destructive', title: '参加失敗', description: result.message });
        }
        setIsProcessing(false);
    }
    
    const handleLeaveGuild = async () => {
        if (!user || !myGuild) return;
         setIsProcessing(true);
        const result = await leaveGuild(myGuild.id, user.uid);
         if (result.success) {
            toast({ title: 'ギルドを脱退しました。' });
            setMyGuild(null);
            setGuildMembers([]);
        } else {
            toast({ variant: 'destructive', title: '脱退失敗', description: result.message });
        }
        setIsProcessing(false);
    }

    if (isLoading) {
        return <main className="text-center p-10"><Loader2 className="animate-spin" /> ロード中...</main>;
    }

    if (!user) {
        return (
             <main className="text-center p-10">
                <Card className="max-w-md mx-auto">
                    <CardHeader><CardTitle>ログインが必要です</CardTitle></CardHeader>
                    <CardContent><p>ギルド機能を利用するには、マイページからログインしてください。</p></CardContent>
                </Card>
            </main>
        );
    }

    if (myGuild) {
        const isLeader = user.uid === myGuild.leaderId;
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl flex items-center justify-between">
                        {myGuild.name}
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isProcessing}><LogOut /> 脱退</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>本当にギルドを脱退しますか？</DialogTitle>
                                    <DialogDescription>リーダーが脱退するとギルドは解散します。この操作は元に戻せません。</DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="secondary">キャンセル</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                         <Button variant="destructive" onClick={handleLeaveGuild}>脱退する</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardTitle>
                    <CardDescription>{myGuild.description || '説明がありません。'}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-bold mb-2 flex items-center gap-2"><Users />メンバー ({myGuild.memberIds.length})</h3>
                        <ScrollArea className="h-96 border rounded-md p-4">
                            <ul className="space-y-2">
                                {guildMembers.map(member => (
                                    <li key={member.id} className="flex items-center gap-2 text-sm">
                                        {member.id === myGuild.leaderId ? <Crown className="text-yellow-500"/> : <Shield />}
                                        {member.loginId}
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </div>
                     <div className="md:col-span-2">
                        <h3 className="font-bold mb-2">ギルドチャット</h3>
                         <GuildChat guildId={myGuild.id} userLoginId={profile?.loginId || '匿名'} />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>ギルドに参加しよう</CardTitle>
                <CardDescription>ギルドを作成するか、既存のギルドに参加して仲間と交流しよう。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                     <Dialog>
                        <DialogTrigger asChild>
                           <Button className="w-full" size="lg"><PlusCircle /> ギルドを作成</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>新しいギルドを作成</DialogTitle>
                                <DialogDescription>ギルドの作成には {GUILD_CREATION_COST.toLocaleString()}G が必要です。</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="guild-name">ギルド名</Label>
                                    <Input id="guild-name" value={newGuildName} onChange={e => setNewGuildName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="guild-desc">ギルド紹介文</Label>
                                    <Input id="guild-desc" value={newGuildDesc} onChange={e => setNewGuildDesc(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">キャンセル</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button onClick={handleCreateGuild} disabled={isProcessing || !newGuildName}>
                                        {isProcessing && <Loader2 className="animate-spin mr-2" />}作成する
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-4">ギルドを探す</h3>
                    <div className="flex gap-2 mb-4">
                        <Input placeholder="ギルド名で検索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Button onClick={handleSearchGuilds} disabled={isSearching}>{isSearching ? <Loader2 className="animate-spin" /> : <Search />}</Button>
                    </div>
                     <ScrollArea className="h-64 border rounded-md">
                        <ul className="p-2 space-y-2">
                            {searchResults.map(guild => (
                                <li key={guild.id} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                                    <div>
                                        <p className="font-bold">{guild.name}</p>
                                        <p className="text-sm text-muted-foreground">{guild.memberIds.length}人のメンバー</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleJoinGuild(guild.id)} disabled={isProcessing}>参加</Button>
                                </li>
                            ))}
                            {searchResults.length === 0 && !isSearching && <p className="text-center text-sm text-muted-foreground py-4">ギルドが見つかりません。</p>}
                        </ul>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}

    