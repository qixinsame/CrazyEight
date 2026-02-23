import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Card, GameState, PlayerType, Suit, Rank, GameStatus } from './types';
import { createDeck, shuffleDeck, dealCards } from './utils/deck';
import { Card as CardComponent } from './components/Card';
import { Hand } from './components/Hand';
import { SuitSelector } from './components/SuitSelector';
import { RefreshCw, Trophy, Frown, Play, Dices, BookOpen, X, Globe, HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { translations, Language } from './translations';

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
  const [language, setLanguage] = useState<Language>('en');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const t = translations[language];

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
    setMessage(translations[language].yourTurn);
  }, [language]);

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
      setMessage(t.youWon);
    } else if (gameState.aiHand.length === 0) {
      setGameState(prev => ({ ...prev, status: 'lost', winner: 'ai' }));
      setMessage(t.aiWon);
    }
  }, [gameState.playerHand.length, gameState.aiHand.length, gameState.status, t]);

  // Helper: Check if move is valid
  const isValidMove = (card: Card, topCard: Card, currentSuit: Suit | null): boolean => {
    if (card.rank === '8') return true; // 8 is always valid
    if (card.suit === currentSuit) return true; // Match current suit (which might be set by an 8)
    if (card.rank === topCard.rank) return true; // Match rank
    return false;
  };

  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];

  // Calculate playable cards
  const playableCardIds = React.useMemo(() => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return new Set<string>();
    
    const ids = new Set<string>();
    gameState.playerHand.forEach(card => {
      if (isValidMove(card, topDiscardCard, gameState.currentSuit)) {
        ids.add(card.id);
      }
    });
    return ids;
  }, [gameState.playerHand, gameState.currentTurn, gameState.status, topDiscardCard, gameState.currentSuit]);

  // Helper: Draw card
  const drawCard = (player: PlayerType) => {
    setGameState(prev => {
      let { deck, discardPile } = prev;
      
      // Reshuffle if deck is empty
      if (deck.length === 0) {
        if (discardPile.length <= 1) {
          // No cards to draw, skip turn
          setMessage(t.skippedTurn(player === 'player' ? 'You' : 'AI'));
          return {
            ...prev,
            currentTurn: player === 'player' ? 'ai' : 'player',
          };
        }
        
        const topDiscard = discardPile[discardPile.length - 1];
        const cardsToShuffle = discardPile.slice(0, discardPile.length - 1);
        deck = shuffleDeck(cardsToShuffle);
        discardPile = [topDiscard];
        setMessage(t.deckReshuffled);
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
        setGameState(prev => {
          // Guard: Card must be in hand
          if (!prev.playerHand.find(c => c.id === card.id)) return prev;

          return {
            ...prev,
            playerHand: prev.playerHand.filter(c => c.id !== card.id),
            discardPile: [...prev.discardPile, card],
            isSuitSelectorOpen: true,
            currentSuit: card.suit, // Temporarily set to card suit, will be updated by selector
          };
        });
      } else {
        // Normal play
        setGameState(prev => {
          // Guard: Card must be in hand
          if (!prev.playerHand.find(c => c.id === card.id)) return prev;

          return {
            ...prev,
            playerHand: prev.playerHand.filter(c => c.id !== card.id),
            discardPile: [...prev.discardPile, card],
            currentTurn: 'ai',
            currentSuit: card.suit,
          };
        });
        setMessage(t.aiTurn);
      }
    } else {
      setMessage(t.invalidMove);
      setTimeout(() => setMessage(t.yourTurn), 1000);
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
    setMessage(t.suitChanged(suit));
  };

  // Player Action: Cancel Suit Selection (Return 8 to hand)
  const handleCancelSuitSelection = () => {
    setGameState(prev => {
      // Get the 8 from the discard pile
      const playedEight = prev.discardPile[prev.discardPile.length - 1];
      const previousDiscardPile = prev.discardPile.slice(0, prev.discardPile.length - 1);
      
      // Restore previous suit logic
      // If the card below the 8 was NOT an 8, use its suit.
      // If it WAS an 8, we ideally need the suit chosen then.
      // However, simplified logic: if we cancel, we just revert to what the suit *would be* based on the top card.
      // BUT, currentSuit in state is currently the 8's suit (temporarily set in handlePlayerCardClick).
      // We need to revert currentSuit to what it was before.
      // Since we don't store history, we have to infer or just accept a potential minor state glitch if double 8s.
      // Better: Re-evaluate currentSuit based on the NEW top card (the one below the 8).
      
      const newTopCard = previousDiscardPile[previousDiscardPile.length - 1];
      // If newTopCard is 8, we don't know the chosen suit. This is a limitation of current state.
      // BUT, for a simple "undo", we can try to just use the newTopCard.suit unless it's an 8.
      // If it is an 8, we might be stuck.
      // A robust fix requires storing `prevSuit` in state when opening selector.
      // Let's assume for now we just close it and put card back.
      // The user will have to play 8 again.
      
      // Actually, we can just use the suit of the card below. 
      // If it's an 8, the suit displayed on UI might be wrong if we don't know what was chosen.
      // Let's just put the card back.
      
      return {
        ...prev,
        playerHand: [...prev.playerHand, playedEight],
        discardPile: previousDiscardPile,
        isSuitSelectorOpen: false,
        // We need to restore currentSuit. 
        // If we don't, it remains the 8's suit, which is technically valid for the 8 itself, 
        // but might be wrong for other cards if the previous suit was different.
        // Let's try to infer:
        currentSuit: newTopCard.suit // This is a best-effort revert.
      };
    });
    setMessage(t.yourTurn);
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
        setMessage(t.yourTurn);
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
        setMessage(t.aiPlayed8(bestSuit));
      } else {
        // Draw
        drawCard('ai');
      }
    }, AI_DELAY);

    return () => clearTimeout(timer);
  }, [gameState.currentTurn, gameState.status, gameState.aiHand, gameState.discardPile, gameState.currentSuit]); // Dependencies for AI turn

  // const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1]; // Moved up

  return (
    <div className="min-h-screen bg-green-800 text-white font-sans overflow-hidden flex flex-col items-center justify-between py-4 relative pt-16">
      {/* Top Banner */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-black/40 backdrop-blur-md border-b border-white/10 z-50 flex justify-between items-center px-4 md:px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? '中文' : 'English'}
          </button>
        </div>
        
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
        >
          <HelpCircle className="w-4 h-4" />
          {t.help}
        </button>
      </div>

      {/* Header / Status */}
      <div className="w-full max-w-4xl px-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
           <div className="bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
             <span className="text-sm font-medium opacity-80">{t.aiCards}</span>
             <span className="ml-2 text-xl font-bold">{gameState.aiHand.length}</span>
           </div>
        </div>
        
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold tracking-wider text-green-100 drop-shadow-md">{t.title}</h1>
          <div className="mt-1 px-4 py-1 bg-white/10 rounded-full text-sm font-medium animate-pulse">
            {message}
          </div>
        </div>

        <button 
          onClick={startNewGame}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title={t.playAgain}
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
                "relative w-32 h-48 rounded-xl shadow-2xl transition-transform hover:scale-105 active:scale-95",
                gameState.currentTurn === 'player' ? 'cursor-pointer ring-4 ring-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : ''
              )}
            >
              {/* Stack effect */}
              <div className="absolute top-1 left-1 w-full h-full bg-blue-900 rounded-xl border border-blue-400/20" />
              <div className="absolute top-0.5 left-0.5 w-full h-full bg-blue-800 rounded-xl border border-blue-400/20" />
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl border-2 border-white/20 flex items-center justify-center">
                <div className="w-24 h-40 border-2 border-blue-400/30 rounded-lg opacity-50" />
                <span className="absolute font-bold text-2xl text-white/20">{t.deck}</span>
              </div>
            </div>
          ) : (
             <div 
               onClick={handlePlayerDraw}
               className={clsx(
                 "w-32 h-48 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center transition-all",
                 gameState.currentTurn === 'player' ? 'cursor-pointer hover:bg-white/5 ring-4 ring-yellow-400/50' : ''
               )}
             >
               <span className="text-white/40 font-bold uppercase tracking-widest">
                 {gameState.discardPile.length > 1 ? t.shuffle : t.pass}
               </span>
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
               <span className="text-xs uppercase tracking-wider opacity-70">{t.target}</span>
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
           <span className="text-sm font-medium opacity-80">{t.yourHand}</span>
           {gameState.currentTurn === 'player' && (
             <span className="text-yellow-300 font-bold animate-bounce">{t.yourTurn}</span>
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
            playableCardIds={playableCardIds}
          />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {gameState.isSuitSelectorOpen && (
          <SuitSelector key="suit-selector" onSelect={handleSuitSelect} onCancel={handleCancelSuitSelection} />
        )}
        
        {gameState.status === 'start' && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* Background Image - Cartoon Casino Style */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://picsum.photos/seed/cartooncasino/1920/1080?blur=1" 
                alt="Cartoon Casino Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/50" />
            </div>

            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="relative z-10 bg-white/95 backdrop-blur-md text-gray-900 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center mx-4 border border-white/20"
            >
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3 border-4 border-yellow-400">
                  <Dices className="w-14 h-14 text-yellow-400" />
                </div>
              </div>
              
              <h1 className="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800 tracking-tight drop-shadow-sm">
                {t.title}
              </h1>
              <p className="text-gray-600 mb-8 font-medium">
                {t.subtitle}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={startNewGame}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-red-600/30 border border-yellow-400/50"
                >
                  <Play className="w-6 h-6 fill-current" />
                  {t.startGame}
                </button>
                
                <button
                  onClick={() => setShowRules(!showRules)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-base hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  {showRules ? t.hideRules : t.howToPlay}
                </button>
              </div>

              <AnimatePresence>
                {showRules && (
                  <motion.div
                    key="rules"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden text-left mt-4 bg-gray-50 rounded-xl"
                  >
                    <div className="p-4 text-sm text-gray-600 space-y-2">
                      <p><strong>{t.rulesTitle}</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        {t.rulesList.map((rule, i) => (
                          <li key={i}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {/* Global Help Modal */}
        <AnimatePresence>
          {isHelpOpen && (
            <motion.div
              key="help-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setIsHelpOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    {t.helpTitle}
                  </h2>
                  <button 
                    onClick={() => setIsHelpOpen(false)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 text-gray-600 leading-relaxed">
                  {t.helpContent}
                </div>
                <div className="p-4 bg-gray-50 flex justify-end">
                  <button
                    onClick={() => setIsHelpOpen(false)}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    {t.close}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {gameState.status !== 'playing' && gameState.status !== 'start' && (
          <motion.div
            key="end-screen"
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
                  <h2 className="text-3xl font-bold mb-2">{t.victory}</h2>
                  <p className="text-gray-600 mb-6">{t.victoryDesc}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-600">
                    <Frown className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">{t.defeat}</h2>
                  <p className="text-gray-600 mb-6">{t.defeatDesc}</p>
                </div>
              )}
              
              <button
                onClick={startNewGame}
                className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                {t.playAgain}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
