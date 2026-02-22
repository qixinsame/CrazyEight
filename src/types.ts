export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number; // For sorting if needed, or just logic
}

export type PlayerType = 'player' | 'ai';

export type GameStatus = 'start' | 'playing' | 'won' | 'lost' | 'draw';

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  playerHand: Card[];
  aiHand: Card[];
  currentTurn: PlayerType;
  currentSuit: Suit | null; // The active suit (important after an 8 is played)
  status: GameStatus;
  winner: PlayerType | null;
  isSuitSelectorOpen: boolean;
}
