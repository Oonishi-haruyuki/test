import type { CardSchema, CreatureType, Rarity } from '@/components/card-editor';

const CREATURE_TYPES: CreatureType[] = [
  'human',
  'elf',
  'dwarf',
  'goblin',
  'orc',
  'undead',
  'dragon',
  'beast',
  'elemental',
  'soldier',
  'wizard',
  'spirit',
  'angel',
  'demon',
  'machine',
];

const RARITIES: Rarity[] = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'mythic'];

function rarityByIndex(index: number): Rarity {
  return RARITIES[index % RARITIES.length];
}

function createCreatureCard(theme: string, index: number): CardSchema {
  const creatureType = CREATURE_TYPES[index % CREATURE_TYPES.length];
  const manaCost = 2 + (index % 7);
  const attack = 1 + (index % 6);
  const defense = Math.max(1, attack + ((index % 3) - 1));

  return {
    name: `${theme}の守護者${index + 1}`,
    manaCost,
    attack,
    defense,
    cardType: 'creature',
    creatureType,
    rarity: rarityByIndex(index),
    abilities: '登場時: クリーチャー1体に2ダメージを与える。',
    flavorText: `${theme}の伝承を継ぐ戦士。`,
    imageHint: 'fantasy warrior',
  };
}

function createSpellCard(theme: string, index: number): CardSchema {
  const manaCost = 1 + (index % 6);

  return {
    name: `${theme}の秘術${index + 1}`,
    manaCost,
    attack: 0,
    defense: 0,
    cardType: 'spell',
    creatureType: 'none',
    rarity: rarityByIndex(index + 2),
    abilities: 'クリーチャー1体の攻撃力を+2する。',
    flavorText: `${theme}の力が一瞬だけ戦場を塗り替える。`,
    imageHint: 'magic sigil',
  };
}

export function createMockDeck(theme: string, cardCount: number): CardSchema[] {
  const safeTheme = theme.trim() || '無名';
  return Array.from({ length: cardCount }, (_, index) =>
    index % 2 === 0 ? createCreatureCard(safeTheme, index) : createSpellCard(safeTheme, index)
  );
}
