import React from 'react';
import { Card } from './Card';
import { Card as CardType } from '../types';
import { motion } from 'motion/react';

interface HandProps {
  cards: CardType[];
  isPlayer: boolean;
  onCardClick?: (card: CardType) => void;
  disabled?: boolean;
  playableCardIds?: Set<string>;
}

export const Hand: React.FC<HandProps> = ({ cards, isPlayer, onCardClick, disabled, playableCardIds }) => {
  return (
    <div className="flex justify-center items-center gap-2 md:gap-4 overflow-x-auto p-4 min-h-[160px]">
      {cards.map((card, index) => (
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
            isPlayable={isPlayer && playableCardIds?.has(card.id)}
            className={isPlayer ? 'hover:-translate-y-4 transition-transform' : ''}
          />
        </motion.div>
      ))}
    </div>
  );
};
