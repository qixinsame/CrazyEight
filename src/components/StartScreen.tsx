import React from 'react';
import { motion } from 'motion/react';
import { Play, Club, Diamond, Heart, Spade } from 'lucide-react';
import { Card } from './Card';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 transform -rotate-12"><Heart size={120} /></div>
        <div className="absolute top-20 right-20 transform rotate-45"><Spade size={100} /></div>
        <div className="absolute bottom-20 left-1/4 transform rotate-12"><Diamond size={140} /></div>
        <div className="absolute bottom-10 right-10 transform -rotate-6"><Club size={110} /></div>
      </div>

      {/* Decorative Cards */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
         <motion.div 
            initial={{ x: -200, y: 100, rotate: -30, opacity: 0 }}
            animate={{ x: -120, y: 40, rotate: -15, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute"
         >
            <Card card={{ id: 'd1', suit: 'hearts', rank: '8', value: 8 }} isFaceUp={true} className="w-40 h-56 shadow-2xl" />
         </motion.div>
         <motion.div 
            initial={{ x: 200, y: 100, rotate: 30, opacity: 0 }}
            animate={{ x: 120, y: 40, rotate: 15, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute"
         >
            <Card card={{ id: 'd2', suit: 'spades', rank: 'A', value: 14 }} isFaceUp={true} className="w-40 h-56 shadow-2xl" />
         </motion.div>
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 bg-white/10 backdrop-blur-lg p-12 rounded-3xl border border-white/20 shadow-2xl text-center max-w-lg mx-4"
      >
        <div className="mb-6 inline-block p-4 bg-white rounded-2xl shadow-lg transform -rotate-3">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-blue-600 tracking-tight">
                Crazy Eights
            </h1>
        </div>
        
        <p className="text-green-50 text-lg mb-10 font-medium leading-relaxed">
          The classic card game of strategy and luck.<br/>
          Be the first to empty your hand!
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="group relative w-full py-5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-bold text-2xl shadow-xl shadow-orange-500/30 overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            <Play className="w-8 h-8 fill-current" />
            Play Now
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </motion.button>
        
        <div className="mt-8 text-sm text-green-200/60 font-medium uppercase tracking-widest">
            Single Player vs AI
        </div>
      </motion.div>
    </div>
  );
};
