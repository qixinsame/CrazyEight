import React from 'react';
import { Card } from './Card';
import { Card as CardType } from '../types';
import { motion } from 'motion/react';

interface HandProps {
  cards: CardType[];
  isPlayer: boolean;
  onCardClick?: (card: CardType) => void;
  disabled?: boolean;
  validMoves?: string[]; // Array of card IDs that are valid
}

export const Hand: React.FC<HandProps> = ({ cards, isPlayer, onCardClick, disabled, validMoves = [] }) => {
  return (
    <div className="flex justify-center items-center gap-2 md:gap-4 overflow-x-auto p-4 min-h-[180px] px-8">
      {cards.map((card, index) => {
        const isPlayable = validMoves.includes(card.id);
        return (
          <motion.div
            key={card.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
            style={{ zIndex: index }}
          >
            <Card
              card={card}
              isFaceUp={isPlayer} // AI cards are face down
              onClick={() => onCardClick && onCardClick(card)}
              disabled={disabled}
              isPlayable={isPlayable}
              className={isPlayer ? 'hover:-translate-y-4 transition-transform' : ''}
            />
          </motion.div>
        );
      })}
    </div>
  );
};
