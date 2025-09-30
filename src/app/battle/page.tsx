
'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Swords, Heart, Shield, Dices, RotateCcw, Loader2, BrainCircuit, Bot, Wand2, Group, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDeck } from '@/ai/flows/generate-deck';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from '@/components/auth-provider';


const HAND_LIMIT = 5;
const DECK_SIZE = 20;
const MAX_MANA = 10;
const BOARD_LIMIT = 5;
const MAX_IDENTICAL_CARDS = 2;

type Difficulty = 'beginner' | 'advanced';
type DeckChoice = 'my-deck' | 'starter-goblin' | 'starter-elemental' | 'ai-fantasy' | 'ai-scifi' | 'in-game';

const goblinDeck: CardData[] = [
    { id: 'starter-gob-1', theme: 'fantasy', name: 'ゴブリンの突撃兵', manaCost: 1, attack: 2, defense: 1, cardType: 'creature', rarity: 'common', abilities: '', flavorText: '考えるより先に足が動く。', imageUrl: 'https://picsum.photos/seed/sg1/400/300', imageHint: 'goblin warrior' },
    { id: 'starter-gob-1-2', theme: 'fantasy', name: 'ゴブリンの突撃兵', manaCost: 1, attack: 2, defense: 1, cardType: 'creature', rarity: 'common', abilities: '', flavorText: '考えるより先に足が動く。', imageUrl: 'https://picsum.photos/seed/sg1/400/300', imageHint: 'goblin warrior' },
    { id: 'starter-gob-2', theme: 'fantasy', name: 'ゴブリンの斥候', manaCost: 2, attack: 2, defense: 2, cardType: 'creature', rarity: 'common', abilities: 'カードを1枚引く。', flavorText: '危険な道も、奴らにかかれば近道だ。', imageUrl: 'https://picsum.photos/seed/sg2/400/300', imageHint: 'goblin scout' },
    { id: 'starter-gob-2-2', theme: 'fantasy', name: 'ゴブリンの斥候', manaCost: 2, attack: 2, defense: 2, cardType: 'creature', rarity: 'common', abilities: 'カードを1枚引く。', flavorText: '危険な道も、奴らにかかれば近道だ。', imageUrl: 'https://picsum.photos/seed/sg2/400/300', imageHint: 'goblin scout' },
    { id: 'starter-gob-3', theme: 'fantasy', name: 'ゴブリンの略奪隊長', manaCost: 3, attack: 3, defense: 3, cardType: 'creature', rarity: 'uncommon', abilities: '他のゴブリンは+1/+0の修正を受ける。', flavorText: '隊長の雄叫びは、略奪の合図。', imageUrl: 'https://picsum.photos/seed/sg3/400/300', imageHint: 'goblin captain' },
    { id: 'starter-gob-3-2', theme: 'fantasy', name: 'ゴブリンの略奪隊長', manaCost: 3, attack: 3, defense: 3, cardType: 'creature', rarity: 'uncommon', abilities: '他のゴブリンは+1/+0の修正を受ける。', flavorText: '隊長の雄叫びは、略奪の合図。', imageUrl: 'https://picsum.photos/seed/sg3/400/300', imageHint: 'goblin captain' },
    { id: 'starter-gob-4', theme: 'fantasy', name: 'ゴブリンの狂戦士', manaCost: 4, attack: 5, defense: 2, cardType: 'creature', rarity: 'uncommon', abilities: '', flavorText: '一度暴れだしたら、誰にも止められない。', imageUrl: 'https://picsum.photos/seed/sg4/400/300', imageHint: 'goblin berserker' },
    { id: 'starter-gob-4-2', theme: 'fantasy', name: 'ゴブリンの狂戦士', manaCost: 4, attack: 5, defense: 2, cardType: 'creature', rarity: 'uncommon', abilities: '', flavorText: '一度暴れだしたら、誰にも止められない。', imageUrl: 'https://picsum.photos/seed/sg4/400/300', imageHint: 'goblin berserker' },
    { id: 'starter-ogre-1', theme: 'fantasy', name: '怒れるオーガ', manaCost: 5, attack: 5, defense: 5, cardType: 'creature', rarity: 'rare', abilities: '', flavorText: 'ゴブリンたちに無理やり駆り出された。機嫌が悪い。', imageUrl: 'https://picsum.photos/seed/sg5/400/300', imageHint: 'angry ogre' },
    { id: 'starter-ogre-1-2', theme: 'fantasy', name: '怒れるオーガ', manaCost: 5, attack: 5, defense: 5, cardType: 'creature', rarity: 'rare', abilities: '', flavorText: 'ゴブリンたちに無理やり駆り出された。機嫌が悪い。', imageUrl: 'https://picsum.photos/seed/sg5/400/300', imageHint: 'angry ogre' },
    { id: 'starter-shaman-1', theme: 'fantasy', name: 'ゴブリンの呪術師', manaCost: 2, attack: 1, defense: 1, cardType: 'creature', rarity: 'uncommon', abilities: '次の自分のターンの最大マナを+1する。', flavorText: '怪しげな儀式で、大地の力を呼び覚ます。', imageUrl: 'https://picsum.photos/seed/sg6/400/300', imageHint: 'goblin shaman' },
    { id: 'starter-shaman-1-2', theme: 'fantasy', name: 'ゴブリンの呪術師', manaCost: 2, attack: 1, defense: 1, cardType: 'creature', rarity: 'uncommon', abilities: '次の自分のターンの最大マナを+1する。', flavorText: '怪しげな儀式で、大地の力を呼び覚ます。', imageUrl: 'https://picsum.photos/seed/sg6/400/300', imageHint: 'goblin shaman' },
    { id: 'starter-spell-1', theme: 'fantasy', name: 'ゴブリンの応援', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に+2/+1の修正を与える。', flavorText: '「イケー！ヤッちまえー！」', imageUrl: 'https://picsum.photos/seed/ss1/400/300', imageHint: 'goblin cheer' },
    { id: 'starter-spell-1-2', theme: 'fantasy', name: 'ゴブリンの応援', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に+2/+1の修正を与える。', flavorText: '「イケー！ヤッちまえー！」', imageUrl: 'https://picsum.photos/seed/ss1/400/300', imageHint: 'goblin cheer' },
    { id: 'starter-spell-2', theme: 'fantasy', name: '捨て身の突撃', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に+3/+0の修正を与え、ターン終了時にそれを破壊する。', flavorText: '栄光か、死か！', imageUrl: 'https://picsum.photos/seed/ss2/400/300', imageHint: 'desperate charge' },
    { id: 'starter-spell-2-2', theme: 'fantasy', name: '捨て身の突撃', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に+3/+0の修正を与え、ターン終了時にそれを破壊する。', flavorText: '栄光か、死か！', imageUrl: 'https://picsum.photos/seed/ss2/400/300', imageHint: 'desperate charge' },
    { id: 'starter-spell-3', theme: 'fantasy', name: 'ファイアボール', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: '相手に3ダメージ。', flavorText: '燃え上がれ！', imageUrl: 'https://picsum.photos/seed/s5/400/300', imageHint: 'fireball magic' },
    { id: 'starter-spell-3-2', theme: 'fantasy', name: 'ファイアボール', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: '相手に3ダメージ。', flavorText: '燃え上がれ！', imageUrl: 'https://picsum.photos/seed/s5/400/300', imageHint: 'fireball magic' },
    { id: 'starter-spell-4', theme: 'fantasy', name: 'ゴブリンの知恵', manaCost: 3, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'カードを2枚引く。', flavorText: 'たまには頭も使う。', imageUrl: 'https://picsum.photos/seed/ss4/400/300', imageHint: 'goblin wisdom' },
    { id: 'starter-spell-5', theme: 'fantasy', name: '大地の怒り', manaCost: 4, attack: 0, defense: 0, cardType: 'spell', rarity: 'rare', abilities: '相手に5ダメージ。', flavorText: '大地が、怒りに震える。', imageUrl: 'https://picsum.photos/seed/ss5/400/300', imageHint: 'earth fury' },
];

const elementalDeck: CardData[] = [
    { id: 'starter-elem-1', theme: 'fantasy', name: '炎の精霊', manaCost: 1, attack: 1, defense: 1, cardType: 'creature', rarity: 'common', abilities: '速攻', flavorText: '燃え盛る意志の現れ。', imageUrl: 'https://picsum.photos/seed/se1/400/300', imageHint: 'fire elemental' },
    { id: 'starter-elem-1-2', theme: 'fantasy', name: '炎の精霊', manaCost: 1, attack: 1, defense: 1, cardType: 'creature', rarity: 'common', abilities: '速攻', flavorText: '燃え盛る意志の現れ。', imageUrl: 'https://picsum.photos/seed/se1/400/300', imageHint: 'fire elemental' },
    { id: 'starter-elem-2', theme: 'fantasy', name: '水の精霊', manaCost: 2, attack: 1, defense: 3, cardType: 'creature', rarity: 'common', abilities: 'カードを1枚引く。', flavorText: '流れる知識の運び手。', imageUrl: 'https://picsum.photos/seed/se2/400/300', imageHint: 'water elemental' },
    { id: 'starter-elem-2-2', theme: 'fantasy', name: '水の精霊', manaCost: 2, attack: 1, defense: 3, cardType: 'creature', rarity: 'common', abilities: 'カードを1枚引く。', flavorText: '流れる知識の運び手。', imageUrl: 'https://picsum.photos/seed/se2/400/300', imageHint: 'water elemental' },
    { id: 'starter-elem-3', theme: 'fantasy', name: '風の精霊', manaCost: 3, attack: 2, defense: 2, cardType: 'creature', rarity: 'common', abilities: '飛行', flavorText: '自由な翼で空を舞う。', imageUrl: 'https://picsum.photos/seed/se3/400/300', imageHint: 'wind elemental' },
    { id: 'starter-elem-3-2', theme: 'fantasy', name: '風の精霊', manaCost: 3, attack: 2, defense: 2, cardType: 'creature', rarity: 'common', abilities: '飛行', flavorText: '自由な翼で空を舞う。', imageUrl: 'https://picsum.photos/seed/se3/400/300', imageHint: 'wind elemental' },
    { id: 'starter-elem-4', theme: 'fantasy', name: '大地の精霊', manaCost: 4, attack: 4, defense: 5, cardType: 'creature', rarity: 'uncommon', abilities: 'トランプル', flavorText: 'その一歩が大地を揺らす。', imageUrl: 'https://picsum.photos/seed/se4/400/300', imageHint: 'earth elemental' },
    { id: 'starter-elem-4-2', theme: 'fantasy', name: '大地の精霊', manaCost: 4, attack: 4, defense: 5, cardType: 'creature', rarity: 'uncommon', abilities: 'トランプル', flavorText: 'その一歩が大地を揺らす。', imageUrl: 'https://picsum.photos/seed/se4/400/300', imageHint: 'earth elemental' },
    { id: 'starter-elem-5', theme: 'fantasy', name: '雷の精霊', manaCost: 5, attack: 5, defense: 4, cardType: 'creature', rarity: 'rare', abilities: '速攻、飛行', flavorText: '空を引き裂く稲妻の化身。', imageUrl: 'https://picsum.photos/seed/se5/400/300', imageHint: 'lightning elemental' },
    { id: 'starter-elem-6', theme: 'fantasy', name: '氷の精霊', manaCost: 3, attack: 2, defense: 4, cardType: 'creature', rarity: 'uncommon', abilities: '相手クリーチャー1体をタップする。', flavorText: '万物を凍てつかせる冷気。', imageUrl: 'https://picsum.photos/seed/se6/400/300', imageHint: 'ice elemental' },
    { id: 'starter-elem-7', theme: 'fantasy', name: 'マグマの巨像', manaCost: 6, attack: 7, defense: 6, cardType: 'creature', rarity: 'rare', abilities: '', flavorText: '溶岩の中から生まれし巨人。', imageUrl: 'https://picsum.photos/seed/se7/400/300', imageHint: 'magma golem' },
    { id: 'starter-elem-7-2', theme: 'fantasy', name: 'マグマの巨像', manaCost: 6, attack: 7, defense: 6, cardType: 'creature', rarity: 'rare', abilities: '', flavorText: '溶岩の中から生まれし巨人。', imageUrl: 'https://picsum.photos/seed/se7/400/300', imageHint: 'magma golem' },
    { id: 'starter-espell-1', theme: 'fantasy', name: 'エレメンタル・チャージ', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に+1/+1の修正を与える。カードを1枚引く。', flavorText: '自然の力が、その身に宿る。', imageUrl: 'https://picsum.photos/seed/ses1/400/300', imageHint: 'elemental power' },
    { id: 'starter-espell-1-2', theme: 'fantasy', name: 'エレメンタル・チャージ', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に+1/+1の修正を与える。カードを1枚引く。', flavorText: '自然の力が、その身に宿る。', imageUrl: 'https://picsum.photos/seed/ses1/400/300', imageHint: 'elemental power' },
    { id: 'starter-espell-2', theme: 'fantasy', name: '自然の怒り', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: '飛行を持たないクリーチャー1体を破壊する。', flavorText: '大地は裏切り者を許さない。', imageUrl: 'https://picsum.photos/seed/ses2/400/300', imageHint: 'nature wrath' },
    { id: 'starter-espell-3', theme: 'fantasy', name: '召喚の儀式', manaCost: 3, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたの山札からコスト3以下のクリーチャーカードを1枚探し、戦場に出す。', flavorText: '古の呼び声に応えよ。', imageUrl: 'https://picsum.photos/seed/ses3/400/300', imageHint: 'summoning ritual' },
    { id: 'starter-espell-4', theme: 'fantasy', name: '元素融合', manaCost: 5, attack: 0, defense: 0, cardType: 'spell', rarity: 'rare', abilities: 'すべての相手クリーチャーに4ダメージを与える。', flavorText: '力が混ざり合い、爆発する。', imageUrl: 'https://picsum.photos/seed/ses4/400/300', imageHint: 'elemental fusion' },
    { id: 'starter-espell-4-2', theme: 'fantasy', name: '元素融合', manaCost: 5, attack: 0, defense: 0, cardType: 'spell', rarity: 'rare', abilities: 'すべての相手クリーチャーに4ダメージを与える。', flavorText: '力が混ざり合い、爆発する。', imageUrl: 'https://picsum.photos/seed/ses4/400/300', imageHint: 'elemental fusion' },
    { id: 'starter-espell-5', theme: 'fantasy', name: 'マナの奔流', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: '次のあなたのターンの最大マナを+2する。', flavorText: '魔力が満ちていくのがわかる。', imageUrl: 'https://picsum.photos/seed/ses5/400/300', imageHint: 'mana flow' },
    { id: 'starter-espell-6', theme: 'fantasy', name: '知恵の泉', manaCost: 4, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'カードを3枚引く。', flavorText: '知識は力なり。', imageUrl: 'https://picsum.photos/seed/ses6/400/300', imageHint: 'fountain wisdom' },
];


const shuffleDeck = (deck: CardData[]) => [...deck].sort(() => Math.random() - 0.5);

export default function BattlePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const roomId = searchParams.get('roomId');
    const { user } = useAuth();
    const [playerNumber, setPlayerNumber] = useState<1 | 2 | null>(null);
    const [isClient, setIsClient] = useState(false);
    const { toast } = useToast();
    const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [deckChoice, setDeckChoice] = useState<DeckChoice | null>(null);
    const [hasSavedDeck, setHasSavedDeck] = useState(false);
    const [cardBackImage, setCardBackImage] = useState<string | null>(null);

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

    const addToLog = (message: string) => {
        setGameLog(prev => [`[T${Math.ceil(turn/2)}] ${message}`, ...prev]);
    }

    const startGame = (playerDeckData: CardData[], opponentDeckData: CardData[]) => {
        const pDeck = [...playerDeckData];
        const oDeck = [...opponentDeckData];

        const initialPlayerHand = pDeck.splice(0, HAND_LIMIT);
        const initialOpponentHand = oDeck.splice(0, HAND_LIMIT);

        setPlayerDeck(pDeck);
        setPlayerHand(initialPlayerHand);
        setPlayerBoard([]);
        setPlayerHealth(20);
        setPlayerMana(1);
        setPlayerMaxMana(1);
        setPlayerHasPlayedNonCreature(false);

        setOpponentDeck(oDeck);
        setOpponentHand(initialOpponentHand);
        setOpponentBoard([]);
        setOpponentHealth(20);
        setOpponentMana(1);
        setOpponentMaxMana(1);
        setOpponentHasPlayedNonCreature(false);

        setTurn(1);
        setIsPlayerTurn(true);
        setGamePhase('main');
        setGameOver('');
        setGameLog([`--- ターン 1: あなたのターン ---`, 'ゲーム開始！']);
    };
    
    const loadAndSetPlayerDeck = async (choice: DeckChoice) => {
        setIsGeneratingDeck(true);
        addToLog('対戦の準備をしています...');
        let deckToLoad: CardData[] = [];
        let toastMessage = '';

        try {
            if (choice === 'my-deck') {
                const savedDeck = JSON.parse(localStorage.getItem('deck') || '[]');
                if (savedDeck.length > 0) {
                    deckToLoad = savedDeck;
                    toastMessage = '保存したデッキを読み込みました。';
                } else {
                    // Fallback to goblin deck if no saved deck
                    deckToLoad = goblinDeck;
                    toastMessage = '保存されたデッキがありません。ゴブリンデッキで開始します。';
                }
            } else if (choice === 'starter-goblin') {
                deckToLoad = goblinDeck;
                toastMessage = 'スターターデッキ「ゴブリン軍団」で開始します。';
            } else if (choice === 'starter-elemental') {
                deckToLoad = elementalDeck;
                toastMessage = 'スターターデッキ「エレメンタル召喚」で開始します。';
            } else if (choice === 'ai-fantasy' || choice === 'ai-scifi') {
                const theme = choice === 'ai-fantasy' ? 'ファンタジー' : 'SF';
                const result = await generateDeck({ theme, cardCount: DECK_SIZE });
                deckToLoad = result.deck.map((card, index) => ({
                    ...card,
                    id: `player-ai-${index}`,
                    theme: choice === 'ai-fantasy' ? 'fantasy' : 'sci-fi',
                    imageUrl: `https://picsum.photos/seed/p-ai${index}/${400}/${300}`,
                }));
                toastMessage = `AIが生成した「${theme}」デッキで開始します。`;
            }
            
            const aiDeck = await createAiDeck(deckToLoad);
            
            toast({ title: toastMessage });

            startGame(shuffleDeck(deckToLoad), shuffleDeck(aiDeck));

        } catch (error) {
            console.error("Failed to prepare player deck", error);
            toast({ variant: 'destructive', title: 'デッキの準備に失敗しました。'});
            const fallbackAiDeck = await createAiDeck(goblinDeck);
            startGame(shuffleDeck(goblinDeck), shuffleDeck(fallbackAiDeck));
        } finally {
            setIsGeneratingDeck(false);
        }
    };
    
    const createAiDeck = async (playerDeckData: CardData[]): Promise<CardData[]> => {
        addToLog('AIが対戦相手のデッキを準備しています...');
        try {
            // AI deck theme is opposite of player's
            const playerTheme = playerDeckData[0]?.theme || 'fantasy';
            const aiTheme = playerTheme === 'fantasy' ? 'SF' : 'ファンタジー';

            const result = await generateDeck({ theme: aiTheme, cardCount: DECK_SIZE });
            const aiGeneratedDeck: CardData[] = result.deck.map((card, index) => ({
                ...card,
                id: `ai-${index}`,
                theme: aiTheme === 'SF' ? 'sci-fi' : 'fantasy',
                imageUrl: `https://picsum.photos/seed/ai${index}/${400}/${300}`,
            }));
            addToLog('AIのデッキが完成しました！');
            return aiGeneratedDeck;
        } catch (error) {
            console.error("Failed to generate AI deck", error);
            toast({ variant: 'destructive', title: 'AIデッキの生成に失敗しました。'});
            return shuffleDeck(goblinDeck); // Fallback
        }
    };

    useEffect(() => {
        setIsClient(true);
        try {
            const savedDeck = JSON.parse(localStorage.getItem('deck') || '[]');
            if (savedDeck.length > 0) {
                setHasSavedDeck(true);
            }
            const savedCardBack = localStorage.getItem('cardBackImage');
            if (savedCardBack) {
                setCardBackImage(savedCardBack);
            }
        } catch (error) {
            console.error("Failed to check for saved data", error);
        }
    }, []);

    useEffect(() => {
        if (!roomId || !user) {
            // AI戦のロジック or ユーザー未認証
            return;
        }

        const roomRef = doc(db, "rooms", roomId as string);

        const unsub = onSnapshot(roomRef, (doc) => {
            const roomData = doc.data();
            if (!roomData) {
                toast({ variant: "destructive", title: "ルームが存在しません。" });
                router.push('/room');
                return;
            }

            const players = roomData.players || [];
            const playerIndex = players.indexOf(user.uid);

            if (playerIndex === -1) {
                // 参加者ではない
                toast({ variant: "destructive", title: "あなたはこのルームの参加者ではありません。" });
                router.push('/room');
                return;
            }

            const currentPlayerNumber = (playerIndex + 1) as (1 | 2);
            setPlayerNumber(currentPlayerNumber);

            // ゲーム状態の同期
            const gameState = roomData.gameState;
            if (gameState) {
                const myPlayerState = gameState[`player${currentPlayerNumber}`];
                const opponentPlayerState = gameState[`player${currentPlayerNumber === 1 ? 2 : 1}`];

                if (myPlayerState) {
                    setPlayerDeck(myPlayerState.deck || []);
                    setPlayerHand(myPlayerState.hand || []);
                    setPlayerBoard(myPlayerState.board || []);
                    setPlayerHealth(myPlayerState.health);
                    setPlayerMana(myPlayerState.mana);
                    setPlayerMaxMana(myPlayerState.maxMana);
                }
                if (opponentPlayerState) {
                    setOpponentDeck(opponentPlayerState.deck || []);
                    setOpponentHand(opponentPlayerState.hand || []);
                    setOpponentBoard(opponentPlayerState.board || []);
                    setOpponentHealth(opponentPlayerState.health);
                    setOpponentMana(opponentPlayerState.mana);
                    setOpponentMaxMana(opponentPlayerState.maxMana);
                }
                
                setTurn(roomData.turn);
                setIsPlayerTurn(roomData.turn === user.uid);
                setGameOver(roomData.gameOver || '');
                setGameLog(roomData.gameLog || []);
                setGamePhase(roomData.gamePhase || 'main');
                setDeckChoice('in-game');
            } else if (roomData.status === 'waiting' && players.length === 2 && currentPlayerNumber === 1) {
                // Player 1がゲームの初期状態を作成する
                initializeGame();
            }
        });

        return () => unsub();

    }, [roomId, user, router, toast]);

    const initializeGame = async () => {
        if (!roomId || !user) return;

        console.log("Initializing game for room:", roomId);

        const p1Deck = shuffleDeck(goblinDeck);
        const p2Deck = shuffleDeck(elementalDeck);

        const initialPlayer1Hand = p1Deck.splice(0, HAND_LIMIT);
        const initialPlayer2Hand = p2Deck.splice(0, HAND_LIMIT);

        const initialGameState = {
            player1: {
                deck: p1Deck,
                hand: initialPlayer1Hand,
                board: [],
                health: 20,
                mana: 1,
                maxMana: 1,
            },
            player2: {
                deck: p2Deck,
                hand: initialPlayer2Hand,
                board: [],
                health: 20,
                mana: 1,
                maxMana: 1,
            }
        };

        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);
        const roomData = roomSnap.data();
        if (!roomData) return;

        await updateDoc(roomRef, {
            gameState: initialGameState,
            gameLog: ['ゲーム開始！', `--- ターン 1: ${roomData.players[0]}のターン ---`],
            gameOver: '',
            turn: roomData.players[0], // 先攻はplayer1
            gamePhase: 'main',
            status: 'playing',
        });
    };

    const handleSelectDeck = (choice: DeckChoice) => {
        setDeckChoice(choice);
        loadAndSetPlayerDeck(choice);
    };

    const resetGame = () => {
        setDifficulty(null);
        setDeckChoice(null);
        setGameOver('');
        setGameLog([]);
    }

    const drawCard = (isPlayer: boolean) => {
        if (isPlayer) {
            let deck = [...playerDeck];
            if(deck.length === 0) {
                addToLog('あなたの山札はもうない！');
                return;
            }
            const drawnCard = deck.shift();
            setPlayerDeck(deck);
            if (drawnCard) {
                if (playerHand.length < HAND_LIMIT) {
                    setPlayerHand(prev => [...prev, drawnCard]);
                    addToLog('あなたはカードを1枚引いた。');
                } else {
                    addToLog('あなたの手札がいっぱいで、引いたカードを破棄した。');
                }
            }
        } else {
            let deck = [...opponentDeck];
             if(deck.length === 0) {
                addToLog('相手の山札はもうない！');
                return;
            }
            const drawnCard = deck.shift();
            setOpponentDeck(deck);
            if (drawnCard) {
                if (opponentHand.length < HAND_LIMIT) {
                    setOpponentHand(prev => [...prev, drawnCard]);
                    addToLog('相手はカードを1枚引いた。');
                } else {
                    addToLog('相手の手札がいっぱいで、引いたカードを破棄した。');
                }
            }
        }
    }

    const applySpellEffect = async (card: CardData, isCasterPlayer: boolean) => {
        if (!roomId || !playerNumber) { // AI戦
            const Caster = isCasterPlayer ? 'あなた' : '相手';
            const Target = isCasterPlayer ? '相手' : 'あなた';
            let effectApplied = false;
            if (card.abilities) {
                const abilities = card.abilities.toLowerCase();
                if (abilities.includes('ダメージ')) {
                    const damage = parseInt(abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10);
                    if (damage > 0) {
                        if (isCasterPlayer) setOpponentHealth(prev => Math.max(0, prev - damage));
                        else setPlayerHealth(prev => Math.max(0, prev - damage));
                        addToLog(`「${card.name}」の効果で${Target}に${damage}ダメージ！`);
                        effectApplied = true;
                    }
                }
                if (abilities.includes('回復')) {
                    const heal = parseInt(abilities.match(/(\d+)回復/)?.[1] || '0', 10);
                    if (heal > 0) {
                        if (isCasterPlayer) setPlayerHealth(prev => prev + heal);
                        else setOpponentHealth(prev => prev + heal);
                        addToLog(`「${card.name}」の効果で${Caster}はライフを${heal}回復。`);
                        effectApplied = true;
                    }
                }
                if (abilities.includes('カードを引く')) {
                    const drawCount = parseInt(abilities.match(/(\d+)枚/)?.[1] || '1', 10);
                    addToLog(`「${card.name}」の効果で${Caster}はカードを${drawCount}枚引く。`);
                    for(let i=0; i<drawCount; i++) drawCard(isCasterPlayer);
                    effectApplied = true;
                }
                if (abilities.includes('マナ')) {
                    const manaBoost = parseInt(abilities.match(/\+(\d+)/)?.[1] || '1', 10);
                    if (isCasterPlayer) setPlayerMaxMana(prev => Math.min(MAX_MANA, prev + manaBoost));
                    else setOpponentMaxMana(prev => Math.min(MAX_MANA, prev + manaBoost));
                    addToLog(`「${card.name}」の効果で${Caster}の最大マナが増えた！`);
                    effectApplied = true;
                }
            }
            if (!effectApplied) addToLog(`「${card.name}」は何の効果ももたらさなかった。`);
            return;
        }

        // --- ルーム対戦のロジック ---
        const casterPlayerNumber = isCasterPlayer ? playerNumber : (playerNumber === 1 ? 2 : 1);
        try {
            const roomRef = doc(db, "rooms", roomId);
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) throw "Document does not exist!";

                const roomData = roomDoc.data();
                const gameState = roomData.gameState;
                const casterKey = `player${casterPlayerNumber}`;
                const opponentKey = `player${casterPlayerNumber === 1 ? 2 : 1}`;
                const casterState = gameState[casterKey];
                const opponentState = gameState[opponentKey];

                let newCasterState = { ...casterState };
                let newOpponentState = { ...opponentState };
                let effectLogs: string[] = [];
                let effectApplied = false;
                const abilities = card.abilities.toLowerCase();

                if (abilities.includes('ダメージ')) {
                    const damage = parseInt(abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10);
                    if (damage > 0) {
                        newOpponentState.health = Math.max(0, newOpponentState.health - damage);
                        effectLogs.push(`「${card.name}」の効果で${damage}ダメージ！`);
                        effectApplied = true;
                    }
                }
                if (abilities.includes('回復')) {
                    const heal = parseInt(abilities.match(/(\d+)回復/)?.[1] || '0', 10);
                    if (heal > 0) {
                        newCasterState.health = newCasterState.health + heal;
                        effectLogs.push(`「${card.name}」の効果でライフを${heal}回復。`);
                        effectApplied = true;
                    }
                }
                if (abilities.includes('カードを引く')) {
                    const drawCount = parseInt(abilities.match(/(\d+)枚/)?.[1] || '1', 10);
                    effectLogs.push(`「${card.name}」の効果でカードを${drawCount}枚引く。`);
                    let casterDeck = [...newCasterState.deck];
                    let casterHand = [...newCasterState.hand];
                    for (let i = 0; i < drawCount; i++) {
                        if (casterDeck.length > 0) {
                            const drawnCard = casterDeck.shift();
                            if (drawnCard && casterHand.length < HAND_LIMIT) casterHand.push(drawnCard);
                        }
                    }
                    newCasterState.deck = casterDeck;
                    newCasterState.hand = casterHand;
                    effectApplied = true;
                }
                if (abilities.includes('マナ')) {
                    const manaBoost = parseInt(abilities.match(/\+(\d+)/)?.[1] || '1', 10);
                    newCasterState.maxMana = Math.min(MAX_MANA, newCasterState.maxMana + manaBoost);
                    effectLogs.push(`「${card.name}」の効果で最大マナが増えた！`);
                    effectApplied = true;
                }

                if (!effectApplied) effectLogs.push(`「${card.name}」は何の効果ももたらさなかった。`);

                const newGameState = { ...gameState, [casterKey]: newCasterState, [opponentKey]: newOpponentState };
                const newGameLog = [...effectLogs, ...roomData.gameLog];
                let gameOverMessage = roomData.gameOver || '';
                if (newOpponentState.health <= 0) gameOverMessage = `プレイヤー ${casterPlayerNumber}の勝利！`;
                else if (newCasterState.health <= 0) gameOverMessage = `プレイヤー ${casterPlayerNumber === 1 ? 2 : 1}の勝利！`;

                transaction.update(roomRef, { gameState: newGameState, gameLog: newGameLog, gameOver: gameOverMessage });
            });
        } catch (e) {
            console.error("Spell effect transaction failed: ", e);
            toast({ variant: "destructive", title: "スペル効果の処理に失敗しました。" });
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

    const playCard = async (card: CardData, cardIndex: number) => {
        if (!roomId) { // AI戦の場合
            if (!isPlayerTurn || gameOver || gamePhase !== 'main') return;
            if (playerMana < card.manaCost) {
                toast({ variant: 'destructive', title: 'マナが足りません！'});
                return;
            }
            if (card.cardType !== 'creature' && playerHasPlayedNonCreature) {
                toast({ variant: 'destructive', title: 'このターンはこれ以上、呪文やアーティファクト、土地は使えません。'});
                return;
            }
            if (card.cardType === 'creature' && playerBoard.length >= BOARD_LIMIT) {
                toast({ variant: 'destructive', title: '場が上限に達しています。'});
                return;
            }
            const newHand = [...playerHand];
            newHand.splice(cardIndex, 1);
            setPlayerMana(prev => prev - card.manaCost);
            setPlayerHand(newHand);
            addToLog(`あなたが「${card.name}」をプレイ！`);
            if (card.cardType === 'creature') {
                setPlayerBoard(prev => [...prev, {...card, canAttack: false}]);
            } else {
                setPlayerHasPlayedNonCreature(true);
                applySpellEffect(card, true);
            }
            return;
        }

        // --- ルーム対戦のロジック ---
        if (!isPlayerTurn || gameOver || gamePhase !== 'main' || !playerNumber) return;

        try {
            const roomRef = doc(db, "rooms", roomId);
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw "Document does not exist!";
                }

                const roomData = roomDoc.data();
                if (roomData.turn !== user?.uid) {
                    toast({ variant: "destructive", title: "相手のターンです。" });
                    return;
                }

                const gameState = roomData.gameState;
                const myPlayerState = gameState[`player${playerNumber}`];
                const myPlayerKey = `player${playerNumber}`;

                if (myPlayerState.mana < card.manaCost) {
                    toast({ variant: "destructive", title: "マナが足りません！" });
                    return;
                }
                if (card.cardType === 'creature' && myPlayerState.board.length >= BOARD_LIMIT) {
                    toast({ variant: "destructive", title: '場が上限に達しています。'});
                    return;
                }
                // TODO: 呪文を1ターンに1枚しか使えないルールの実装

                const newHand = [...myPlayerState.hand];
                newHand.splice(cardIndex, 1);

                const newMana = myPlayerState.mana - card.manaCost;
                
                let newBoard = myPlayerState.board;
                if (card.cardType === 'creature') {
                    newBoard = [...myPlayerState.board, { ...card, canAttack: false }];
                }

                const newGameState = {
                    ...gameState,
                    [myPlayerKey]: {
                        ...myPlayerState,
                        hand: newHand,
                        mana: newMana,
                        board: newBoard,
                    }
                };
                
                const newLog = `「${card.name}」がプレイされた！`;
                const newGameLog = [newLog, ...(roomData.gameLog || [])];

                transaction.update(roomRef, { gameState: newGameState, gameLog: newGameLog });
                
                // スペル効果はトランザクションの外で適用
            });

            // トランザクション成功後にスペル効果を適用
            if (card.cardType !== 'creature') {
                await applySpellEffect(card, true);
            }

        } catch (e) {
            console.error("Play card transaction failed: ", e);
            toast({ variant: "destructive", title: "カードのプレイに失敗しました。" });
        }
    };

    const handleAttackPhase = async () => {
        if (!isPlayerTurn || gameOver || gamePhase !== 'main') return;

        if (!roomId) { // AI戦
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
            setTimeout(endTurn, 1000); // endTurnもAI戦ロジックが呼ばれる
            return;
        }

        // --- ルーム対戦のロジック ---
        if (!playerNumber) return;

        try {
            const roomRef = doc(db, "rooms", roomId);
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) throw "Document does not exist!";
                
                const roomData = roomDoc.data();
                if (roomData.turn !== user?.uid) return;

                const gameState = roomData.gameState;
                const myPlayerKey = `player${playerNumber}`;
                const myPlayerState = gameState[myPlayerKey];
                const opponentPlayerIndex = roomData.players.indexOf(user.uid) === 0 ? 1 : 0;
                const opponentUid = roomData.players[opponentPlayerIndex];
                const opponentPlayerKey = `player${opponentPlayerIndex + 1}`;
                const opponentPlayerState = gameState[opponentPlayerKey];

                // 攻撃処理
                let totalDamage = 0;
                let attackLogs: string[] = [];
                myPlayerState.board.forEach((c: any) => {
                    if (c.canAttack) {
                        totalDamage += c.attack;
                        attackLogs.push(`「${c.name}」(${c.attack}/${c.defense})が攻撃！`);
                    }
                });

                const damageLog = totalDamage > 0 ? `合計${totalDamage}のダメージ！` : '攻撃できるクリーチャーがいませんでした。';
                const newOpponentHealth = Math.max(0, opponentPlayerState.health - totalDamage);

                // 相手のターン開始処理
                const newOpponentMaxMana = Math.min(MAX_MANA, opponentPlayerState.maxMana + 1);
                const newOpponentMana = newOpponentMaxMana;
                let opponentDeck = [...opponentPlayerState.deck];
                let opponentHand = [...opponentPlayerState.hand];
                let drawLog = "";
                if (opponentDeck.length > 0) {
                    const drawnCard = opponentDeck.shift();
                    if (drawnCard && opponentHand.length < HAND_LIMIT) {
                        opponentHand.push(drawnCard);
                        drawLog = `相手はカードを1枚引いた。`;
                    }
                }

                const newGameState = {
                    ...gameState,
                    [myPlayerKey]: {
                        ...myPlayerState,
                    },
                    [opponentPlayerKey]: {
                        ...opponentPlayerState,
                        health: newOpponentHealth,
                        mana: newOpponentMana,
                        maxMana: newOpponentMaxMana,
                        deck: opponentDeck,
                        hand: opponentHand,
                        board: opponentPlayerState.board.map((c: any) => ({ ...c, canAttack: true }))
                    }
                };
                
                const newGameLog = [`相手のターン開始。`, drawLog, damageLog, ...attackLogs, '攻撃フェーズへ！', ...roomData.gameLog];
                
                let gameOverMessage = '';
                if (newOpponentHealth <= 0) {
                    gameOverMessage = 'あなたの勝利！';
                }

                transaction.update(roomRef, {
                    turn: opponentUid,
                    gamePhase: 'main',
                    gameState: newGameState,
                    gameLog: newGameLog,
                    gameOver: gameOverMessage,
                });
            });
        } catch (e) {
            console.error("Attack phase transaction failed: ", e);
            toast({ variant: "destructive", title: "攻撃処理に失敗しました。" });
        }
    };

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
        if (myBoard.length >= BOARD_LIMIT) {
            playableCards = playableCards.filter(c => c.cardType !== 'creature');
        }

        if (playableCards.length === 0) return null;

        if (difficulty === 'beginner') {
            return playableCards.sort((a,b) => b.manaCost - a.manaCost)[0];
        }

        // Advanced AI
        const creatureCards = playableCards.filter(c => c.cardType === 'creature');
        const spellCards = playableCards.filter(c => c.cardType !== 'creature');

        // Play creature with best score (atk+def / cost)
        if (creatureCards.length > 0) {
             const bestCreature = creatureCards.reduce((best, current) => {
                const bestScore = (best.attack + best.defense) / (best.manaCost + 1);
                const currentScore = (current.attack + current.defense) / (current.manaCost + 1);
                return currentScore > bestScore ? current : best;
            });
            if (myBoard.length < BOARD_LIMIT) return bestCreature;
        }
        
        if (spellCards.length > 0) {
            const damageSpells = spellCards.filter(s => s.abilities.includes('ダメージ'));
            if (damageSpells.length > 0 && playerHealth < opponentHealth / 2) {
                return damageSpells.sort((a, b) => (parseInt(b.abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10)) - (parseInt(a.abilities.match(/(\d+)ダメージ/)?.[1] || '0', 10)))[0];
            }
            const drawSpells = spellCards.filter(s => s.abilities.includes('カードを引く'));
            if (drawSpells.length > 0 && hand.length <= 2) {
                return drawSpells[0];
            }
            if (spellCards.length > 0) return spellCards.sort((a,b) => b.manaCost - a.manaCost)[0];
        }

        return playableCards.length > 0 ? playableCards.sort((a,b) => b.manaCost - a.manaCost)[0] : null;
    }

    const aiTurn = () => {
        if (gameOver) return;

        const nextTurn = turn + 1;
        setTurn(nextTurn);
        addToLog(`--- ターン ${Math.ceil(nextTurn/2)}: 相手のターン ---`);

        const newOpponentMaxMana = Math.min(MAX_MANA, opponentMaxMana + 1);
        setOpponentMaxMana(newOpponentMaxMana);
        setOpponentMana(newOpponentMaxMana);
        setOpponentHasPlayedNonCreature(false);
        setOpponentBoard(prev => prev.map(c => ({ ...c, canAttack: true })));
        
        drawCard(false);

        let tempHand = [...opponentHand];
        let tempMana = newOpponentMaxMana;
        let tempBoard = [...opponentBoard];
        let tempNonCreaturePlayed = false;

        const playCardLoop = () => {
            const cardToPlay = aiChooseCard(tempHand, tempMana, tempBoard, tempNonCreaturePlayed);

            if (cardToPlay) {
                const cardIndex = tempHand.findIndex(c => c.id === cardToPlay.id);
                tempMana -= cardToPlay.manaCost;
                tempHand.splice(cardIndex, 1);
                
                setOpponentHand(h => h.filter(c => c.id !== cardToPlay.id));
                setOpponentMana(m => m - cardToPlay.manaCost);
                
                addToLog(`相手が「${cardToPlay.name}」をプレイ！`);

                if (cardToPlay.cardType === 'creature') {
                    tempBoard.push({...cardToPlay, canAttack: false});
                    setOpponentBoard(b => [...b, {...cardToPlay, canAttack: false}]);
                } else {
                    tempNonCreaturePlayed = true;
                    setOpponentHasPlayedNonCreature(true);
                    applySpellEffect(cardToPlay, false);
                }
                setTimeout(playCardLoop, 1500);
            } else {
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
            
            const newPlayerMaxMana = Math.min(MAX_MANA, playerMaxMana + 1);
            setPlayerMaxMana(newPlayerMaxMana);
            setPlayerMana(newPlayerMaxMana);
            setPlayerBoard(prev => prev.map(c => ({ ...c, canAttack: true })));
            setPlayerHasPlayedNonCreature(false);
            setIsPlayerTurn(true);
            setGamePhase('main');
            
            addToLog(`--- ターン ${Math.ceil(turn/2)+1}: あなたのターン ---`);
            drawCard(true);
        }
        
        setTimeout(playCardLoop, 1000);
    };
    
    if (!isClient) {
        return <main className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" />ロード中...</main>;
    }
    
    if (isGeneratingDeck) {
        return (
            <main className="text-center p-10">
                <div className="flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-lg text-muted-foreground">デッキを準備しています...</p>
                    <p className="text-sm text-muted-foreground">AIデッキ生成には少し時間がかかる場合があります。</p>
                </div>
            </main>
        );
    }
    
    if (!difficulty) {
        return (
            <main className="text-center p-10">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">難易度を選択してください</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button onClick={() => setDifficulty('beginner')} size="lg">
                            <Bot className="mr-2" /> 初級
                        </Button>
                        <Button onClick={() => setDifficulty('advanced')} size="lg">
                           <BrainCircuit className="mr-2" /> 上級
                        </Button>
                    </CardContent>
                </Card>
            </main>
        )
    }

    if (difficulty && !deckChoice) {
        return (
             <main className="text-center p-10">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">使用するデッキを選択してください</CardTitle>
                        <CardDescription>
                            難易度: {difficulty === 'beginner' ? '初級' : '上級'}
                            <Button variant="link" onClick={() => setDifficulty(null)}>変更</Button>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hasSavedDeck && (
                             <Button onClick={() => handleSelectDeck('my-deck')} size="lg" className="h-20">
                                <FileJson className="mr-2" />
                                <div>
                                    <p>保存したデッキ</p>
                                    <p className="text-sm font-normal">（デッキ構築で作成）</p>
                                </div>
                            </Button>
                        )}
                        <Button onClick={() => handleSelectDeck('starter-goblin')} size="lg" className="h-20">
                            <Group className="mr-2" />
                            <div>
                                <p>スターター「ゴブリン軍団」</p>
                                <p className="text-sm font-normal">（速攻タイプ）</p>
                            </div>
                        </Button>
                         <Button onClick={() => handleSelectDeck('starter-elemental')} size="lg" className="h-20">
                            <Group className="mr-2" />
                            <div>
                                <p>スターター「エレメンタル召喚」</p>
                                <p className="text-sm font-normal">（コントロールタイプ）</p>
                            </div>
                        </Button>
                        <Button onClick={() => handleSelectDeck('ai-fantasy')} size="lg" className="h-20">
                           <Wand2 className="mr-2" /> 
                           <div>
                                <p>AI生成デッキ (ファンタジー)</p>
                                <p className="text-sm font-normal">（毎回新しいデッキ）</p>
                            </div>
                        </Button>
                        <Button onClick={() => handleSelectDeck('ai-scifi')} size="lg" className="h-20">
                           <Wand2 className="mr-2" /> 
                           <div>
                                <p>AI生成デッキ (SF)</p>
                                <p className="text-sm font-normal">（毎回新しいデッキ）</p>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        )
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
                        <div key={card.id ? card.id + i.toString() : i} className="w-24">
                           {cardBackImage ? (
                                <Image src={cardBackImage} alt="Card Back" width={96} height={134} className="rounded-lg shadow-md" />
                           ) : (
                                <Card className="h-full flex items-center justify-center text-center p-2 bg-slate-700 text-white">裏向きのカード</Card>
                           )}
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
                    <div key={card.id + i.toString()} className="w-[110px]">
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
                    <Button onClick={resetGame}>
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
                <div key={card.id + i.toString()} className={cn("w-[110px] transform transition-transform", card.canAttack ? "border-4 border-green-500 rounded-2xl hover:scale-105" : "opacity-70")}>
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
                    <p className="mt-2 text-sm">ターン: {Math.ceil(turn/2)}</p>
                </Card>
                <div className="flex gap-2 min-h-[180px]">
                    {playerHand.map((card, i) => (
                        <div key={card.id + i.toString()} className="w-[130px] cursor-pointer hover:scale-105 transition-transform" onClick={() => playCard(card, i)}>
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

    