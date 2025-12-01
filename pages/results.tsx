import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/link';
import { gameController } from '../src/controllers/GameController';

type GameState = {
  score: number;
  totalRounds: number;
};

export default function ResultsPage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    totalRounds: 10
  });

  // Calculate accuracy percentage
  const accuracy = gameState.totalRounds > 0 
    ? Math.round((gameState.score / gameState.totalRounds) * 100) 
    : 0;

  // Get the final score when component mounts
  useEffect(() => {
    const state = gameController.getState();
    setGameState({
      score: state.score,
      totalRounds: state.totalRounds
    });
  }, []);

  const handlePlayAgain = () => {
    gameController.reset();
    router.push('/play');
  };

  const handleGoHome = () => {
    gameController.reset();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Game Results - AccelMenu</title>
        <meta name="description" content="View your music game results" />
      </Head>

      <main className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">Game Over!</h1>
        
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800">Your Score</h2>
            <p className="text-5xl font-bold text-indigo-600 my-2">
              {gameState.score} / {gameState.totalRounds}
            </p>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800">Accuracy</h2>
            <div className="relative w-40 h-40 mx-auto my-4">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(accuracy / 100) * 283} 283`}
                  transform="rotate(-90 50 50)"
                />
                {/* Center text */}
                <text
                  x="50"
                  y="55"
                  textAnchor="middle"
                  fontSize="24"
                  fontWeight="bold"
                  fill="#4f46e5"
                >
                  {accuracy}%
                </text>
              </svg>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4 mt-8">
            <button
              onClick={handlePlayAgain}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Play Again
            </button>
            <button
              onClick={handleGoHome}
              className="bg-white hover:bg-gray-100 text-indigo-600 font-bold py-3 px-6 border-2 border-indigo-600 rounded-lg transition duration-200"
            >
              Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
