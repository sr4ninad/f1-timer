import { useState, useEffect, useRef } from 'react';

const SPEED_RANKINGS = [
  { name: "Housefly", time: 5 },
  { name: "Hummingbird", time: 10 },
  { name: "Cat", time: 45 },
  { name: "Dragonfly", time: 50 },
  { name: "Snake strike", time: 70 },
  { name: "Professional athletes", time: 175 },
  { name: "Video gamers", time: 170 },
  { name: "Formula 1 drivers", time: 200 },
  { name: "Average adult human", time: 225 },
  { name: "Human eye blink", time: 350 },
  { name: "Elderly adults", time: 350 },
];

export default function F1StartTimer() {
  // State declarations
  const [gameState, setGameState] = useState('ready');
  const [reactionTime, setReactionTime] = useState(0);
  const [personalBest, setPersonalBest] = useState(() => {
    return localStorage.getItem('f1PersonalBest') || null;
  });
  const [sessionBest, setSessionBest] = useState(null);
  const [lightsOut, setLightsOut] = useState(false);
  const [activeLights, setActiveLights] = useState(0);
  const [showRankings, setShowRankings] = useState(false);
  
  // Refs
  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  // Click handler (defined first to avoid reference errors)
  const handleClick = () => {
    if (gameState === 'ready' || gameState === 'result' || gameState === 'false-start') {
      startGame();
    } else if (gameState === 'countdown') {
      handleFalseStart();
    } else if (gameState === 'waiting') {
      handleReaction();
    }
  };

  // Game control functions
  const startGame = () => {
    setGameState('countdown');
    setActiveLights(0);
    setLightsOut(false);
    setReactionTime(0);
    
    let lightCount = 0;
    intervalRef.current = setInterval(() => {
      lightCount++;
      setActiveLights(lightCount);
      
      if (lightCount === 5) {
        clearInterval(intervalRef.current);
        const delay = 1000 + Math.random() * 4000;
        
        timeoutRef.current = setTimeout(() => {
          setLightsOut(true);
          setGameState('waiting');
          startTimeRef.current = performance.now();
        }, delay);
      }
    }, 1000);
  };

  const handleFalseStart = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    setGameState('false-start');
  };

  const handleReaction = () => {
    const endTime = performance.now();
    const reaction = endTime - startTimeRef.current;
    setReactionTime(reaction);
    setGameState('result');
    
    if (!sessionBest || reaction < sessionBest) {
      setSessionBest(reaction);
    }
    if (!personalBest || reaction < personalBest) {
      setPersonalBest(reaction);
      localStorage.setItem('f1PersonalBest', reaction);
    }
  };

  // Helper functions
  const formatTime = (time) => {
    if (!time) return '00.000';
    return (time / 1000).toFixed(3);
  };

  const getMessage = () => {
    switch (gameState) {
      case 'ready': return 'Press any key or click to start';
      case 'countdown': return 'Wait for lights out...';
      case 'waiting': return 'GO! GO! GO!';
      case 'result': return 'Press any key or click to try again';
      case 'false-start': return 'FALSE START! Press any key or click to try again';
      default: return '';
    }
  };

  const getRankingPosition = () => {
    if (!personalBest) return SPEED_RANKINGS.length;
    return SPEED_RANKINGS.findIndex(item => personalBest <= item.time);
  };

  // Effects
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showRankings) {
        setShowRankings(false);
        return;
      }
      if (gameState === 'ready' || gameState === 'result' || gameState === 'false-start') {
        startGame();
      } else if (gameState === 'countdown') {
        handleFalseStart();
      } else if (gameState === 'waiting') {
        handleReaction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showRankings]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  // Derived values
  const rankingPosition = getRankingPosition();
  const isFasterThan = rankingPosition < SPEED_RANKINGS.length 
    ? SPEED_RANKINGS[rankingPosition]?.name 
    : "nothing (yet!)";

  return (
    <div 
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-mono select-none outline-none relative"
      tabIndex={0}
      onClick={handleClick}
    >
      {/* Speed Rankings - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowRankings(!showRankings);
          }}
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-600 flex items-center transition-all"
        >
          <span className="mr-2">🏎️</span> Speed Rankings
          <svg 
            className={`ml-2 h-4 w-4 transition-transform ${showRankings ? 'rotate-180' : ''}`} 
            viewBox="0 0 20 20"
          >
            <path fill="currentColor" d="M5 8l5 5 5-5z"/>
          </svg>
        </button>

        {showRankings && (
          <div 
            className="absolute right-0 mt-2 w-72 bg-gray-900 border-2 border-red-500 rounded-lg shadow-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-red-500 mb-2 text-lg border-b border-gray-700 pb-2">
              🚦 Reaction Time Leaderboard
            </h3>
            <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
              {SPEED_RANKINGS.map((item, index) => (
                <li 
                  key={item.name} 
                  className={`flex justify-between items-center py-1 px-2 rounded ${personalBest && personalBest <= item.time ? 'bg-red-900/30 text-green-300' : 'hover:bg-gray-800'}`}
                >
                  <span className="flex items-center">
                    <span className="text-gray-400 w-6">{index + 1}.</span>
                    {item.name}
                  </span>
                  <span className="font-mono">{item.time} ms</span>
                </li>
              ))}
            </ul>
            {personalBest && (
              <div className="mt-3 text-xs text-center text-gray-400 italic">
                Your PB: {formatTime(personalBest)} (faster than {isFasterThan})
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Press ESC to close | Animals dominate human reaction times!
            </div>
          </div>
        )}
      </div>

      {/* Main Timer Content */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-red-500 mb-2 tracking-wider">
          F1 START TIMER
        </h1>
        <p className="text-gray-400 text-sm">
          {getMessage()}
        </p>
      </div>

      <div className="flex gap-4 mb-12">
        {[1, 2, 3, 4, 5].map((light) => (
          <div
            key={light}
            className={`w-16 h-16 rounded-full border-4 transition-colors duration-100 ${
              lightsOut 
                ? 'bg-black border-gray-700' 
                : activeLights >= light 
                ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50' 
                : 'bg-gray-900 border-gray-700'
            }`}
          />
        ))}
      </div>

      <div className="text-center bg-gray-900 rounded-lg p-8 border border-gray-700">
        <div className={`text-8xl font-mono font-bold mb-4 ${
          gameState === 'false-start' 
            ? 'text-red-500' 
            : gameState === 'result' 
            ? 'text-green-400' 
            : 'text-white'
        }`}>
          {gameState === 'false-start' 
            ? 'FALSE' 
            : formatTime(reactionTime)
          }
        </div>
        
        <div className="space-y-2 mt-4">
          <div className="text-xl text-gray-400">
            Session Best: {sessionBest ? formatTime(sessionBest) : '--.--'}
          </div>
          <div className="text-xl text-yellow-400 font-medium">
            Personal Best: {personalBest ? formatTime(personalBest) : '--.--'}
          </div>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="absolute bottom-2 right-4 text-xs text-gray-600 hover:text-gray-400 transition-colors">
        <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" 
           className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <span>© {new Date().getFullYear()} Ninad | Built with</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 23" 
               className="w-4 h-4 mx-1" fill="#61DAFB">
            <circle cx="0" cy="0" r="2.05" fill="#61DAFB"/>
            <g stroke="#61DAFB" strokeWidth="1" fill="none">
              <ellipse rx="11" ry="4.2"/>
              <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
              <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
            </g>
          </svg>
          <span>React & Tailwind CSS</span>
        </a>
      </div>
    </div>
  );
}