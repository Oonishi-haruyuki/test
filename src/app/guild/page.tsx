

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, initializeFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, LogOut, Users, Send } from 'lucide-react';
import { createGuild, joinGuild, leaveGuild, sendChatMessage } from '@/lib/guild-actions';
import { collection, query, where, onSnapshot, getDocs, doc, orderBy, limit } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Guild = {
    id: string;
    name: string;
    description: string;
    leaderId: string;
    memberIds: string[];
    activityTime?: string;
    genderRatio?: string;
    notes?: string;
};

type ChatMessage = {
    id: string;
    guildId: string;
    userId: string;
    userLoginId: string;
    text: string;
    createdAt: any;
};

export default function GuildPage() {
    const { user, profile, isUserLoading } = useUser();
    const { firestore } = initializeFirebase();
    const { toast } = useToast();

    const [userGuild, setUserGuild] = useState<Guild | null>(null);
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isUserLoading) return;
        setIsLoading(true);
        if (profile?.guildId) {
            const guildRef = doc(firestore, 'guilds', profile.guildId);
            const unsubscribe = onSnapshot(guildRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserGuild({ id: docSnap.id, ...docSnap.data() } as Guild);
                } else {
                    // Guild might have been disbanded, clear from user profile
                    setUserGuild(null);
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setUserGuild(null);
            // Fetch all guilds for joining
            const guildsQuery = query(collection(firestore, 'guilds'));
            const unsubscribe = onSnapshot(guildsQuery, (snapshot) => {
                const allGuilds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guild));
                setGuilds(allGuilds);
                setIsLoading(false);
            });
            return () => unsubscribe();
        }
    }, [profile, firestore, isUserLoading]);

    const handleJoinGuild = async (guildId: string) => {
        if (!user) return;
        const { success, message } = await joinGuild(guildId, user.uid);
        toast({ title: message, variant: success ? 'default' : 'destructive' });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-10 w-10" /></div>;
    }

    if (userGuild) {
        return <GuildDashboard guild={userGuild} />;
    }
    
    return <GuildBrowser guilds={guilds} onJoin={handleJoinGuild} />;
}

// Component to browse and create guilds
function GuildBrowser({ guilds, onJoin }: { guilds: Guild[], onJoin: (guildId: string) => void }) {
    const { user, profile } = useUser();
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [guildName, setGuildName] = useState('');
    const [description, setDescription] = useState('');
    const [activityTime, setActivityTime] = useState('');
    const [genderRatio, setGenderRatio] = useState('');
    const [notes, setNotes] = useState('');

    const handleCreateGuild = async () => {
        if (!user || !profile?.loginId) {
            toast({ title: 'ログインが必要です', variant: 'destructive' });
            return;
        }
        if (!guildName.trim() || !description.trim()) {
            toast({ title: 'ギルド名と説明は必須です', variant: 'destructive' });
            return;
        }
        setIsCreating(true);
        const { success, message } = await createGuild(user.uid, profile.loginId, guildName, description, activityTime, genderRatio, notes);
        toast({ title: message, variant: success ? 'default' : 'destructive' });
        if (success) {
            setGuildName('');
            setDescription('');
            setActivityTime('');
            setGenderRatio('');
            setNotes('');
        }
        setIsCreating(false);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">ギルドを探す・作成する</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Find Guild */}
                <Card>
                    <CardHeader>
                        <CardTitle>ギルド一覧</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                        {guilds.map(guild => (
                            <div key={guild.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-semibold">{guild.name}</p>
                                    <p className="text-sm text-muted-foreground">{guild.description}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Users className="h-3 w-3" />{guild.memberIds.length} / 50</p>
                                </div>
                                <Button size="sm" onClick={() => onJoin(guild.id)}>参加</Button>
                            </div>
                        ))}
                         {guilds.length === 0 && <p className="text-muted-foreground text-center">参加可能なギルドはありません。</p>}
                    </CardContent>
                </Card>

                {/* Create Guild */}
                <Card>
                    <CardHeader>
                        <CardTitle>ギルドを設立</CardTitle>
                        <CardDescription>新しいコミュニティを作りましょう。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="guildName">ギルド名</Label>
                            <Input id="guildName" placeholder="例: カードマスターズ" value={guildName} onChange={(e) => setGuildName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description">ギルド紹介</Label>
                            <Textarea id="description" placeholder="例: 初心者歓迎！楽しくプレイしましょう！" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="activityTime">主な活動時間</Label>
                            <Input id="activityTime" placeholder="例: 平日夜、週末" value={activityTime} onChange={(e) => setActivityTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="genderRatio">男女比</Label>
                            <Input id="genderRatio" placeholder="例: 半々、男性多め" value={genderRatio} onChange={(e) => setGenderRatio(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="notes">備考</Label>
                            <Textarea id="notes" placeholder="VC(ボイスチャット)の利用方針など" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                        <Button onClick={handleCreateGuild} disabled={isCreating} className="w-full">
                            {isCreating ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                            設立する
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Component for the user's current guild
function GuildDashboard({ guild }: { guild: Guild }) {
    const { user, profile } = useUser();
    const { toast } = useToast();
    const [isLeaving, setIsLeaving] = useState(false);

    const handleLeaveGuild = async () => {
        if (!user) return;
        setIsLeaving(true);
        const { success, message } = await leaveGuild(guild.id, user.uid);
        toast({ title: message, variant: success ? 'default' : 'destructive' });
        // The main component will handle the state change via onSnapshot
        setIsLeaving(false);
    };

    const isLeader = user?.uid === guild.leaderId;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{guild.name}</h1>
                <p className="text-muted-foreground">{guild.description}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <GuildChat guildId={guild.id} />
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>ギルド情報</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong>リーダー:</strong> {guild.leaderId}</p>
                            <p><strong>メンバー数:</strong> {guild.memberIds.length} / 50</p>
                            <p><strong>活動時間:</strong> {guild.activityTime || '未設定'}</p>
                            <p><strong>男女比:</strong> {guild.genderRatio || '未設定'}</p>
                            <p><strong>備考:</strong> {guild.notes || 'なし'}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>メンバーリスト</CardTitle></CardHeader>
                        <CardContent className="max-h-60 overflow-y-auto">
                           <MemberList memberIds={guild.memberIds} />
                        </CardContent>
                    </Card>
                    <Button onClick={handleLeaveGuild} variant="destructive" className="w-full" disabled={isLeaving}>
                        {isLeaving ? <Loader2 className="animate-spin" /> : <LogOut />}
                        {isLeader ? 'ギルドを解散する' : 'ギルドを脱退する'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function MemberList({ memberIds }: { memberIds: string[] }) {
    const [members, setMembers] = useState<any[]>([]);
    const { firestore } = initializeFirebase();

    useEffect(() => {
        const fetchMembers = async () => {
             if (memberIds.length === 0) {
                setMembers([]);
                return;
            }
            const q = query(collection(firestore, 'users'), where('__name__', 'in', memberIds));
            const userDocs = await getDocs(q);
            const memberData = userDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Preserve original order from memberIds
            const sortedMembers = memberIds.map(id => {
                const found = memberData.find(m => m.id === id);
                return found || { id, loginId: '不明なユーザー' };
            });
            
            setMembers(sortedMembers);
        };
        fetchMembers();
    }, [memberIds, firestore]);

    return (
        <ul className="space-y-2">
            {members.map(member => (
                <li key={member.id} className="text-sm p-2 bg-secondary/50 rounded-md">{member.loginId || '...'}</li>
            ))}
        </ul>
    );
}

function GuildChat({ guildId }: { guildId: string }) {
    const { user, profile } = useUser();
    const { firestore } = initializeFirebase();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useCallback((node: HTMLDivElement) => {
        if (node) {
            node.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    useEffect(() => {
        const messagesQuery = query(
            collection(firestore, 'guilds', guildId, 'messages'), 
            orderBy('createdAt', 'asc'),
            limit(50) // Limit messages to avoid performance issues
        );
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs
                .filter(doc => doc.data().createdAt) // Ensure createdAt is not null
                .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
            setMessages(msgs);
        }, (error) => {
            console.error("Error fetching chat messages: ", error);
        });
        return () => unsubscribe();
    }, [guildId, firestore]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !profile?.loginId) return;
        setIsSending(true);
        const result = await sendChatMessage(guildId, user.uid, profile.loginId, newMessage);
        if(result.success) {
            setNewMessage('');
        } else {
            // Handle error, maybe show a toast
        }
        setIsSending(false);
    };

    return (
        <Card className="flex flex-col h-[600px]">
            <CardHeader><CardTitle>ギルドチャット</CardTitle></CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-4 p-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.userId === user?.uid ? 'justify-end' : ''}`}>
                         <div className={`max-w-[75%] p-3 rounded-lg ${msg.userId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                            <p className="font-bold text-sm">{msg.userLoginId}</p>
                            <p className="text-base whitespace-pre-wrap">{msg.text}</p>
                            <p className="text-xs text-right opacity-70 mt-1">
                                {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        placeholder="メッセージを入力..."
                        disabled={isSending}
                    />
                    <Button type="submit" disabled={!newMessage.trim() || isSending}>
                        {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
            </div>
        </Card>
    );
}
