import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Card, GameState, PlayerType, Suit, Rank, GameStatus } from './types';
import { createDeck, shuffleDeck, dealCards } from './utils/deck';
import { Card as CardComponent } from './components/Card';
import { Hand } from './components/Hand';
import { SuitSelector } from './components/SuitSelector';
import { RefreshCw, Trophy, Frown, Play, Dices, BookOpen, X } from 'lucide-react';
import clsx from 'clsx';

const AI_DELAY = 1000;

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentTurn: 'player',
    currentSuit: null,
    status: 'start', // Start in 'start' state
    winner: null,
    isSuitSelectorOpen: false,
  });

  const [message, setMessage] = useState<string>('');
  const [showRules, setShowRules] = useState(false);

  // Initialize Game
  const startNewGame = useCallback(() => {
    const newDeck = shuffleDeck(createDeck());
    const { hand: playerHand, remainingDeck: deckAfterPlayer } = dealCards(newDeck, 8);
    const { hand: aiHand, remainingDeck: deckAfterAI } = dealCards(deckAfterPlayer, 8);
    
    // Draw first card for discard pile
    const firstDiscard = deckAfterAI[0];
    const finalDeck = deckAfterAI.slice(1);

    setGameState({
      deck: finalDeck,
      discardPile: [firstDiscard],
      playerHand,
      aiHand,
      currentTurn: 'player',
      currentSuit: firstDiscard.suit,
      status: 'playing',
      winner: null,
      isSuitSelectorOpen: false,
    });
    setMessage('Your turn!');
  }, []);

  // Check for winner
  useEffect(() => {
    // Only check for winner if we are actually playing
    if (gameState.status !== 'playing') return;

    // Ensure hands are not empty because of initialization (though status check handles this now)
    if (gameState.playerHand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'won', winner: 'player' }));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setMessage('You won!');
    } else if (gameState.aiHand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'lost', winner: 'ai' }));
      setMessage('AI won!');
    }
  }, [gameState.playerHand.length, gameState.aiHand.length, gameState.status]);

  // Helper: Check if move is valid
  const isValidMove = (card: Card, topCard: Card, currentSuit: Suit | null): boolean => {
    if (card.rank === '8') return true; // 8 is always valid
    if (card.suit === currentSuit) return true; // Match current suit (which might be set by an 8)
    if (card.rank === topCard.rank) return true; // Match rank
    return false;
  };

  // Helper: Draw card
  const drawCard = (player: PlayerType) => {
    setGameState(prev => {
      let { deck, discardPile } = prev;
      
      // Reshuffle if deck is empty
      if (deck.length === 0) {
        if (discardPile.length <= 1) {
          // No cards to draw, skip turn
          setMessage(`${player === 'player' ? 'You' : 'AI'} skipped turn (no cards)`);
          return {
            ...prev,
            currentTurn: player === 'player' ? 'ai' : 'player',
          };
        }
        
        const topDiscard = discardPile[discardPile.length - 1];
        const cardsToShuffle = discardPile.slice(0, discardPile.length - 1);
        deck = shuffleDeck(cardsToShuffle);
        discardPile = [topDiscard];
        setMessage('Deck reshuffled!');
      }

      const newCard = deck[0];
      const newDeck = deck.slice(1);
      
      const newHand = player === 'player' 
        ? [...prev.playerHand, newCard]
        : [...prev.aiHand, newCard];

      return {
        ...prev,
        deck: newDeck,
        discardPile,
        playerHand: player === 'player' ? newHand : prev.playerHand,
        aiHand: player === 'ai' ? newHand : prev.aiHand,
      };
    });
  };

  // Player Action: Play Card
  const handlePlayerCardClick = (card: Card) => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    
    if (isValidMove(card, topCard, gameState.currentSuit)) {
      if (card.rank === '8') {
        // Play 8, open suit selector
        setGameState(prev => ({
          ...prev,
          playerHand: prev.playerHand.filter(c => c.id !== card.id),
          discardPile: [...prev.discardPile, card],
          isSuitSelectorOpen: true,
          currentSuit: card.suit, // Temporarily set to card suit, will be updated by selector
        }));
      } else {
        // Normal play
        setGameState(prev => ({
          ...prev,
          playerHand: prev.playerHand.filter(c => c.id !== card.id),
          discardPile: [...prev.discardPile, card],
          currentTurn: 'ai',
          currentSuit: card.suit,
        }));
        setMessage('AI turn...');
      }
    } else {
      setMessage('Invalid move!');
      setTimeout(() => setMessage('Your turn!'), 1000);
    }
  };

  // Player Action: Suit Selected (for 8)
  const handleSuitSelect = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      currentSuit: suit,
      isSuitSelectorOpen: false,
      currentTurn: 'ai',
    }));
    setMessage(`Suit changed to ${suit}. AI turn...`);
  };

  // Player Action: Draw
  const handlePlayerDraw = () => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;
    drawCard('player');
  };

  // AI Logic
  useEffect(() => {
    if (gameState.currentTurn !== 'ai' || gameState.status !== 'playing') return;

    const timer = setTimeout(() => {
      const { aiHand, discardPile, currentSuit } = gameState;
      const topCard = discardPile[discardPile.length - 1];

      // Find valid moves
      const validMoves = aiHand.filter(card => isValidMove(card, topCard, currentSuit));
      
      // Strategy:
      // 1. Play non-8 matching card (prioritize rank match to save suit? or just random)
      // 2. Play 8 if no other options
      // 3. Draw if no options

      const nonEights = validMoves.filter(c => c.rank !== '8');
      const eights = validMoves.filter(c => c.rank === '8');

      if (nonEights.length > 0) {
        // Play first valid non-8
        const cardToPlay = nonEights[0];
        setGameState(prev => ({
          ...prev,
          aiHand: prev.aiHand.filter(c => c.id !== cardToPlay.id),
          discardPile: [...prev.discardPile, cardToPlay],
          currentTurn: 'player',
          currentSuit: cardToPlay.suit,
        }));
        setMessage('Your turn!');
      } else if (eights.length > 0) {
        // Play 8
        const cardToPlay = eights[0];
        // Choose suit: the one AI has most of
        const suitCounts = aiHand.reduce((acc, c) => {
          if (c.id !== cardToPlay.id) {
            acc[c.suit] = (acc[c.suit] || 0) + 1;
          }
          return acc;
        }, {} as Record<Suit, number>);
        
        const bestSuit = (Object.keys(suitCounts) as Suit[]).reduce((a, b) => suitCounts[a] > suitCounts[b] ? a : b, 'hearts' as Suit);

        setGameState(prev => ({
          ...prev,
          aiHand: prev.aiHand.filter(c => c.id !== cardToPlay.id),
          discardPile: [...prev.discardPile, cardToPlay],
          currentTurn: 'player',
          currentSuit: bestSuit,
        }));
        setMessage(`AI played 8 and chose ${bestSuit}. Your turn!`);
      } else {
        // Draw
        drawCard('ai');
      }
    }, AI_DELAY);

    return () => clearTimeout(timer);
  }, [gameState.currentTurn, gameState.status, gameState.aiHand, gameState.discardPile, gameState.currentSuit]); // Dependencies for AI turn

  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-green-800 text-white font-sans overflow-hidden flex flex-col items-center justify-between py-4 relative">
      {/* Header / Status */}
      <div className="w-full max-w-4xl px-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
           <div className="bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
             <span className="text-sm font-medium opacity-80">AI Cards:</span>
             <span className="ml-2 text-xl font-bold">{gameState.aiHand.length}</span>
           </div>
        </div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold tracking-wider text-green-100 drop-shadow-md">CRAZY EIGHTS</h1>
          <div className="mt-1 px-4 py-1 bg-white/10 rounded-full text-sm font-medium animate-pulse">
            {message}
          </div>
        </div>

        <button 
          onClick={startNewGame}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="Restart Game"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* AI Hand (Face Down) */}
      <div className="w-full max-w-5xl -mt-8 z-10">
        <Hand 
          cards={gameState.aiHand.map(c => ({ ...c, isFaceUp: false }))} 
          isPlayer={false} 
        />
      </div>

      {/* Game Board (Deck & Discard) */}
      <div className="flex-1 flex items-center justify-center gap-8 md:gap-16 w-full relative z-10">
        {/* Draw Pile */}
        <div className="relative group">
          {gameState.deck.length > 0 ? (
            <div 
              onClick={handlePlayerDraw}
              className={clsx(
                "relative w-32 h-48 rounded-xl shadow-2xl cursor-pointer transition-transform hover:scale-105 active:scale-95",
                gameState.currentTurn === 'player' ? 'ring-4 ring-yellow-400/50' : ''
              )}
            >
              {/* Stack effect */}
              <div className="absolute top-1 left-1 w-full h-full bg-blue-900 rounded-xl border border-blue-400/20" />
              <div className="absolute top-0.5 left-0.5 w-full h-full bg-blue-800 rounded-xl border border-blue-400/20" />
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl border-2 border-white/20 flex items-center justify-center">
                <div className="w-24 h-40 border-2 border-blue-400/30 rounded-lg opacity-50" />
                <span className="absolute font-bold text-2xl text-white/20">DECK</span>
              </div>
            </div>
          ) : (
             <div className="w-32 h-48 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
               <span className="text-white/20 font-medium">Empty</span>
             </div>
          )}
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium opacity-60">
            {gameState.deck.length} cards
          </span>
        </div>

        {/* Discard Pile */}
        <div className="relative">
          <div className="relative w-32 h-48">
            <AnimatePresence>
              {topDiscardCard && (
                <motion.div
                  key={topDiscardCard.id} // Key by ID to animate new cards
                  initial={{ scale: 1.2, rotate: Math.random() * 20 - 10, y: -50, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
                  className="absolute inset-0"
                >
                  <CardComponent 
                    card={topDiscardCard} 
                    isFaceUp={true} 
                    className="w-32 h-48 shadow-2xl"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Current Suit Indicator (if 8 was played) */}
          {gameState.currentSuit && (
             <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-black/40 p-2 rounded-lg backdrop-blur-md border border-white/10">
               <span className="text-xs uppercase tracking-wider opacity-70">Target</span>
               <div className={clsx(
                 "p-2 rounded-full bg-white shadow-lg",
                 (gameState.currentSuit === 'hearts' || gameState.currentSuit === 'diamonds') ? 'text-red-500' : 'text-black'
               )}>
                 {gameState.currentSuit === 'hearts' && <span className="text-2xl">♥</span>}
                 {gameState.currentSuit === 'diamonds' && <span className="text-2xl">♦</span>}
                 {gameState.currentSuit === 'clubs' && <span className="text-2xl">♣</span>}
                 {gameState.currentSuit === 'spades' && <span className="text-2xl">♠</span>}
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Player Hand */}
      <div className="w-full max-w-6xl px-4 pb-4 z-10">
        <div className="flex justify-between items-end mb-2 px-4">
           <span className="text-sm font-medium opacity-80">Your Hand</span>
           {gameState.currentTurn === 'player' && (
             <span className="text-yellow-300 font-bold animate-bounce">YOUR TURN</span>
           )}
        </div>
        <div className={clsx(
          "bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm transition-colors",
          gameState.currentTurn === 'player' ? 'bg-white/10 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : ''
        )}>
          <Hand 
            cards={gameState.playerHand} 
            isPlayer={true} 
            onCardClick={handlePlayerCardClick}
            disabled={gameState.currentTurn !== 'player'}
          />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {gameState.isSuitSelectorOpen && (
          <SuitSelector onSelect={handleSuitSelect} />
        )}
        
        {gameState.status === 'start' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://picsum.photos/seed/casino/1920/1080?blur=2" 
                alt="Casino Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>

            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="relative z-10 bg-white/95 backdrop-blur-md text-gray-900 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center mx-4 border border-white/20"
            >
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3">
                  <Dices className="w-14 h-14 text-white" />
                </div>
              </div>
              
              <h1 className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight">
                CRAZY<br/>EIGHTS
              </h1>
              <p className="text-gray-600 mb-8 font-medium">
                The classic card shedding game.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={startNewGame}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-purple-600/30"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Start Game
                </button>
                
                <button
                  onClick={() => setShowRules(!showRules)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  {showRules ? 'Hide Rules' : 'How to Play'}
                </button>
              </div>

              <AnimatePresence>
                {showRules && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden text-left mt-4 bg-gray-50 rounded-xl"
                  >
                    <div className="p-4 text-sm text-gray-600 space-y-2">
                      <p><strong>Goal:</strong> Be the first to empty your hand.</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Match the <strong>suit</strong> or <strong>rank</strong> of the top discard card.</li>
                        <li><strong>8s are wild!</strong> Play an 8 anytime to change the suit.</li>
                        <li>If you can't play, draw a card from the deck.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
        
        {gameState.status !== 'playing' && gameState.status !== 'start' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white text-gray-900 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center mx-4"
            >
              {gameState.status === 'won' ? (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-yellow-600">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Victory!</h2>
                  <p className="text-gray-600 mb-6">You cleared your hand first. Great game!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-600">
                    <Frown className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Defeat</h2>
                  <p className="text-gray-600 mb-6">The AI cleared its hand before you.</p>
                </div>
              )}
              
              <button
                onClick={startNewGame}
                className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
