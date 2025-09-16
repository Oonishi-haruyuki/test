
'use client';

import { useState } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Swords } from 'lucide-react';
import { Card } from '@/components/ui/card';

const playerCard: CardData = {
  theme: 'fantasy',
  name: '英雄の騎士',
  manaCost: 3,
  attack: 3,
  defense: 4,
  cardType: 'creature',
  rarity: 'uncommon',
  abilities: '先制攻撃',
  flavorText: '正義のために戦う勇敢な戦士。',
  imageUrl: 'https://picsum.photos/seed/player-card/400/300',
  imageHint: 'knight warrior',
};

const opponentCard: CardData = {
  theme: 'fantasy',
  name: '凶暴なゴブリン',
  manaCost: 2,
  attack: 4,
  defense: 2,
  cardType: 'creature',
  rarity: 'common',
  abilities: '速攻',
  flavorText: '混沌と破壊のために生きる。',
  imageUrl: 'https://picsum.photos/seed/opponent-card/400/300',
  imageHint: 'goblin monster',
};

export default function BattlePage() {
  const [result, setResult] = useState('');

  const handleBattle = () => {
    let battleResult = '';
    if (playerCard.attack >= opponentCard.defense && opponentCard.attack >= playerCard.defense) {
        battleResult = "引き分け！両方のカードが破壊された。";
    } else if (playerCard.attack >= opponentCard.defense) {
        battleResult = 'プレイヤーの勝利！英雄の騎士が凶暴なゴブリンを倒した。';
    } else if (opponentCard.attack >= playerCard.defense) {
        battleResult = '相手の勝利！凶暴なゴブリンが英雄の騎士を倒した。';
    } else {
        battleResult = "膠着状態！どちらのカードも相手を倒せない。";
    }
    setResult(battleResult);
  };

  return (
    <main>
        <div className="flex flex-col items-center gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-4">あなた</h2>
                    <CardPreview {...playerCard} />
                </div>
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-4">相手</h2>
                    <CardPreview {...opponentCard} />
                </div>
            </div>

            <Button onClick={handleBattle} size="lg">
                <Swords className="mr-2" />
                バトル！
            </Button>

            {result && (
                <Card className="p-6 mt-4 max-w-2xl text-center">
                    <p className="text-xl font-semibold">{result}</p>
                </Card>
            )}
        </div>
    </main>
  );
}
