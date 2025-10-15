
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  useAuth,
  useUser,
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  doc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Swords, User, Users } from 'lucide-react';
import type { CardData } from '@/components/card-editor';
import { elementalDeck } from '../battle/page';

// Simplified GameState for Firestore
interface GameState {
  id?: string;
  status: 'waiting' | 'active' | 'finished';
  player1Id: string;
  player2Id?: string;
  player1Health: number;
  player2Health: number;
  turn: number;
  isPlayer1Turn: boolean;
  winner?: string;
  lastAction?: string;
  createdAt: any;
  player1Board?: CardData[];
  player2Board?: CardData[];
  player1Hand?: CardData[];
  player2Hand?: CardData[];
  player1DeckCount?: number;
  player2DeckCount?: number;
  player1Mana?: number;
  player2Mana?: number;
}

function GameLobby() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading: userLoading } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const gamesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'games'),
            where('status', '==', 'waiting'),
            orderBy('createdAt', 'desc'),
            limit(10)
          )
        : null,
    [firestore]
  );

  const { data: openGames, isLoading: gamesLoading } = useCollection(gamesQuery);

  const createGame = async () => {
    if (!user || !firestore) return;
    setIsCreating(true);
    try {
      const initialDeck = elementalDeck;
      const newGame: GameState = {
        status: 'waiting',
        player1Id: user.uid,
        player1Health: 20,
        player2Health: 20,
        turn: 1,
        isPlayer1Turn: true,
        createdAt: serverTimestamp(),
        player1DeckCount: initialDeck.length - 5,
        player1Hand: initialDeck.slice(0, 5),
        player1Board: [],
        player1Mana: 1,
      };
      await addDoc(collection(firestore, 'games'), newGame);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinGame = async (gameId: string) => {
    if (!user || !firestore) return;
    setIsJoining(true);
    try {
      const gameRef = doc(firestore, 'games', gameId);
      const initialDeck = elementalDeck;
      await updateDoc(gameRef, {
        player2Id: user.uid,
        status: 'active',
        player2DeckCount: initialDeck.length - 5,
        player2Hand: initialDeck.slice(0, 5),
        player2Board: [],
        player2Mana: 1,
      });
    } catch (error) {
      console.error('Error joining game:', error);
    } finally {
      setIsJoining(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ログインが必要です</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            オンライン対戦をプレイするには、匿名ログインが必要です。
          </p>
          <Button onClick={() => signInAnonymously(auth)}>匿名でログイン</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords />
          オンライン対戦ロビー
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          onClick={createGame}
          disabled={isCreating || isJoining}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <Loader2 className="animate-spin" />
          ) : (
            '新しいゲームを作成'
          )}
        </Button>
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users />
            参加可能なゲーム
          </h3>
          {gamesLoading && <Loader2 className="animate-spin" />}
          {openGames && openGames.length === 0 && !gamesLoading && (
            <p className="text-muted-foreground text-center py-4">
              現在参加可能なゲームはありません。
            </p>
          )}
          <div className="space-y-2">
            {openGames &&
              openGames.map(game => (
                <div
                  key={game.id}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <User />
                    <span className="text-sm font-medium">
                      {game.player1Id.substring(0, 6)}...
                    </span>
                  </div>
                  <Button
                    onClick={() => joinGame(game.id)}
                    disabled={isJoining || isCreating}
                    size="sm"
                  >
                    {isJoining ? <Loader2 className="animate-spin" /> : '参加'}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GameComponent({ gameId }: { gameId: string }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const gameRef = useMemoFirebase(() => firestore ? doc(firestore, 'games', gameId) : null, [firestore, gameId]);
  const { data: gameState, isLoading: loading } = useDoc<GameState>(gameRef);

  const takeTurn = async () => {
    if (!gameState || !user || !gameRef) return;
    const isPlayer1 = user.uid === gameState.player1Id;
    if (isPlayer1 !== gameState.isPlayer1Turn) return; // Not your turn

    const newHealth = isPlayer1
      ? gameState.player2Health - 1
      : gameState.player1Health - 1;
    const healthField = isPlayer1 ? 'player2Health' : 'player1Health';

    await updateDoc(gameRef, {
      turn: gameState.turn + 1,
      isPlayer1Turn: !gameState.isPlayer1Turn,
      [healthField]: newHealth,
      lastAction: `${isPlayer1 ? 'Player 1' : 'Player 2'} dealt 1 damage.`,
    });
  };

  if (loading) return <Loader2 className="animate-spin" />;
  if (!gameState) return <p>ゲームが見つかりません。</p>;
  if (!user) return <p>ログインしていません。</p>;

  const isPlayer1 = user.uid === gameState.player1Id;
  const isMyTurn = isPlayer1 === gameState.isPlayer1Turn;

  if (gameState.status === 'finished') {
    return (
      <div>
        <h2>ゲーム終了！</h2>
        <p>勝者: {gameState.winner}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ゲームID: {gameId.substring(0, 6)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>ステータス: {gameState.status}</p>
        <p>ターン: {gameState.turn}</p>
        <p>
          プレイヤー1 ({gameState.player1Id.substring(0, 4)}): HP{' '}
          {gameState.player1Health}
        </p>
        <p>
          プレイヤー2 ({gameState.player2Id?.substring(0, 4)}): HP{' '}
          {gameState.player2Health}
        </p>
        <p>
          現在のターン:{' '}
          {gameState.isPlayer1Turn ? 'プレイヤー1' : 'プレイヤー2'}
        </p>
        <p>最終アクション: {gameState.lastAction}</p>

        <Button onClick={takeTurn} disabled={!isMyTurn}>
          {isMyTurn ? 'ターン実行 (1ダメージ与える)' : '相手のターンです'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function OnlineBattlePage() {
  const { user, isUserLoading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !userLoading && auth) {
      // We no longer automatically sign in. User must click the button.
      // signInAnonymously(auth).catch(console.error);
    }
  }, [user, userLoading, auth]);

  const activeGamesQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, 'games'),
            where('status', 'in', ['active', 'waiting']),
            where('player1Id', '==', user.uid)
          )
        : null,
    [user, firestore]
  );
  
  const activeGamesQuery2 = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, 'games'),
            where('status', 'in', ['active', 'waiting']),
            where('player2Id', '==', user.uid)
          )
        : null,
    [user, firestore]
  );

  const { data: gamesAsPlayer1 } = useCollection(activeGamesQuery);
  const { data: gamesAsPlayer2 } = useCollection(activeGamesQuery2);

  useEffect(() => {
    const myGame = gamesAsPlayer1?.[0] || gamesAsPlayer2?.[0];
    if (myGame) {
      setActiveGameId(myGame.id);
    } else {
      setActiveGameId(null);
    }
  }, [gamesAsPlayer1, gamesAsPlayer2]);

  if (userLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div>
      {activeGameId ? (
        <GameComponent gameId={activeGameId} />
      ) : (
        <GameLobby />
      )}
    </div>
  );
}
