import type { CardData } from '@/components/card-editor';

export type Difficulty = 'beginner' | 'advanced' | 'super';

export interface GameRules {
    playerHealth?: number;
    opponentHealth?: number;
    boardLimit?: number;
    landLimit?: number;
    disallowedCardTypes?: (CardData['cardType'])[];
}

export interface BattleProps {
  initialPlayerDeck?: CardData[];
  initialOpponentDeck?: CardData[];
  forcedDifficulty?: Difficulty;
  onGameEnd?: (result: 'win' | 'loss') => void;
  gameRules?: GameRules;
}
