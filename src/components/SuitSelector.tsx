import React from 'react';
import { Suit } from '../types';
import { Heart, Diamond, Club, Spade } from 'lucide-react';
import { motion } from 'motion/react';

interface SuitSelectorProps {
  onSelect: (suit: Suit) => void;
}

export const SuitSelector: React.FC<SuitSelectorProps> = ({ onSelect }) => {
  const suits: { suit: Suit; icon: React.ReactNode; color: string }[] = [
    { suit: 'hearts', icon: <Heart className="w-8 h-8" />, color: 'bg-red-100 text-red-600 hover:bg-red-200' },
    { suit: 'diamonds', icon: <Diamond className="w-8 h-8" />, color: 'bg-red-100 text-red-600 hover:bg-red-200' },
    { suit: 'clubs', icon: <Club className="w-8 h-8" />, color: 'bg-gray-100 text-black hover:bg-gray-200' },
    { suit: 'spades', icon: <Spade className="w-8 h-8" />, color: 'bg-gray-100 text-black hover:bg-gray-200' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold text-center mb-4">Select a Suit</h2>
        <div className="grid grid-cols-2 gap-4">
          {suits.map(({ suit, icon, color }) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors ${color}`}
            >
              {icon}
              <span className="mt-2 capitalize font-medium">{suit}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
