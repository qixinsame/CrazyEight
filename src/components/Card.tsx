import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType, Suit } from '../types';
import { Heart, Diamond, Club, Spade } from 'lucide-react';
import clsx from 'clsx';

interface CardProps {
  card: CardType;
  isFaceUp?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const SuitIcon = ({ suit, className }: { suit: Suit; className?: string }) => {
  switch (suit) {
    case 'hearts':
      return <Heart className={clsx('fill-current', className)} />;
    case 'diamonds':
      return <Diamond className={clsx('fill-current', className)} />;
    case 'clubs':
      return <Club className={clsx('fill-current', className)} />;
    case 'spades':
      return <Spade className={clsx('fill-current', className)} />;
    default:
      return null;
  }
};

export const Card: React.FC<CardProps> = ({ card, isFaceUp = true, onClick, className, disabled, style }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={!disabled && isFaceUp ? { y: -10, scale: 1.05, zIndex: 10 } : {}}
      whileTap={!disabled && isFaceUp ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={clsx(
        'relative w-24 h-36 rounded-xl shadow-md border border-gray-200 select-none cursor-pointer transition-colors',
        isFaceUp ? 'bg-white' : 'bg-blue-600',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={style}
    >
      {isFaceUp ? (
        <div className={clsx('flex flex-col justify-between h-full p-2', isRed ? 'text-red-600' : 'text-black')}>
          <div className="flex flex-col items-center self-start">
            <span className="text-lg font-bold leading-none">{card.rank}</span>
            <SuitIcon suit={card.suit} className="w-4 h-4 mt-1" />
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <SuitIcon suit={card.suit} className="w-12 h-12 opacity-20" />
          </div>

          <div className="flex flex-col items-center self-end rotate-180">
            <span className="text-lg font-bold leading-none">{card.rank}</span>
            <SuitIcon suit={card.suit} className="w-4 h-4 mt-1" />
          </div>
        </div>
      ) : (
        <div className="w-full h-full rounded-xl bg-red-900 border-2 border-white overflow-hidden relative shadow-inner">
             {/* Ornate Pattern Background */}
             <div className="absolute inset-0 opacity-20" style={{
                 backgroundImage: `radial-gradient(circle, #fbbf24 2px, transparent 2.5px), radial-gradient(circle, #fbbf24 2px, transparent 2.5px)`,
                 backgroundSize: '16px 16px',
                 backgroundPosition: '0 0, 8px 8px'
             }} />
             
             {/* Inner Border */}
             <div className="absolute inset-1 border border-yellow-500/50 rounded-lg" />
             <div className="absolute inset-2 border border-yellow-500/30 rounded-md" />
             
             {/* Center Medallion */}
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-14 h-20 bg-red-950 border border-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                     <div className="w-12 h-18 border border-yellow-500/30 rounded-full flex items-center justify-center">
                         <span className="text-yellow-400 font-serif font-bold text-xl tracking-widest drop-shadow-md select-none" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>
                             齐欣
                         </span>
                     </div>
                 </div>
             </div>
        </div>
      )}
    </motion.div>
  );
};
