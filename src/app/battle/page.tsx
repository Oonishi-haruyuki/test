
'use client';

import { useState } from 'react';
import type { CardData } from '@/components/card-editor';
import { CardPreview } from '@/components/card-preview';
import { Button } from '@/components/ui/button';
import { Swords } from 'lucide-react';
import { Card } from '@/components/ui/card';

const playerCard: CardData = {
  theme: 'fantasy',
  name: 'Heroic Knight',
  manaCost: 3,
  attack: 3,
  defense: 4,
  cardType: 'creature',
  rarity: 'uncommon',
  abilities: 'First Strike',
  flavorText: 'A brave warrior who fights for justice.',
  imageUrl: 'https://picsum.photos/seed/player-card/400/300',
  imageHint: 'knight warrior',
};

const opponentCard: CardData = {
  theme: 'fantasy',
  name: 'Vicious Goblin',
  manaCost: 2,
  attack: 4,
  defense: 2,
  cardType: 'creature',
  rarity: 'common',
  abilities: 'Haste',
  flavorText: 'It lives for chaos and destruction.',
  imageUrl: 'https://picsum.photos/seed/opponent-card/400/300',
  imageHint: 'goblin monster',
};

export default function BattlePage() {
  const [result, setResult] = useState('');

  const handleBattle = () => {
    let battleResult = '';
    if (playerCard.attack >= opponentCard.defense && opponentCard.attack >= playerCard.defense) {
        battleResult = "It's a tie! Both cards are destroyed.";
    } else if (playerCard.attack >= opponentCard.defense) {
        battleResult = 'Player wins! The Heroic Knight defeats the Vicious Goblin.';
    } else if (opponentCard.attack >= playerCard.defense) {
        battleResult = 'Opponent wins! The Vicious Goblin defeats the Heroic Knight.';
    } else {
        battleResult = "It's a stalemate! Neither card can defeat the other.";
    }
    setResult(battleResult);
  };

  return (
    <main>
        <div className="flex flex-col items-center gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-4">Player</h2>
                    <CardPreview {...playerCard} />
                </div>
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-bold mb-4">Opponent</h2>
                    <CardPreview {...opponentCard} />
                </div>
            </div>

            <Button onClick={handleBattle} size="lg">
                <Swords className="mr-2" />
                Battle!
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
