import type { CardData, CardSchema } from '@/components/card-editor';

export type Difficulty = 'beginner' | 'advanced' | 'super';


export interface GameRules {
    playerHealth?: number;
    opponentHealth?: number;
    boardLimit?: number;
    disallowedCardTypes?: (CardData['cardType'])[];
    stageId?: string;
    reward?: number;
}

export interface BattleProps {
  initialPlayerDeck?: CardData[];
  initialOpponentDeck?: CardData[];
  forcedDifficulty?: Difficulty;
  onGameEnd?: (result: 'win' | 'loss') => void;
  gameRules?: GameRules;
}
