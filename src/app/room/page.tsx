"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RoomPage() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const createRoom = async () => {
    if (!user) {
      // toast({ variant: "destructive", title: "ログインが必要です。" });
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        players: [user.uid],
        status: "waiting",
        createdAt: new Date(),
        turn: user.uid,
        // gameStateをここに追加することも可能
      });
      console.log("Document written with ID: ", docRef.id);
      router.push(`/battle?roomId=${docRef.id}`);
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({ variant: "destructive", title: "ルームの作成に失敗しました。" });
    }
  };

  const joinRoom = async () => {
    if (!roomId) {
        toast({ title: "ルームIDを入力してください。" });
        return;
    }
    if (!user) {
      // toast({ variant: "destructive", title: "ログインが必要です。" });
      return;
    }

    try {
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            toast({ variant: "destructive", title: "ルームが見つかりません。" });
            return;
        }

        const roomData = roomSnap.data();
        const players = roomData.players || [];

        if (players.length >= 2 && !players.includes(user.uid)) {
            toast({ variant: "destructive", title: "このルームは満員です。" });
            return;
        }

        if (!players.includes(user.uid)) {
            await updateDoc(roomRef, {
                players: arrayUnion(user.uid),
                status: "playing" // 2人目が入ったらゲーム開始
            });
            toast({ title: "ルームに参加しました！" });
        }
        
        router.push(`/battle?roomId=${roomId}`);

    } catch (e) {
        console.error("Error joining room: ", e);
        toast({ variant: "destructive", title: "ルームへの参加に失敗しました。" });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">対戦ルーム</h1>
      <div className="space-y-4">
        <div>
          <Button onClick={createRoom}>新しいルームを作成する</Button>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="room-id">ルームID:</Label>
          <Input
            id="room-id"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="ルームIDを入力"
          />
          <Button onClick={joinRoom}>ルームに参加する</Button>
        </div>
      </div>
    </div>
  );
}
