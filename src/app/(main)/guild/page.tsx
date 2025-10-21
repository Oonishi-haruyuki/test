
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/firebase';
import { initializeFirebase } from '@/firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs,
    doc, 
    onSnapshot, 
    orderBy, 
    limit,
    getDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, LogIn, Users, Send, Home, UserPlus, LogOut } from 'lucide-react';
import { createGuild, joinGuild, leaveGuild, sendChatMessage } from '@/lib/guild-actions';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';

type Guild = {
    id: string;
    name: string;
    description: string;
    memberIds: string[];
    activityTime?: string;
    genderRatio?: string;
    notes?: string;
};

type ChatMessage = {
    id: string;
    userId: string;
    userLoginId: string;
    text: string;
    createdAt: any;
};

type Member = {
    id: string;
    loginId: string;
    rating: number;
    title?: string;
};


const MemberList = ({ memberIds }: { memberIds: string[] }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { firestore } = initializeFirebase();

    useEffect(() => {
        const fetchMembers = async () => {
            if (memberIds.length === 0) {
                setMembers([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const fetchedMembers: Member[] = [];
            
            // Firestore 'in' query has a limit of 10 items. Chunk the array.
            const chunks = [];
            for (let i = 0; i < memberIds.length; i += 10) {
                chunks.push(memberIds.slice(i, i + 10));
            }

            try {
                for (const chunk of chunks) {
                    const q = query(collection(firestore, 'users'), where('__name__', 'in', chunk));
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        fetchedMembers.push({
                            id: doc.id,
                            loginId: data.loginId || 'N/A',
                            rating: data.rating || 1000,
                            title: data.title,
                        });
                    });
                }
                setMembers(fetchedMembers.sort((a,b) => b.rating - a.rating));
            } catch (error) {
                console.error("Error fetching members:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, [memberIds, firestore]);

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <ul className="space-y-2">
            {members.map(member => (
                <li key={member.id} className="flex justify-between items-center p-2 bg-secondary/30 rounded-md">
                    <div className="flex items-center gap-2">
                         <span className="font-semibold">{member.loginId}</span>
                         {member.title && <Badge variant="secondary">{member.title}</Badge>}
                    </div>
                    <span className="font-bold">{member.rating}</span>
                </li>
            ))}
        </ul>
    );
};


const GuildChat = ({ guildId }: { guildId: string }) => {
    const { user, profile } = useUser();
    const { firestore } = initializeFirebase();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const messagesRef = collection(firestore, 'guilds', guildId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages: ChatMessage[] = [];
            snapshot.forEach(doc => {
                if(doc.data().createdAt) { // Only add messages with a timestamp
                    fetchedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
                }
            });
            setMessages(fetchedMessages);
        });

        return () => unsubscribe();
    }, [guildId, firestore]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !profile?.loginId) return;
        setIsSending(true);
        await sendChatMessage(guildId, user.uid, profile.loginId, newMessage);
        setNewMessage('');
        setIsSending(false);
    };

    return (
        <Card className="flex flex-col h-[500px]">
            <CardHeader>
                <CardTitle>ギルドチャット</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex flex-col ${msg.userId === user?.uid ? 'items-end' : 'items-start'}`}>
                                <div className="text-xs text-muted-foreground">{msg.userLoginId}</div>
                                <div className={`p-2 rounded-lg max-w-xs ${msg.userId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <div className="p-4 border-t">
                 <div className="flex gap-2">
                    <Textarea 
                        placeholder="メッセージを入力..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                    />
                    <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default function GuildPage() {
    const { user, profile, isUserLoading } = useUser();
    const { firestore } = initializeFirebase();
    const { toast } = useToast();
    const [guild, setGuild] = useState<Guild | null>(null);
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Fetch user's current guild ---
    useEffect(() => {
        if (isUserLoading) return;
        setIsLoading(true);
        if (user && profile?.guildId) {
            const guildRef = doc(firestore, 'guilds', profile.guildId);
            const unsubscribe = onSnapshot(guildRef, (doc) => {
                if (doc.exists()) {
                    setGuild({ id: doc.id, ...doc.data() } as Guild);
                } else {
                    setGuild(null);
                }
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setGuild(null);
            setIsLoading(false);
        }
    }, [user, profile?.guildId, firestore, isUserLoading]);

    // --- Fetch all guilds for the guild list ---
    useEffect(() => {
        const guildsRef = collection(firestore, 'guilds');
        const q = query(guildsRef, orderBy('createdAt', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedGuilds: Guild[] = [];
            snapshot.forEach((doc) => {
                fetchedGuilds.push({ id: doc.id, ...doc.data() } as Guild);
            });
            setGuilds(fetchedGuilds);
        });
        return () => unsubscribe();
    }, [firestore]);


    const handleCreateGuild = async (details: {name: string, description: string, activityTime: string, genderRatio: string, notes: string}) => {
        if (!user || !profile?.loginId) return;
        const { success, message, guildId } = await createGuild(user.uid, profile.loginId, details.name, details.description, details.activityTime, details.genderRatio, details.notes);
        toast({ title: message, variant: success ? 'default' : 'destructive' });
    };

    const handleJoinGuild = async (guildId: string) => {
        if (!user) return;
        const { success, message } = await joinGuild(guildId, user.uid);
        toast({ title: message, variant: success ? 'default' : 'destructive' });
    };

    const handleLeaveGuild = async () => {
        if (!user || !guild) return;
        const { success, message } = await leaveGuild(guild.id, user.uid);
        toast({ title: message, variant: success ? 'default' : 'destructive' });
        if (success) {
            setGuild(null);
        }
    }

    if (isUserLoading || isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-10 w-10" /></div>;
    }

    if (!user) {
        return <div className="text-center p-8"><p>ギルド機能を利用するには、マイページからログインしてください。</p></div>
    }

    if (guild) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{guild.name}</h1>
                        <p className="text-muted-foreground">{guild.description}</p>
                    </div>
                     <Button variant="destructive" onClick={handleLeaveGuild}>ギルドを脱退</Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <GuildChat guildId={guild.id} />
                         <Card>
                            <CardHeader><CardTitle>ギルド情報</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <p><strong>活動時間:</strong> {guild.activityTime || '未設定'}</p>
                                <p><strong>男女比:</strong> {guild.genderRatio || '未設定'}</p>
                                <p><strong>ノート:</strong> {guild.notes || 'なし'}</p>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card>
                             <CardHeader>
                                <CardTitle>メンバー ({guild.memberIds.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MemberList memberIds={guild.memberIds} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">ギルドを探す</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Dialog>
                    <DialogTrigger asChild>
                        <Card className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-secondary transition-colors min-h-[150px]">
                            <PlusCircle className="h-10 w-10 text-muted-foreground mb-2" />
                            <CardTitle>ギルドを設立</CardTitle>
                            <CardDescription>新しいギルドを作ろう</CardDescription>
                        </Card>
                    </DialogTrigger>
                    <CreateGuildDialog onCreate={handleCreateGuild} />
                </Dialog>

                {guilds.map(g => (
                    <Card key={g.id} className="flex flex-col min-h-[150px]">
                        <CardHeader>
                            <CardTitle>{g.name}</CardTitle>
                            <CardDescription>{g.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-end justify-between">
                            <div className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> {g.memberIds.length}</div>
                            <Button size="sm" onClick={() => handleJoinGuild(g.id)}>参加する</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function CreateGuildDialog({ onCreate }: { onCreate: (details: any) => void }) {
    const [details, setDetails] = useState({ name: '', description: '', activityTime: '', genderRatio: '', notes: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onCreate(details);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>新しいギルドを設立</DialogTitle>
                <DialogDescription>ギルドの詳細情報を入力してください。</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">ギルド名</Label>
                    <Input id="name" name="name" onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">紹介文</Label>
                    <Textarea id="description" name="description" onChange={handleChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="activityTime">活動時間</Label>
                    <Input id="activityTime" name="activityTime" placeholder="例: 平日夜、週末終日" onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="genderRatio">男女比</Label>
                    <Input id="genderRatio" name="genderRatio" placeholder="例: 5:5、男性多め" onChange={handleChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="notes">ノート</Label>
                    <Textarea id="notes" name="notes" placeholder="ギルドのルールや目標など" onChange={handleChange} />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSubmit}>設立する</Button>
            </DialogFooter>
        </DialogContent>
    )
}
