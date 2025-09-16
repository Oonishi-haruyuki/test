
'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, Heart, Shield, Dices, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDeck } from '@/ai/flows/generate-deck';

const HAND_LIMIT = 5;
const DECK_SIZE = 30;

const starterDeck: CardData[] = Array.from({ length: 6 }).flatMap(() => [
    { id: 'starter-1', theme: 'fantasy', name: '見習い騎士', manaCost: 1, attack: 1, defense: 2, cardType: 'creature', rarity: 'common', abilities: '', flavorText: '訓練は始まったばかりだ。', imageUrl: 'https://picsum.photos/seed/s1/400/300', imageHint: 'apprentice knight' },
    { id: 'starter-2', theme: 'fantasy', name: 'ゴブリンの斥候', manaCost: 1, attack: 2, defense: 1, cardType: 'creature', rarity: 'common', abilities: '', flavorText: '素早いが、脆い。', imageUrl: 'https://picsum.photos/seed/s2/400/300', imageHint: 'goblin scout' },
    { id: 'starter-3', theme: 'fantasy', name: '小回復のポーション', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'ライフを3回復する。', flavorText: '傷を癒す一滴。', imageUrl: 'https://picsum.photos/seed/s3/400/300', imageHint: 'healing potion' },
    { id: 'starter-4', theme: 'fantasy', name: 'ベテランの重装兵', manaCost: 2, attack: 2, defense: 3, cardType: 'creature', rarity: 'common', abilities: '', flavorText: '多くの戦場を生き抜いてきた。', imageUrl: 'https://picsum.photos/seed/s4/400/300', imageHint: 'veteran soldier' },
    { id: 'starter-5', theme: 'fantasy', name: 'ファイアボール', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: '相手に3ダメージ。', flavorText: '燃え上がれ！', imageUrl: 'https://picsum.photos/seed/s5/400/300', imageHint: 'fireball magic' },
]);

const shuffleDeck = (deck: CardData[]) => [...deck].sort(() => Math.random() - 0.5);

export default function BattlePage() {
    const [isClient, setIsClient] = useState(false);
    const { toast } = useToast();
    const [isGeneratingDeck, setIsGeneratingDeck] = useState(true);

    // Game State
    const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
    const [playerHand, setPlayerHand] = useState<CardData[]>([]);
    const [playerHealth, setPlayerHealth] = useState(20);
    const [playerMana, setPlayerMana] = useState(1);
    
    const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
    const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
    const [opponentHealth, setOpponentHealth] = useState(20);
    const [opponentMana, setOpponentMana] = useState(1);
    
    const [turn, setTurn] = useState(1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [gameLog, setGameLog] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState('');

    const loadPlayerDeck = () => {
        try {
            const savedDeck = JSON.parse(localStorage.getItem('deck') || '[]');
            if (savedDeck.length > 0) {
                setPlayerDeck(shuffleDeck(savedDeck));
                toast({ title: '保存したデッキを読み込みました。' });
            } else {
                setPlayerDeck(shuffleDeck(starterDeck));
                toast({ title: 'スターターデッキで開始します。', description: '「デッキ構築」で自分のデッキを作成できます。' });
            }
        } catch (error) {
            console.error("Failed to load player deck", error);
            setPlayerDeck(shuffleDeck(starterDeck));
            toast({ variant: 'destructive', title: 'デッキの読み込みに失敗しました。'});
        }
    };
    
    const createAiDeck = async () => {
        setIsGeneratingDeck(true);
        addToLog('AIが対戦の準備をしています...');
        try {
            const result = await generateDeck({ theme: 'SF', cardCount: DECK_SIZE });
            const aiGeneratedDeck: CardData[] = result.deck.map((card, index) => ({
                ...card,
                id: `ai-${index}`,
                theme: 'sci-fi',
                imageUrl: `https://picsum.photos/seed/ai${index}/${400}/${300}`,
            }));
            setOpponentDeck(shuffleDeck(aiGeneratedDeck));
            addToLog('AIのデッキが完成しました！');
        } catch (error) {
            console.error("Failed to generate AI deck", error);
            toast({ variant: 'destructive', title: 'AIデッキの生成に失敗しました。'});
            // Fallback to a default deck if generation fails
            setOpponentDeck(shuffleDeck(starterDeck));
        } finally {
            setIsGeneratingDeck(false);
        }
    };

    // Initialize Game
    useEffect(() => {
        setIsClient(true);
        loadPlayerDeck();
        createAiDeck();
    }, []);

    const startGame = () => {
        const newPlayerDeck = [...playerDeck];
        const newOpponentDeck = [...opponentDeck];

        const initialPlayerHand = newPlayerDeck.splice(0, HAND_LIMIT);
        const initialOpponentHand = newOpponentDeck.splice(0, HAND_LIMIT);

        setPlayerHand(initialPlayerHand);
        setPlayerDeck(newPlayerDeck);
        setOpponentHand(initialOpponentHand);
        setOpponentDeck(newOpponentDeck);
        setGameLog(['ゲーム開始！']);
        setGameOver('');
        setPlayerHealth(20);
        setOpponentHealth(20);
        setTurn(1);
        setIsPlayerTurn(true);
        setPlayerMana(1);
        setOpponentMana(1);
    };
    
    useEffect(() => {
        if (isClient && !isGeneratingDeck && playerDeck.length > 0 && opponentDeck.length > 0 && gameLog.length <= 2) {
            startGame();
        }
    }, [isClient, isGeneratingDeck, playerDeck, opponentDeck]);

    const addToLog = (message: string) => {
        setGameLog(prev => [message, ...prev]);
    }

    const playCard = (card: CardData, cardIndex: number) => {
        if (!isPlayerTurn || gameOver) return;
        if (playerMana < card.manaCost) {
            toast({ variant: 'destructive', title: 'マナが足りません！'});
            return;
        }

        setPlayerMana(prev => prev - card.manaCost);
        const newHand = [...playerHand];
        newHand.splice(cardIndex, 1);
        setPlayerHand(newHand);

        addToLog(`プレイヤーが「${card.name}」をプレイ！`);

        if (card.cardType === 'creature') {
            const damage = card.attack;
            setOpponentHealth(prev => Math.max(0, prev - damage));
            addToLog(`相手に${damage}ダメージ！`);
             if (opponentHealth - damage <= 0) {
                setGameOver('プレイヤーの勝利！');
                addToLog('ゲーム終了！プレイヤーが勝利しました。');
            }
        } else if (card.cardType === 'spell') {
            // Simplified spell effects
            if (card.abilities.includes('ダメージ')) {
                const damage = parseInt(card.abilities.match(/(\d+)ダメージ/)?.[1] || '3', 10);
                setOpponentHealth(prev => Math.max(0, prev - damage));
                addToLog(`相手に${damage}ダメージ！`);
                if (opponentHealth - damage <= 0) {
                    setGameOver('プレイヤーの勝利！');
                    addToLog('ゲーム終了！プレイヤーが勝利しました。');
                }
            } else if (card.abilities.includes('回復')) {
                const heal = parseInt(card.abilities.match(/(\d+)回復/)?.[1] || '3', 10);
                setPlayerHealth(prev => prev + heal);
                addToLog(`プレイヤーはライフを${heal}回復。`);
            }
        }
    };

    const endTurn = () => {
        if (!isPlayerTurn || gameOver) return;
        addToLog('プレイヤーがターンを終了。');
        setIsPlayerTurn(false);
        // AI's turn logic
        setTimeout(aiTurn, 1000);
    };

    const aiTurn = () => {
        addToLog('相手のターン。');
        let currentOpponentMana = opponentMana;
        
        const playableCards = opponentHand.filter(c => c.manaCost <= currentOpponentMana).sort((a,b) => b.manaCost - a.manaCost);

        if (playableCards.length > 0 && opponentHand.length > 0) {
            // AI plays the most expensive card it can afford
            const cardToPlay = playableCards[0];
            const cardIndex = opponentHand.findIndex(c => c.id === cardToPlay.id);

            currentOpponentMana -= cardToPlay.manaCost;
            
            const newOpponentHand = [...opponentHand];
            newOpponentHand.splice(cardIndex, 1);
            setOpponentHand(newOpponentHand);
            
            addToLog(`相手が「${cardToPlay.name}」をプレイ！`);

            if (cardToPlay.cardType === 'creature') {
                const damage = cardToPlay.attack;
                setPlayerHealth(prev => Math.max(0, prev - damage));
                addToLog(`プレイヤーに${damage}ダメージ！`);
                 if (playerHealth - damage <= 0) {
                    setGameOver('相手の勝利！');
                    addToLog('ゲーム終了！相手が勝利しました。');
                    setIsPlayerTurn(true); // Allow restart
                    return;
                }
            } else if (cardToPlay.cardType === 'spell') {
                 if (cardToPlay.abilities.includes('ダメージ')) {
                    const damage = parseInt(cardToPlay.abilities.match(/(\d+)ダメージ/)?.[1] || '3', 10);
                    setPlayerHealth(prev => Math.max(0, prev - damage));
                    addToLog(`プレイヤーに${damage}ダメージ！`);
                    if (playerHealth - damage <= 0) {
                        setGameOver('相手の勝利！');
                        addToLog('ゲーム終了！相手が勝利しました。');
                        setIsPlayerTurn(true); // Allow restart
                        return;
                    }
                } else if (cardToPlay.abilities.includes('回復')) {
                    const heal = parseInt(cardToPlay.abilities.match(/(\d+)回復/)?.[1] || '3', 10);
                    setOpponentHealth(prev => prev + heal);
                    addToLog(`相手はライフを${heal}回復。`);
                }
            }
        } else {
            addToLog('相手は何もせずターンを終了。');
        }

        // End of AI turn, switch back to player
        addToLog('相手がターンを終了。');
        const nextTurn = turn + 1;
        setTurn(nextTurn);
        setPlayerMana(nextTurn);
        setOpponentMana(nextTurn);
        
        // Player draws a card if hand is not full
        if (playerHand.length < HAND_LIMIT) {
            const newPlayerDeck = [...playerDeck];
            const drawnCard = newPlayerDeck.shift();
            if (drawnCard) {
                setPlayerHand(prev => [...prev, drawnCard]);
                setPlayerDeck(newPlayerDeck);
                addToLog('プレイヤーはカードを1枚引いた。');
            } else {
                addToLog('プレイヤーの山札はもうない！');
            }
        } else {
            addToLog('プレイヤーの手札がいっぱいでカードを引けない。')
        }

        // Opponent draws a card if hand is not full
        if (opponentHand.length < HAND_LIMIT) {
            const newOpponentDeck = [...opponentDeck];
            const drawnOpponentCard = newOpponentDeck.shift();
            if(drawnOpponentCard) {
                setOpponentHand(prev => [...prev, drawnOpponentCard]);
                setOpponentDeck(newOpponentDeck);
                addToLog('相手はカードを1枚引いた。')
            } else {
                addToLog('相手の山札はもうない！')
            }
        }
        
        setIsPlayerTurn(true);
    };
    
    if (!isClient) {
        return <main className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" />ロード中...</main>;
    }

    if (isGeneratingDeck || gameLog.length === 0) {
        return (
            <main className="text-center p-10">
                <div className="flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-lg text-muted-foreground">AIが対戦の準備をしています...</p>
                    <p className="text-sm text-muted-foreground">初回は少し時間がかかる場合があります。</p>
                </div>
            </main>
        );
    }

    return (
    <main className="flex flex-col gap-4">
        {/* Opponent's Area */}
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
                <Card className="p-2 text-center w-40">
                    <p className="font-bold">相手</p>
                    <p className="flex items-center justify-center gap-2 text-red-500 font-bold text-xl"><Heart /> {opponentHealth}</p>
                    <p className="flex items-center justify-center gap-2 text-blue-500 font-bold"><Dices /> {opponentMana}</p>
                </Card>
                <div className="flex gap-2 min-h-[180px]">
                    {opponentHand.map((card, i) => (
                        <div key={i} className="w-24">
                           <Card className="h-full flex items-center justify-center text-center p-2 bg-slate-700 text-white">裏向きのカード</Card>
                        </div>
                    ))}
                </div>
                <Card className="p-2 text-center w-28">
                     <p className="font-bold">山札</p>
                     <p className="text-2xl">{opponentDeck.length}</p>
                </Card>
            </div>
        </div>

        {/* Game Log / Result */}
        <div className="flex justify-center">
            {gameOver ? (
                <Card className="p-6 my-4 max-w-2xl text-center bg-yellow-200">
                    <p className="text-2xl font-semibold mb-4">{gameOver}</p>
                    <Button onClick={async () => {
                        setGameLog([]); 
                        loadPlayerDeck();
                        await createAiDeck();
                    }}>
                        <RotateCcw className="mr-2" />
                        もう一度対戦
                    </Button>
                </Card>
            ) : (
                <Card className="p-2 my-2 w-full max-w-lg h-24 overflow-y-auto text-sm">
                   {gameLog.map((log, i) => <p key={i}>{log}</p>)}
                </Card>
            )}
        </div>


        {/* Player's Area */}
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
                <Card className="p-2 text-center w-40">
                    <p className="font-bold">あなた</p>
                    <p className="flex items-center justify-center gap-2 text-red-500 font-bold text-xl"><Heart /> {playerHealth}</p>
                    <p className="flex items-center justify-center gap-2 text-blue-500 font-bold"><Dices /> {playerMana}</p>
                    <p className="mt-2 text-sm">ターン: {turn}</p>
                </Card>
                <div className="flex gap-2 min-h-[180px]">
                    {playerHand.map((card, i) => (
                        <div key={i} className="w-[130px] cursor-pointer hover:scale-105 transition-transform" onClick={() => playCard(card, i)}>
                           <CardPreview {...card} />
                        </div>
                    ))}
                </div>
                 <Card className="p-2 text-center w-28">
                     <p className="font-bold">山札</p>
                     <p className="text-2xl">{playerDeck.length}</p>
                </Card>
            </div>
            <Button onClick={endTurn} size="lg" disabled={!isPlayerTurn || !!gameOver} className="mt-4">
                ターン終了
            </Button>
        </div>
    </main>
  );
}
