
'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Swords, Heart, Shield, Dices, RotateCcw, Loader2, BrainCircuit, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDeck } from '@/ai/flows/generate-deck';
import { cn } from '@/lib/utils';

const HAND_LIMIT = 5;
const DECK_SIZE = 20;
const MAX_MANA = 10;
const BOARD_LIMIT = 5;

type Difficulty = 'beginner' | 'advanced';

const starterDeck: CardData[] = Array.from({ length: 4 }).flatMap(() => [
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
    const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

    // Game State
    const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
    const [playerHand, setPlayerHand] = useState<CardData[]>([]);
    const [playerBoard, setPlayerBoard] = useState<CardData[]>([]);
    const [playerHealth, setPlayerHealth] = useState(20);
    const [playerMana, setPlayerMana] = useState(1);
    const [playerMaxMana, setPlayerMaxMana] = useState(1);
    const [playerHasPlayedNonCreature, setPlayerHasPlayedNonCreature] = useState(false);
    
    const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
    const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
    const [opponentBoard, setOpponentBoard] = useState<CardData[]>([]);
    const [opponentHealth, setOpponentHealth] = useState(20);
    const [opponentMana, setOpponentMana] = useState(1);
    const [opponentMaxMana, setOpponentMaxMana] = useState(1);
    const [opponentHasPlayedNonCreature, setOpponentHasPlayedNonCreature] = useState(false);
    
    const [turn, setTurn] = useState(1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [gameLog, setGameLog] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState('');
    const [gamePhase, setGamePhase] = useState<'main' | 'attack'>('main');

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
            setOpponentDeck(shuffleDeck(starterDeck));
        } finally {
            setIsGeneratingDeck(false);
        }
    };

    useEffect(() => {
        setIsClient(true);
        loadPlayerDeck();
    }, []);

    const startGame = (selectedDifficulty: Difficulty) => {
        setDifficulty(selectedDifficulty);
        setIsGeneratingDeck(true);
        createAiDeck().then(() => {
            const newPlayerDeck = [...playerDeck];
            const newOpponentDeck = [...opponentDeck];

            const initialPlayerHand = newPlayerDeck.splice(0, HAND_LIMIT);
            const initialOpponentHand = newOpponentDeck.splice(0, HAND_LIMIT);

            setPlayerHand(initialPlayerHand);
            setPlayerDeck(newPlayerDeck);
            setPlayerBoard([]);

            setOpponentHand(initialOpponentHand);
            setOpponentDeck(newOpponentDeck);
            setOpponentBoard([]);

            setGameLog(['ゲーム開始！']);
            setGameOver('');
            setPlayerHealth(20);
            setOpponentHealth(20);
            setTurn(1);
            setIsPlayerTurn(true);
            setPlayerMaxMana(1);
            setPlayerMana(1);
            setPlayerHasPlayedNonCreature(false);
            setOpponentMaxMana(1);
            setOpponentMana(1);
            setOpponentHasPlayedNonCreature(false);
            setGamePhase('main');
            addToLog(`--- ターン ${turn}: あなたのターン ---`);
        });
    };
    
    useEffect(() => {
        if (!difficulty) return;
        if (isClient && !isGeneratingDeck && playerDeck.length > 0 && opponentDeck.length > 0 && gameLog.length <= 2) {
             const newPlayerDeck = [...playerDeck];
            const newOpponentDeck = [...opponentDeck];

            const initialPlayerHand = newPlayerDeck.splice(0, HAND_LIMIT);
            const initialOpponentHand = newOpponentDeck.splice(0, HAND_LIMIT);

            setPlayerHand(initialPlayerHand);
            setPlayerDeck(newPlayerDeck);
            setOpponentHand(initialOpponentHand);
            setOpponentDeck(newOpponentDeck);
        }
    }, [isClient, isGeneratingDeck, playerDeck, opponentDeck, difficulty]);

    const addToLog = (message: string) => {
        setGameLog(prev => [`[T${turn}] ${message}`, ...prev]);
    }

    const drawCard = (isPlayer: boolean) => {
        if (isPlayer) {
            let deck = [...playerDeck];
            const drawnCard = deck.shift();
            setPlayerDeck(deck);
            if (drawnCard) {
                if (playerHand.length < HAND_LIMIT) {
                    setPlayerHand(prev => [...prev, drawnCard]);
                    addToLog('あなたはカードを1枚引いた。');
                } else {
                    addToLog('あなたの手札がいっぱいで、引いたカードを破棄した。');
                }
            } else {
                addToLog('あなたの山札はもうない！');
            }
        } else {
            let deck = [...opponentDeck];
            const drawnCard = deck.shift();
            setOpponentDeck(deck);
            if (drawnCard) {
                if (opponentHand.length < HAND_LIMIT) {
                    setOpponentHand(prev => [...prev, drawnCard]);
                    addToLog('相手はカードを1枚引いた。');
                } else {
                    addToLog('相手の手札がいっぱいで、引いたカードを破棄した。');
                }
            } else {
                addToLog('相手の山札はもうない！');
            }
        }
    }

    const applySpellEffect = (card: CardData, isPlayer: boolean) => {
        const Caster = isPlayer ? 'あなた' : '相手';
        const Target = isPlayer ? '相手' : 'あなた';
        let effectApplied = false;

        if (card.abilities) {
            const abilities = card.abilities.toLowerCase();
            if (abilities.includes('ダメージ')) {
                const damage = parseInt(abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10);
                if (damage > 0) {
                    if (isPlayer) setOpponentHealth(prev => Math.max(0, prev - damage));
                    else setPlayerHealth(prev => Math.max(0, prev - damage));
                    addToLog(`「${card.name}」の効果で${Target}に${damage}ダメージ！`);
                    effectApplied = true;
                }
            }
            if (abilities.includes('回復')) {
                const heal = parseInt(abilities.match(/(\d+)回復/)?.[1] || '0', 10);
                if (heal > 0) {
                    if (isPlayer) setPlayerHealth(prev => prev + heal);
                    else setOpponentHealth(prev => prev + heal);
                    addToLog(`「${card.name}」の効果で${Caster}はライフを${heal}回復。`);
                    effectApplied = true;
                }
            }
            if (abilities.includes('カードを引く')) {
                const drawCount = parseInt(abilities.match(/(\d+)枚/)?.[1] || '1', 10);
                addToLog(`「${card.name}」の効果で${Caster}はカードを${drawCount}枚引く。`);
                for(let i=0; i<drawCount; i++) {
                    drawCard(isPlayer);
                }
                effectApplied = true;
            }
            if (abilities.includes('マナ')) {
                if (isPlayer) setPlayerMaxMana(prev => Math.min(MAX_MANA, prev + 1));
                else setOpponentMaxMana(prev => Math.min(MAX_MANA, prev + 1));
                addToLog(`「${card.name}」の効果で${Caster}の最大マナが増えた！`);
                effectApplied = true;
            }
        }
        if (!effectApplied) {
            addToLog(`「${card.name}」は何の効果ももたらさなかった。`);
        }
    };

    useEffect(() => {
        if (gameOver) return;
        if (playerHealth <= 0) {
            setGameOver('相手の勝利！');
            addToLog('ゲーム終了！相手が勝利しました。');
        } else if (opponentHealth <= 0) {
            setGameOver('あなたの勝利！');
            addToLog('ゲーム終了！あなたが勝利しました。');
        }
    }, [playerHealth, opponentHealth, gameOver]);

    const playCard = (card: CardData, cardIndex: number) => {
        if (!isPlayerTurn || gameOver || gamePhase !== 'main') return;
        if (playerMana < card.manaCost) {
            toast({ variant: 'destructive', title: 'マナが足りません！'});
            return;
        }

        if (card.cardType !== 'creature') {
            if (playerHasPlayedNonCreature) {
                toast({ variant: 'destructive', title: 'このターンはこれ以上、呪文やアーティファクト、土地は使えません。'});
                return;
            }
            setPlayerHasPlayedNonCreature(true);
        }

        const newHand = [...playerHand];
        newHand.splice(cardIndex, 1);
        
        setPlayerMana(prev => prev - card.manaCost);
        setPlayerHand(newHand);
        addToLog(`あなたが「${card.name}」をプレイ！`);

        if (card.cardType === 'creature') {
            if (playerBoard.length >= BOARD_LIMIT) {
                toast({ variant: 'destructive', title: '場が上限に達しています。'});
                setPlayerHand(prev => [...prev, card]); // Return card to hand
                setPlayerMana(prev => prev + card.manaCost); // Return mana
                if (card.cardType !== 'creature') setPlayerHasPlayedNonCreature(false); // Revert rule flag
                return;
            }
            setPlayerBoard(prev => [...prev, {...card, canAttack: false}]); // Summoning sickness
        } else {
            applySpellEffect(card, true);
        }
    };

    const handleAttackPhase = () => {
        if (!isPlayerTurn || gameOver || gamePhase !== 'main') return;
        setGamePhase('attack');
        addToLog('攻撃フェーズへ！');
        
        let totalDamage = 0;
        playerBoard.forEach(c => {
            if (c.canAttack) {
                totalDamage += c.attack;
                addToLog(`あなたの「${c.name}」(${c.attack}/${c.defense})が相手に攻撃！`);
            }
        });

        if (totalDamage > 0) {
            setOpponentHealth(prev => Math.max(0, prev - totalDamage));
            addToLog(`相手は合計${totalDamage}のダメージを受けた！`);
        } else {
            addToLog('攻撃できるクリーチャーがいませんでした。');
        }

        setTimeout(endTurn, 1000);
    }

    const endTurn = () => {
        if (!isPlayerTurn || gameOver) return;
        addToLog('あなたがターンを終了。');
        setIsPlayerTurn(false);
        setGamePhase('main');
        setTimeout(aiTurn, 1000);
    };
    
    const aiChooseCard = (hand: CardData[], mana: number, myBoard: CardData[], nonCreaturePlayed: boolean): CardData | null => {
        let playableCards = hand.filter(c => c.manaCost <= mana);
        if (nonCreaturePlayed) {
            playableCards = playableCards.filter(c => c.cardType === 'creature');
        }
        if (playableCards.length === 0) return null;

        if (difficulty === 'beginner') {
            // Beginner AI: play the highest cost card they can.
            return playableCards.reduce((a, b) => a.manaCost > b.manaCost ? a : b);
        }

        // Advanced AI
        const creatureCards = playableCards.filter(c => c.cardType === 'creature');
        if (creatureCards.length > 0 && myBoard.length < BOARD_LIMIT) {
             // Play creature with best score (atk+def / cost)
             return creatureCards.reduce((best, current) => {
                const bestScore = (best.attack + best.defense) / (best.manaCost + 1);
                const currentScore = (current.attack + current.defense) / (current.manaCost + 1);
                return currentScore > bestScore ? current : best;
            });
        }
        
        const spellCards = playableCards.filter(c => c.cardType !== 'creature');
        if (spellCards.length > 0) {
            // Prioritize spells that give advantage
            const damageSpells = spellCards.filter(s => s.abilities.includes('ダメージ'));
            if (damageSpells.length > 0 && opponentHealth > playerHealth) {
                return damageSpells.reduce((a, b) => a.manaCost > b.manaCost ? a : b);
            }
            const drawSpells = spellCards.filter(s => s.abilities.includes('カードを引く'));
            if (drawSpells.length > 0 && hand.length <= 2) {
                return drawSpells[0];
            }
            // Simple logic: just play the highest cost spell
            return spellCards.reduce((a, b) => a.manaCost > b.manaCost ? a : b);
        }

        return playableCards.length > 0 ? playableCards.reduce((a, b) => a.manaCost > b.manaCost ? a : b) : null;
    }

    const aiTurn = () => {
        if (gameOver) return;

        const nextTurn = turn + 1;
        setTurn(nextTurn);
        addToLog(`--- ターン ${nextTurn}: 相手のターン ---`);

        // Start of AI's turn
        const newOpponentMaxMana = Math.min(MAX_MANA, opponentMaxMana + 1);
        setOpponentMaxMana(newOpponentMaxMana);
        setOpponentMana(newOpponentMaxMana);
        setOpponentHasPlayedNonCreature(false);
        setOpponentBoard(prev => prev.map(c => ({ ...c, canAttack: true }))); // Creatures can now attack
        
        drawCard(false);

        // AI plays cards
        let currentOpponentMana = newOpponentMaxMana;
        let currentOpponentHand = [...opponentHand];
        let currentOpponentBoard = [...opponentBoard];
        let currentOpponentNonCreaturePlayed = false;

        const playCardLoop = () => {
            const cardToPlay = aiChooseCard(opponentHand, currentOpponentMana, opponentBoard, currentOpponentNonCreaturePlayed);

            if (cardToPlay) {
                const cardIndex = opponentHand.findIndex(c => c.id === cardToPlay.id);
                
                currentOpponentMana -= cardToPlay.manaCost;
                setOpponentMana(prev => prev - cardToPlay.manaCost);
                
                const newOpponentHand = [...opponentHand];
                newOpponentHand.splice(cardIndex, 1);
                setOpponentHand(newOpponentHand);
                
                addToLog(`相手が「${cardToPlay.name}」をプレイ！`);

                if (cardToPlay.cardType === 'creature') {
                    setOpponentBoard(prev => [...prev, {...cardToPlay, canAttack: false}]);
                } else {
                    setOpponentHasPlayedNonCreature(true);
                    currentOpponentNonCreaturePlayed = true;
                    applySpellEffect(cardToPlay, false);
                }
                setTimeout(playCardLoop, 1000);
            } else {
                 // No card to play, move to attack phase
                 setTimeout(aiAttackPhase, 1000);
            }
        };
        
        const aiAttackPhase = () => {
            if (gameOver) { setIsPlayerTurn(true); return; }

            addToLog('相手の攻撃フェーズ！');
            let totalDamage = 0;
            opponentBoard.forEach(c => {
                if (c.canAttack) {
                    totalDamage += c.attack;
                    addToLog(`相手の「${c.name}」(${c.attack}/${c.defense})があなたに攻撃！`);
                }
            });
    
            if (totalDamage > 0) {
                setPlayerHealth(prev => Math.max(0, prev - totalDamage));
                addToLog(`あなたは合計${totalDamage}のダメージを受けた！`);
            } else {
                addToLog('相手は攻撃してこなかった。');
            }

            setTimeout(endAiTurn, 1000);
        }

        const endAiTurn = () => {
             if (gameOver) {
                setIsPlayerTurn(true);
                return;
            }
            addToLog('相手がターンを終了。');
            
            // Start of Player's turn
            const newPlayerMaxMana = Math.min(MAX_MANA, playerMaxMana + 1);
            setPlayerMaxMana(newPlayerMaxMana);
            setPlayerMana(newPlayerMaxMana);
            setPlayerBoard(prev => prev.map(c => ({ ...c, canAttack: true }))); // Creatures can now attack
            setPlayerHasPlayedNonCreature(false);
            setIsPlayerTurn(true);
            setGamePhase('main');
            
            addToLog(`--- ターン ${nextTurn + 1}: あなたのターン ---`);
            drawCard(true);
        }
        
        setTimeout(playCardLoop, 1000);
    };
    
    if (!isClient) {
        return <main className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" />ロード中...</main>;
    }

    if (!difficulty) {
        return (
            <main className="text-center p-10">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">難易度を選択してください</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button onClick={() => startGame('beginner')} size="lg">
                            <Bot className="mr-2" /> 初級
                        </Button>
                        <Button onClick={() => startGame('advanced')} size="lg">
                           <BrainCircuit className="mr-2" /> 上級
                        </Button>
                    </CardContent>
                </Card>
            </main>
        )
    }

    if (isGeneratingDeck) {
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
    <main className="flex flex-col gap-2">
        {/* Opponent's Area */}
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
                <Card className="p-2 text-center w-40">
                    <p className="font-bold">相手 ({difficulty === 'beginner' ? '初級' : '上級'})</p>
                    <p className="flex items-center justify-center gap-2 text-red-500 font-bold text-xl"><Heart /> {opponentHealth}</p>
                    <p className="flex items-center justify-center gap-2 text-blue-500 font-bold"><Dices /> {opponentMana}/{opponentMaxMana}</p>
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
            {/* Opponent's Board */}
            <div className="flex items-center justify-center gap-2 bg-black/10 p-2 rounded-lg min-h-[160px] w-full max-w-4xl">
                {opponentBoard.map((card, i) => (
                    <div key={i} className="w-[110px]">
                        <CardPreview {...card} />
                    </div>
                ))}
            </div>
        </div>

        {/* Game Log / Result */}
        <div className="flex justify-center my-2">
            {gameOver ? (
                <Card className="p-6 my-4 max-w-2xl text-center bg-yellow-200">
                    <p className="text-2xl font-semibold mb-4">{gameOver}</p>
                    <Button onClick={() => setDifficulty(null)}>
                        <RotateCcw className="mr-2" />
                        難易度選択に戻る
                    </Button>
                </Card>
            ) : (
                <Card className="p-2 w-full max-w-lg h-24 overflow-y-auto text-sm">
                   {gameLog.map((log, i) => <p key={i}>{log}</p>)}
                </Card>
            )}
        </div>
        
        {/* Player's Board */}
         <div className="flex items-center justify-center gap-2 bg-black/10 p-2 rounded-lg min-h-[160px] w-full max-w-4xl mx-auto">
            {playerBoard.map((card, i) => (
                <div key={i} className={cn("w-[110px]", card.canAttack && "border-4 border-green-500 rounded-2xl")}>
                    <CardPreview {...card} />
                </div>
            ))}
        </div>

        {/* Player's Area */}
        <div className="flex flex-col items-center gap-2 mt-2">
            <div className="flex items-center gap-4">
                <Card className="p-2 text-center w-40">
                    <p className="font-bold">あなた</p>
                    <p className="flex items-center justify-center gap-2 text-red-500 font-bold text-xl"><Heart /> {playerHealth}</p>
                    <p className="flex items-center justify-center gap-2 text-blue-500 font-bold"><Dices /> {playerMana}/{playerMaxMana}</p>
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
            <Button onClick={handleAttackPhase} size="lg" disabled={!isPlayerTurn || !!gameOver || gamePhase !== 'main'} className="mt-4">
                攻撃フェーズへ
            </Button>
        </div>
    </main>
  );
}

    