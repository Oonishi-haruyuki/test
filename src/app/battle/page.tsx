
'use client';

import { useState, useEffect } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Swords, Heart, Shield, Dices, RotateCcw, Loader2, BrainCircuit, Bot, Wand2, Group, FileJson, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateDeck } from '@/ai/flows/generate-deck';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useCurrency } from '@/hooks/use-currency';
import { useStats } from '@/hooks/use-stats';

const HAND_LIMIT = 5;
const DECK_SIZE = 30;
const MAX_MANA = 10;
const BOARD_LIMIT = 5;

const BEGINNER_WIN_REWARD = 10;
const BEGINNER_LOSE_PENALTY = 5;
const ADVANCED_WIN_REWARD = 50;
const ADVANCED_LOSE_PENALTY = 10;

interface Deck {
    id: string;
    name: string;
    cards: CardData[];
}

type Difficulty = 'beginner' | 'advanced';
type DeckChoice = 'my-deck' | 'starter-goblin' | 'starter-elemental' | 'starter-undead' | 'starter-dragon' | 'starter-ninja' | 'ai-fantasy' | 'ai-scifi';

export const goblinDeck: CardData[] = [
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

export const elementalDeck: CardData[] = [
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

export const undeadDeck: CardData[] = [
    { id: 'starter-undead-1', theme: 'fantasy', name: 'スケルトン兵', manaCost: 1, attack: 1, defense: 1, cardType: 'creature', rarity: 'common', abilities: 'このカードが破壊された時、1/1のスケルトン・トークンを1体生成する。', flavorText: '骨は砕けても、魂は砕けない。', imageUrl: 'https://picsum.photos/seed/su1/400/300', imageHint: 'skeleton warrior' },
    { id: 'starter-undead-1-2', theme: 'fantasy', name: 'スケルトン兵', manaCost: 1, attack: 1, defense: 1, cardType: 'creature', rarity: 'common', abilities: 'このカードが破壊された時、1/1のスケルトン・トークンを1体生成する。', flavorText: '骨は砕けても、魂は砕けない。', imageUrl: 'https://picsum.photos/seed/su1/400/300', imageHint: 'skeleton warrior' },
    { id: 'starter-undead-2', theme: 'fantasy', name: 'ゾンビの群れ', manaCost: 2, attack: 2, defense: 2, cardType: 'creature', rarity: 'common', abilities: '戦場に出た時、相手の手札をランダムに1枚捨てさせる。', flavorText: '彼らの飢えは、肉体だけでは満たされない。', imageUrl: 'https://picsum.photos/seed/su2/400/300', imageHint: 'zombie horde' },
    { id: 'starter-undead-2-2', theme: 'fantasy', name: 'ゾンビの群れ', manaCost: 2, attack: 2, defense: 2, cardType: 'creature', rarity: 'common', abilities: '戦場に出た時、相手の手札をランダムに1枚捨てさせる。', flavorText: '彼らの飢えは、肉体だけでは満たされない。', imageUrl: 'https://picsum.photos/seed/su2/400/300', imageHint: 'zombie horde' },
    { id: 'starter-undead-3', theme: 'fantasy', name: 'リッチの使い魔', manaCost: 3, attack: 2, defense: 1, cardType: 'creature', rarity: 'uncommon', abilities: '飛行、あなたの墓地からカードを1枚手札に戻す。', flavorText: '主の命令を、ただ忠実に。', imageUrl: 'https://picsum.photos/seed/su3/400/300', imageHint: 'lich familiar' },
    { id: 'starter-undead-3-2', theme: 'fantasy', name: 'リッチの使い魔', manaCost: 3, attack: 2, defense: 1, cardType: 'creature', rarity: 'uncommon', abilities: '飛行、あなたの墓地からカードを1枚手札に戻す。', flavorText: '主の命令を、ただ忠実に。', imageUrl: 'https://picsum.photos/seed/su3/400/300', imageHint: 'lich familiar' },
    { id: 'starter-undead-4', theme: 'fantasy', name: 'グレイブ・タイタン', manaCost: 6, attack: 6, defense: 6, cardType: 'creature', rarity: 'mythic', abilities: 'トランプル、戦場に出た時、ゾンビ・トークンを2体生成する。', flavorText: '死の軍勢を率いる、巨大な墓守。', imageUrl: 'https://picsum.photos/seed/su4/400/300', imageHint: 'grave titan' },
    { id: 'starter-undead-5', theme: 'fantasy', name: 'ネクロマンサー', manaCost: 4, attack: 3, defense: 3, cardType: 'creature', rarity: 'rare', abilities: 'あなたの墓地にあるクリーチャーカードを1枚戦場に戻す。', flavorText: '死は終わりではない。新たな始まりだ。', imageUrl: 'https://picsum.photos/seed/su5/400/300', imageHint: 'necromancer casting' },
    { id: 'starter-undead-5-2', theme: 'fantasy', name: 'ネクロマンサー', manaCost: 4, attack: 3, defense: 3, cardType: 'creature', rarity: 'rare', abilities: 'あなたの墓地にあるクリーチャーカードを1枚戦場に戻す。', flavorText: '死は終わりではない。新たな始まりだ。', imageUrl: 'https://picsum.photos/seed/su5/400/300', imageHint: 'necromancer casting' },
    { id: 'starter-uspell-1', theme: 'fantasy', name: '死者蘇生', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたの墓地からコスト3以下のクリーチャーを戦場に戻す。', flavorText: '魂のない肉体が、再び動き出す。', imageUrl: 'https://picsum.photos/seed/sus1/400/300', imageHint: 'dark resurrection' },
    { id: 'starter-uspell-1-2', theme: 'fantasy', name: '死者蘇生', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたの墓地からコスト3以下のクリーチャーを戦場に戻す。', flavorText: '魂のない肉体が、再び動き出す。', imageUrl: 'https://picsum.photos/seed/sus1/400/300', imageHint: 'dark resurrection' },
    { id: 'starter-uspell-2', theme: 'fantasy', name: '魂の吸引', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に2ダメージを与え、あなたは2ライフを得る。', flavorText: 'その痛みは、我が力となる。', imageUrl: 'https://picsum.photos/seed/sus2/400/300', imageHint: 'soul drain' },
    { id: 'starter-uspell-2-2', theme: 'fantasy', name: '魂の吸引', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に2ダメージを与え、あなたは2ライフを得る。', flavorText: 'その痛みは、我が力となる。', imageUrl: 'https://picsum.photos/seed/sus2/400/300', imageHint: 'soul drain' },
    { id: 'starter-uspell-3', theme: 'fantasy', name: '暗黒の儀式', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'rare', abilities: 'あなたのマナを3点増やす。', flavorText: '禁じられた力には、代償が伴う。', imageUrl: 'https://picsum.photos/seed/sus3/400/300', imageHint: 'dark ritual' },
    { id: 'starter-uspell-4', theme: 'fantasy', name: '墓所からの呼び声', manaCost: 5, attack: 0, defense: 0, cardType: 'spell', rarity: 'rare', abilities: 'あなたの墓地にあるすべてのクリーチャーカードを手札に戻す。', flavorText: '眠れる者たちよ、今こそ目覚めよ！', imageUrl: 'https://picsum.photos/seed/sus4/400/300', imageHint: 'call from grave' },
    { id: 'starter-uspell-5', theme: 'fantasy', name: '腐敗の霧', manaCost: 3, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'すべてのクリーチャーはターン終了時まで-1/-1の修正を受ける。', flavorText: '生あるものは、やがて朽ち果てる。', imageUrl: 'https://picsum.photos/seed/sus5/400/300', imageHint: 'decaying mist' },
    { id: 'starter-uspell-5-2', theme: 'fantasy', name: '腐敗の霧', manaCost: 3, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'すべてのクリーチャーはターン終了時まで-1/-1の修正を受ける。', flavorText: '生あるものは、やがて朽ち果てる。', imageUrl: 'https://picsum.photos/seed/sus5/400/300', imageHint: 'decaying mist' },
    { id: 'starter-uspell-6', theme: 'fantasy', name: '死の契約', manaCost: 4, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'カードを3枚引き、3ライフを失う。', flavorText: '知識こそが、究極の力。', imageUrl: 'https://picsum.photos/seed/sus6/400/300', imageHint: 'death contract' },
    { id: 'starter-uspell-6-2', theme: 'fantasy', name: '死の契約', manaCost: 4, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'カードを3枚引き、3ライフを失う。', flavorText: '知識こそが、究極の力。', imageUrl: 'https://picsum.photos/seed/sus6/400/300', imageHint: 'death contract' },
];

export const dragonDeck: CardData[] = [
    { id: 'starter-dragon-1', theme: 'fantasy', name: 'ドラゴンの雛', manaCost: 1, attack: 1, defense: 1, cardType: 'creature', rarity: 'common', abilities: '飛行', flavorText: 'いつか空の王者となる、小さな翼。', imageUrl: 'https://picsum.photos/seed/sd1/400/300', imageHint: 'baby dragon' },
    { id: 'starter-dragon-1-2', theme: 'fantasy', name: 'ドラゴンの雛', manaCost: 1, attack: 1, defense: 1, cardType: 'creature', rarity: 'common', abilities: '飛行', flavorText: 'いつか空の王者となる、小さな翼。', imageUrl: 'https://picsum.photos/seed/sd1/400/300', imageHint: 'baby dragon' },
    { id: 'starter-dragon-2', theme: 'fantasy', name: 'マナ加速のドラゴン', manaCost: 2, attack: 0, defense: 2, cardType: 'creature', rarity: 'common', abilities: 'あなたのマナプールにマナを1点加える。', flavorText: 'その鱗は、魔法の源泉。', imageUrl: 'https://picsum.photos/seed/sd2/400/300', imageHint: 'mana dragon' },
    { id: 'starter-dragon-2-2', theme: 'fantasy', name: 'マナ加速のドラゴン', manaCost: 2, attack: 0, defense: 2, cardType: 'creature', rarity: 'common', abilities: 'あなたのマナプールにマナを1点加える。', flavorText: 'その鱗は、魔法の源泉。', imageUrl: 'https://picsum.photos/seed/sd2/400/300', imageHint: 'mana dragon' },
    { id: 'starter-dragon-3', theme: 'fantasy', name: '若きドラゴン', manaCost: 4, attack: 3, defense: 3, cardType: 'creature', rarity: 'uncommon', abilities: '飛行、速攻', flavorText: '空を焦がす、若き炎。', imageUrl: 'https://picsum.photos/seed/sd3/400/300', imageHint: 'young dragon' },
    { id: 'starter-dragon-3-2', theme: 'fantasy', name: '若きドラゴン', manaCost: 4, attack: 3, defense: 3, cardType: 'creature', rarity: 'uncommon', abilities: '飛行、速攻', flavorText: '空を焦がす、若き炎。', imageUrl: 'https://picsum.photos/seed/sd3/400/300', imageHint: 'young dragon' },
    { id: 'starter-dragon-4', theme: 'fantasy', name: 'エンシェント・ドラゴン', manaCost: 8, attack: 8, defense: 8, cardType: 'creature', rarity: 'mythic', abilities: '飛行、トランプル、このクリーチャーは呪文や能力の対象にならない。', flavorText: '世界の始まりから、終わりまでを見つめてきた。', imageUrl: 'https://picsum.photos/seed/sd4/400/300', imageHint: 'ancient dragon' },
    { id: 'starter-dragon-5', theme: 'fantasy', name: 'ヘルカイト', manaCost: 6, attack: 5, defense: 5, cardType: 'creature', rarity: 'rare', abilities: '飛行、戦場に出た時、すべての地上クリーチャーに2ダメージを与える。', flavorText: 'その影が通った後には、灰しか残らない。', imageUrl: 'https://picsum.photos/seed/sd5/400/300', imageHint: 'hellkite dragon' },
    { id: 'starter-dragon-5-2', theme: 'fantasy', name: 'ヘルカイト', manaCost: 6, attack: 5, defense: 5, cardType: 'creature', rarity: 'rare', abilities: '飛行、戦場に出た時、すべての地上クリーチャーに2ダメージを与える。', flavorText: 'その影が通った後には、灰しか残らない。', imageUrl: 'https://picsum.photos/seed/sd5/400/300', imageHint: 'hellkite dragon' },
    { id: 'starter-dspell-1', theme: 'fantasy', name: 'ドラゴンの財宝', manaCost: 3, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたのマナプールに好きな色のマナを3点加える。', flavorText: '山積みの金貨よりも、一滴のマナを。', imageUrl: 'https://picsum.photos/seed/sds1/400/300', imageHint: 'dragon treasure' },
    { id: 'starter-dspell-1-2', theme: 'fantasy', name: 'ドラゴンの財宝', manaCost: 3, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたのマナプールに好きな色のマナを3点加える。', flavorText: '山積みの金貨よりも、一滴のマナを。', imageUrl: 'https://picsum.photos/seed/sds1/400/300', imageHint: 'dragon treasure' },
    { id: 'starter-dspell-2', theme: 'fantasy', name: 'ドラゴンの息吹', manaCost: 4, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'すべての相手クリーチャーに3ダメージを与える。', flavorText: '一息で、戦況を覆す。', imageUrl: 'https://picsum.photos/seed/sds2/400/300', imageHint: 'dragon breath' },
    { id: 'starter-dspell-2-2', theme: 'fantasy', name: 'ドラゴンの息吹', manaCost: 4, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'すべての相手クリーチャーに3ダメージを与える。', flavorText: '一息で、戦況を覆す。', imageUrl: 'https://picsum.photos/seed/sds2/400/300', imageHint: 'dragon breath' },
    { id: 'starter-dspell-3', theme: 'fantasy', name: 'マナの探求', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'あなたの山札から基本土地カードを2枚探し、手札に加える。', flavorText: '大いなる力の源を求めて。', imageUrl: 'https://picsum.photos/seed/sds3/400/300', imageHint: 'mana search' },
    { id: 'starter-dspell-3-2', theme: 'fantasy', name: 'マナの探求', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'あなたの山札から基本土地カードを2枚探し、手札に加える。', flavorText: '大いなる力の源を求めて。', imageUrl: 'https://picsum.photos/seed/sds3/400/300', imageHint: 'mana search' },
    { id: 'starter-dspell-4', theme: 'fantasy', name: 'ドラゴンの怒り', manaCost: 5, attack: 0, defense: 0, cardType: 'spell', rarity: 'rare', abilities: '相手プレイヤーに7ダメージを与える。', flavorText: '天を揺るがす、王の咆哮。', imageUrl: 'https://picsum.photos/seed/sds4/400/300', imageHint: 'dragon fury' },
    { id: 'starter-dspell-5', theme: 'fantasy', name: '鱗の鎧', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたのクリーチャー1体は、ターン終了時まで+2/+2の修正を受ける。', flavorText: '鋼鉄よりも硬く、炎よりも熱い。', imageUrl: 'https://picsum.photos/seed/sds5/400/300', imageHint: 'scale armor' },
    { id: 'starter-dspell-5-2', theme: 'fantasy', name: '鱗の鎧', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたのクリーチャー1体は、ターン終了時まで+2/+2の修正を受ける。', flavorText: '鋼鉄よりも硬く、炎よりも熱い。', imageUrl: 'https://picsum.photos/seed/sds5/400/300', imageHint: 'scale armor' },
];

export const ninjaDeck: CardData[] = [
    { id: 'starter-ninja-1', theme: 'fantasy', name: '下忍', manaCost: 1, attack: 1, defense: 1, cardType: 'creature', rarity: 'common', abilities: '速攻', flavorText: '影に生まれ、影に死す。', imageUrl: 'https://picsum.photos/seed/sn1/400/300', imageHint: 'low-rank ninja' },
    { id: 'starter-ninja-1-2', theme: 'fantasy', name: '下忍', manaCost: 1, attack: 1, defense: 1, cardType: 'creature', rarity: 'common', abilities: '速攻', flavorText: '影に生まれ、影に死す。', imageUrl: 'https://picsum.photos/seed/sn1/400/300', imageHint: 'low-rank ninja' },
    { id: 'starter-ninja-2', theme: 'fantasy', name: 'くノ一', manaCost: 2, attack: 2, defense: 1, cardType: 'creature', rarity: 'common', abilities: 'このクリーチャーはブロックされない。', flavorText: '美しき花には、猛毒がある。', imageUrl: 'https://picsum.photos/seed/sn2/400/300', imageHint: 'female ninja' },
    { id: 'starter-ninja-2-2', theme: 'fantasy', name: 'くノ一', manaCost: 2, attack: 2, defense: 1, cardType: 'creature', rarity: 'common', abilities: 'このクリーチャーはブロックされない。', flavorText: '美しき花には、猛毒がある。', imageUrl: 'https://picsum.photos/seed/sn2/400/300', imageHint: 'female ninja' },
    { id: 'starter-ninja-3', theme: 'fantasy', name: '中忍', manaCost: 3, attack: 3, defense: 2, cardType: 'creature', rarity: 'uncommon', abilities: '戦場に出た時、相手のクリーチャー1体を手札に戻す。', flavorText: '任務遂行の、邪魔はさせない。', imageUrl: 'https://picsum.photos/seed/sn3/400/300', imageHint: 'mid-rank ninja' },
    { id: 'starter-ninja-3-2', theme: 'fantasy', name: '中忍', manaCost: 3, attack: 3, defense: 2, cardType: 'creature', rarity: 'uncommon', abilities: '戦場に出た時、相手のクリーチャー1体を手札に戻す。', flavorText: '任務遂行の、邪魔はさせない。', imageUrl: 'https://picsum.photos/seed/sn3/400/300', imageHint: 'mid-rank ninja' },
    { id: 'starter-ninja-4', theme: 'fantasy', name: '上忍', manaCost: 5, attack: 4, defense: 4, cardType: 'creature', rarity: 'rare', abilities: 'このクリーチャーがプレイヤーにダメージを与えた時、カードを2枚引く。', flavorText: '一撃必殺。', imageUrl: 'https://picsum.photos/seed/sn4/400/300', imageHint: 'high-rank ninja' },
    { id: 'starter-ninja-4-2', theme: 'fantasy', name: '上忍', manaCost: 5, attack: 4, defense: 4, cardType: 'creature', rarity: 'rare', abilities: 'このクリーチャーがプレイヤーにダメージを与えた時、カードを2枚引く。', flavorText: '一撃必殺。', imageUrl: 'https://picsum.photos/seed/sn4/400/300', imageHint: 'high-rank ninja' },
    { id: 'starter-ninja-5', theme: 'fantasy', name: '頭領', manaCost: 7, attack: 6, defense: 6, cardType: 'creature', rarity: 'mythic', abilities: '忍術(あなたの他の攻撃クリーチャーと入れ替わる)、戦場に出た時、このターン、あなたは追加の攻撃フェイズを得る。', flavorText: '影の軍勢を率いる、最強の忍。', imageUrl: 'https://picsum.photos/seed/sn5/400/300', imageHint: 'ninja leader' },
    { id: 'starter-nspell-1', theme: 'fantasy', name: '煙玉', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'あなたのクリーチャー1体は、ターン終了時までブロックされない。', flavorText: '見えなければ、防ぎようがない。', imageUrl: 'https://picsum.photos/seed/sns1/400/300', imageHint: 'smoke bomb' },
    { id: 'starter-nspell-1-2', theme: 'fantasy', name: '煙玉', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'あなたのクリーチャー1体は、ターン終了時までブロックされない。', flavorText: '見えなければ、防ぎようがない。', imageUrl: 'https://picsum.photos/seed/sns1/400/300', imageHint: 'smoke bomb' },
    { id: 'starter-nspell-2', theme: 'fantasy', name: '変わり身の術', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたのクリーチャー1体を破壊の対象から守る。', flavorText: 'そこにいたはずの者は、もういない。', imageUrl: 'https://picsum.photos/seed/sns2/400/300', imageHint: 'substitution jutsu' },
    { id: 'starter-nspell-2-2', theme: 'fantasy', name: '変わり身の術', manaCost: 2, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたのクリーチャー1体を破壊の対象から守る。', flavorText: 'そこにいたはずの者は、もういない。', imageUrl: 'https://picsum.photos/seed/sns2/400/300', imageHint: 'substitution jutsu' },
    { id: 'starter-nspell-3', theme: 'fantasy', name: '暗殺', manaCost: 3, attack: 0, defense: 0, cardType: 'spell', rarity: 'rare', abilities: 'タップ状態のクリーチャー1体を破壊する。', flavorText: '無防備な者に、慈悲はない。', imageUrl: 'https://picsum.photos/seed/sns3/400/300', imageHint: 'assassination' },
    { id: 'starter-nspell-4', theme: 'fantasy', name: '影分身の術', manaCost: 4, attack: 0, defense: 0, cardType: 'spell', rarity: 'uncommon', abilities: 'あなたのクリーチャー1体のコピー・トークンを2体生成する。それらはターン終了時に消える。', flavorText: 'どれが本物か、見破れるかな？', imageUrl: 'https://picsum.photos/seed/sns4/400/300', imageHint: 'shadow clone' },
    { id: 'starter-nspell-5', theme: 'fantasy', name: '毒の刃', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に-1/-1のカウンターを置く。', flavorText: '遅効性の毒が、確実に命を蝕む。', imageUrl: 'https://picsum.photos/seed/sns5/400/300', imageHint: 'poison blade' },
    { id: 'starter-nspell-5-2', theme: 'fantasy', name: '毒の刃', manaCost: 1, attack: 0, defense: 0, cardType: 'spell', rarity: 'common', abilities: 'クリーチャー1体に-1/-1のカウンターを置く。', flavorText: '遅効性の毒が、確実に命を蝕む。', imageUrl: 'https://picsum.photos/seed/sns5/400/300', imageHint: 'poison blade' },
];


export default function BattlePage() {
    const { toast } = useToast();
    const { addCurrency, spendCurrency } = useCurrency();
    const { addWin, addLoss } = useStats();
    const [isClient, setIsClient] = useState(false);
    const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [deckChoice, setDeckChoice] = useState<string | null>(null);
    const [savedDecks, setSavedDecks] = useState<Deck[]>([]);
    const [cardBackImage, setCardBackImage] = useState<string | null>(null);

    // Game State
    const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
    const [playerHand, setPlayerHand] = useState<CardData[]>([]);
    const [playerBoard, setPlayerBoard] = useState<CardData[]>([]);
    const [playerHealth, setPlayerHealth] = useState(20);
    const [playerMana, setPlayerMana] = useState(1);
    const [playerMaxMana, setPlayerMaxMana] = useState(1);
    
    const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
    const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
    const [opponentBoard, setOpponentBoard] = useState<CardData[]>([]);
    const [opponentHealth, setOpponentHealth] = useState(20);
    const [opponentMana, setOpponentMana] = useState(1);
    const [opponentMaxMana, setOpponentMaxMana] = useState(1);
    
    const [turn, setTurn] = useState(1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [gameLog, setGameLog] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState('');
    const [gamePhase, setGamePhase] = useState<'main' | 'attack'>('main');

    const shuffleDeck = (deck: CardData[]) => {
        if (!isClient) return deck;
        return [...deck].sort(() => Math.random() - 0.5);
    }

    const addToLog = (message: string) => {
        setGameLog(prev => [`[T${Math.ceil(turn/2)}] ${message}`, ...prev]);
    }

    const startGame = (playerDeckData: CardData[], opponentDeckData: CardData[]) => {
        const pDeck = shuffleDeck([...playerDeckData]);
        const oDeck = shuffleDeck([...opponentDeckData]);

        const initialPlayerHand = pDeck.splice(0, HAND_LIMIT);
        const initialOpponentHand = oDeck.splice(0, HAND_LIMIT);

        setPlayerDeck(pDeck);
        setPlayerHand(initialPlayerHand);
        setPlayerBoard([]);
        setPlayerHealth(20);
        setPlayerMana(1);
        setPlayerMaxMana(1);

        setOpponentDeck(oDeck);
        setOpponentHand(initialOpponentHand);
        setOpponentBoard([]);
        setOpponentHealth(20);
        setOpponentMana(1);
        setOpponentMaxMana(1);

        setTurn(1);
        setIsPlayerTurn(true);
        setGamePhase('main');
        setGameOver('');
        setGameLog([`--- ターン 1: あなたのターン ---`, 'ゲーム開始！']);
    };
    
    const loadAndSetPlayerDeck = async (choice: string) => {
        setIsGeneratingDeck(true);
        addToLog('対戦の準備をしています...');
        let deckToLoad: CardData[] = [];
        let toastMessage = '';

        try {
            if (choice === 'starter-goblin') {
                deckToLoad = goblinDeck;
                toastMessage = 'スターターデッキ「ゴブリン軍団」で開始します。';
            } else if (choice === 'starter-elemental') {
                deckToLoad = elementalDeck;
                toastMessage = 'スターターデッキ「エレメンタル召喚」で開始します。';
            } else if (choice === 'starter-undead') {
                deckToLoad = undeadDeck;
                toastMessage = 'スターターデッキ「アンデッド軍団」で開始します。';
            } else if (choice === 'starter-dragon') {
                deckToLoad = dragonDeck;
                toastMessage = 'スターターデッキ「ドラゴンズ・ホード」で開始します。';
            } else if (choice === 'starter-ninja') {
                deckToLoad = ninjaDeck;
                toastMessage = 'スターターデッキ「ニンジャ一族」で開始します。';
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
            } else { // Handle saved decks
                const selectedDeck = savedDecks.find(d => d.id === choice);
                if (selectedDeck && selectedDeck.cards.length === DECK_SIZE) {
                    deckToLoad = selectedDeck.cards;
                    toastMessage = `デッキ「${selectedDeck.name}」で開始します。`;
                } else if (savedDecks.length > 0) {
                    deckToLoad = savedDecks[0].cards;
                    toastMessage = `選択したデッキが不正です。保存された最初のデッキ「${savedDecks[0].name}」で開始します。`;
                } else {
                    deckToLoad = goblinDeck; // Fallback
                    toastMessage = '保存されたデッキが見つかりません。ゴブリンデッキで開始します。';
                }
            }
            
            const aiDeck = await createAiDeck(deckToLoad);
            
            toast({ title: toastMessage });
            startGame(deckToLoad, aiDeck);

        } catch (error) {
            console.error("Failed to prepare player deck", error);
            toast({ variant: 'destructive', title: 'デッキの準備に失敗しました。'});
            const fallbackAiDeck = await createAiDeck(goblinDeck);
            startGame(goblinDeck, fallbackAiDeck);
        } finally {
            setIsGeneratingDeck(false);
        }
    };
    
    const createAiDeck = async (playerDeckData: CardData[]): Promise<CardData[]> => {
        addToLog('AIが対戦相手のデッキを準備しています...');
        try {
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
            return elementalDeck; // Fallback
        }
    };

    useEffect(() => {
        setIsClient(true);
        try {
            const decksFromStorage: Deck[] = JSON.parse(localStorage.getItem('decks') || '[]');
            setSavedDecks(decksFromStorage);
            
            const savedCardBack = localStorage.getItem('cardBackImage');
            if (savedCardBack) {
                setCardBackImage(savedCardBack);
            }
        } catch (error) {
            console.error("Failed to check for saved data", error);
        }
    }, []);

    const handleSelectDeck = (choice: string) => {
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

    const applySpellEffect = (card: CardData, isCasterPlayer: boolean) => {
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
    };

    const handleEndGame = (result: 'win' | 'loss') => {
        if (!difficulty) return;
    
        const isBeginner = difficulty === 'beginner';
        const winReward = isBeginner ? BEGINNER_WIN_REWARD : ADVANCED_WIN_REWARD;
        const losePenalty = isBeginner ? BEGINNER_LOSE_PENALTY : ADVANCED_LOSE_PENALTY;
    
        if (result === 'win') {
          setGameOver('あなたの勝利！');
          addToLog('ゲーム終了！あなたが勝利しました。');
          addCurrency(winReward);
          addWin();
          toast({
            title: '勝利！',
            description: `${winReward}G獲得しました！`,
          });
        } else {
          setGameOver('相手の勝利！');
          addToLog('ゲーム終了！相手が勝利しました。');
          spendCurrency(losePenalty);
          addLoss();
          toast({
            title: '敗北...',
            description: `${losePenalty}G失いました。`,
            variant: 'destructive',
          });
        }
      };

    useEffect(() => {
        if (gameOver) return;

        if (playerHealth <= 0) {
            handleEndGame('loss');
        } else if (opponentHealth <= 0) {
            handleEndGame('win');
        }
    }, [playerHealth, opponentHealth, gameOver]);

    const playCard = (card: CardData, cardIndex: number) => {
        if (!isPlayerTurn || gameOver || gamePhase !== 'main') return;
        if (playerMana < card.manaCost) {
            toast({ variant: 'destructive', title: 'マナが足りません！'});
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
    };

    const endTurn = () => {
        if (!isPlayerTurn || gameOver) return;
        addToLog('あなたがターンを終了。');
        setIsPlayerTurn(false);
        setGamePhase('main'); // Reset phase for AI
        setTimeout(aiTurn, 1000);
    };
    
    const aiChooseCard = (hand: CardData[], mana: number, myBoard: CardData[]): CardData | null => {
        let playableCards = hand.filter(c => c.manaCost <= mana);

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
        if (creatureCards.length > 0 && myBoard.length < BOARD_LIMIT) {
             const bestCreature = creatureCards.reduce((best, current) => {
                const bestScore = (best.attack + best.defense) / (best.manaCost + 1);
                const currentScore = (current.attack + current.defense) / (current.manaCost + 1);
                return currentScore > bestScore ? current : best;
            });
            return bestCreature;
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
            return spellCards.sort((a,b) => b.manaCost - a.manaCost)[0];
        }

        return playableCards.sort((a,b) => b.manaCost - a.manaCost)[0] ?? null;
    }

    const aiTurn = () => {
        if (gameOver) return;

        const nextTurn = turn + 1;
        setTurn(nextTurn);
        addToLog(`--- ターン ${Math.ceil(nextTurn/2)}: 相手のターン ---`);

        const newOpponentMaxMana = Math.min(MAX_MANA, opponentMaxMana + 1);
        setOpponentMaxMana(newOpponentMaxMana);
        setOpponentMana(newOpponentMaxMana);
        setOpponentBoard(prev => prev.map(c => ({ ...c, canAttack: true })));
        
        drawCard(false);

        let tempHand = [...opponentHand];
        let tempMana = newOpponentMaxMana;
        let tempBoard = [...opponentBoard];

        // AI Main Phase
        setTimeout(() => {
            const playCardLoop = () => {
                const cardToPlay = aiChooseCard(tempHand, tempMana, tempBoard);

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
                        applySpellEffect(cardToPlay, false);
                    }
                    setTimeout(playCardLoop, 1500);
                } else {
                     setTimeout(aiAttackPhase, 1000);
                }
            };
            playCardLoop();
        }, 1000);
        
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
            setIsPlayerTurn(true);
            setGamePhase('main');
            
            addToLog(`--- ターン ${Math.ceil(turn/2)+1}: あなたのターン ---`);
            drawCard(true);
        }
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
                            <Bot className="mr-2" /> 初級 (+{BEGINNER_WIN_REWARD}G / -{BEGINNER_LOSE_PENALTY}G)
                        </Button>
                        <Button onClick={() => setDifficulty('advanced')} size="lg">
                           <BrainCircuit className="mr-2" /> 上級 (+{ADVANCED_WIN_REWARD}G / -{ADVANCED_LOSE_PENALTY}G)
                        </Button>
                    </CardContent>
                </Card>
            </main>
        )
    }

    if (difficulty && !deckChoice) {
        const validDecks = savedDecks.filter(d => d.cards.length === DECK_SIZE);
        return (
             <main className="text-center p-10">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle className="text-2xl">使用するデッキを選択してください</CardTitle>
                        <CardDescription>
                            難易度: {difficulty === 'beginner' ? '初級' : '上級'}
                            <Button variant="link" onClick={() => setDifficulty(null)}>変更</Button>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {validDecks.length > 0 && (
                            <div className="md:col-span-2 space-y-2">
                                <p className="font-semibold text-left">保存したデッキ</p>
                                <Select onValueChange={(deckId) => handleSelectDeck(deckId)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="保存したデッキを選択..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {validDecks.map(deck => (
                                            <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button onClick={() => handleSelectDeck('starter-goblin')} size="lg" className="h-20">
                            <Group className="mr-2" />
                            <div>
                                <p>ゴブリン軍団</p>
                                <p className="text-sm font-normal">（速攻タイプ）</p>
                            </div>
                        </Button>
                         <Button onClick={() => handleSelectDeck('starter-elemental')} size="lg" className="h-20">
                            <Group className="mr-2" />
                            <div>
                                <p>エレメンタル召喚</p>
                                <p className="text-sm font-normal">（コントロールタイプ）</p>
                            </div>
                        </Button>
                        <Button onClick={() => handleSelectDeck('starter-undead')} size="lg" className="h-20">
                            <Group className="mr-2" />
                            <div>
                                <p>アンデッド軍団</p>
                                <p className="text-sm font-normal">（物量タイプ）</p>
                            </div>
                        </Button>
                        <Button onClick={() => handleSelectDeck('starter-dragon')} size="lg" className="h-20">
                            <Group className="mr-2" />
                            <div>
                                <p>ドラゴンズ・ホード</p>
                                <p className="text-sm font-normal">（重量級タイプ）</p>
                            </div>
                        </Button>
                        <Button onClick={() => handleSelectDeck('starter-ninja')} size="lg" className="h-20">
                            <Group className="mr-2" />
                            <div>
                                <p>ニンジャ一族</p>
                                <p className="text-sm font-normal">（奇襲タイプ）</p>
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


    const winReward = difficulty === 'beginner' ? BEGINNER_WIN_REWARD : ADVANCED_WIN_REWARD;
    const losePenalty = difficulty === 'beginner' ? BEGINNER_LOSE_PENALTY : ADVANCED_LOSE_PENALTY;

    return (
    <main
        className="flex flex-col gap-2 min-h-screen bg-cover bg-center bg-fixed p-4"
        style={{ backgroundImage: "url('https://picsum.photos/seed/battleground/1920/1080')" }}
    >
        <div className="absolute inset-0 bg-black/30 z-0"></div>
        <div className="relative z-10 flex flex-col gap-2 flex-grow">
        {/* Opponent's Area */}
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
                <Card className="p-2 text-center w-40 bg-black/70 text-white border-slate-700">
                    <p className="font-bold">相手 ({difficulty === 'beginner' ? '初級' : '上級'})</p>
                    <p className="flex items-center justify-center gap-2 text-red-400 font-bold text-xl"><Heart /> {opponentHealth}</p>
                    <p className="flex items-center justify-center gap-2 text-blue-400 font-bold"><Dices /> {opponentMana}/{opponentMaxMana}</p>
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
                <Card className="p-2 text-center w-28 bg-black/70 text-white border-slate-700">
                     <p className="font-bold">山札</p>
                     <p className="text-2xl">{opponentDeck.length}</p>
                </Card>
            </div>
            {/* Opponent's Board */}
            <div className="flex items-center justify-center gap-2 bg-black/40 p-2 rounded-lg min-h-[160px] w-full max-w-4xl border border-slate-700">
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
                 <Card className="p-6 my-4 max-w-2xl text-center bg-yellow-200/90 text-slate-800">
                    <p className="text-2xl font-semibold mb-2">{gameOver}</p>
                    {gameOver === 'あなたの勝利！' ? (
                        <p className="flex items-center justify-center gap-2 text-lg font-medium text-yellow-700 mb-4">
                            <Coins className="h-6 w-6" /> +{winReward}G
                        </p>
                    ) : (
                        <p className="flex items-center justify-center gap-2 text-lg font-medium text-red-600 mb-4">
                            <Coins className="h-6 w-6" /> -{losePenalty}G
                        </p>
                    )}
                    <Button onClick={resetGame}>
                        <RotateCcw className="mr-2" />
                        難易度選択に戻る
                    </Button>
                </Card>
            ) : (
                <Card className="p-2 w-full max-w-lg h-24 overflow-y-auto text-sm bg-black/70 text-white border-slate-700">
                   {gameLog.map((log, i) => <p key={i}>{log}</p>)}
                </Card>
            )}
        </div>
        
        {/* Player's Board */}
         <div className="flex items-center justify-center gap-2 bg-black/40 p-2 rounded-lg min-h-[160px] w-full max-w-4xl mx-auto border border-slate-700">
            {playerBoard.map((card, i) => (
                <div key={card.id + i.toString()} className={cn("w-[110px] transform transition-transform", card.canAttack ? "border-4 border-green-500 rounded-2xl hover:scale-105" : "opacity-70")}>
                    <CardPreview {...card} />
                </div>
            ))}
        </div>

        {/* Player's Area */}
        <div className="flex flex-col items-center gap-2 mt-2">
            <div className="flex items-center gap-4">
                <Card className="p-2 text-center w-40 bg-black/70 text-white border-slate-700">
                    <p className="font-bold">あなた</p>
                    <p className="flex items-center justify-center gap-2 text-red-400 font-bold text-xl"><Heart /> {playerHealth}</p>
                    <p className="flex items-center justify-center gap-2 text-blue-400 font-bold"><Dices /> {playerMana}/{playerMaxMana}</p>
                    <p className="mt-2 text-sm">ターン: {Math.ceil(turn/2)}</p>
                </Card>
                <div className="flex gap-2 min-h-[180px]">
                    {playerHand.map((card, i) => (
                        <div key={card.id + i.toString()} className={cn("w-[130px] transition-transform", (isPlayerTurn && gamePhase === 'main' && playerMana >= card.manaCost) ? "cursor-pointer hover:scale-105 hover:-translate-y-2" : "opacity-70" )} onClick={() => playCard(card, i)}>
                           <CardPreview {...card} />
                        </div>
                    ))}
                </div>
                 <Card className="p-2 text-center w-28 bg-black/70 text-white border-slate-700">
                     <p className="font-bold">山札</p>
                     <p className="text-2xl">{playerDeck.length}</p>
                </Card>
            </div>
            <Button onClick={handleAttackPhase} size="lg" disabled={!isPlayerTurn || !!gameOver || gamePhase !== 'main'} className="mt-4">
                攻撃フェーズへ
            </Button>
        </div>
        </div>
    </main>
  );
}
