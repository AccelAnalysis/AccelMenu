import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { gameController } from '../src/controllers/GameController';
import { NotationItem } from '../src/controllers/GameController';

// Dynamically import components with no SSR to avoid hydration issues
const StaffDisplay = dynamic(
  () => import('../src/js/components/StaffDisplay'),
  { ssr: false }
);

const AnswerButtons = dynamic(
  () => import('../src/components/AnswerButtons'),
  { ssr: false }
);

// Convert NotationItem to the format expected by StaffDisplay
const toStaffDisplayNote = (note: NotationItem | null) => {
  if (!note) return null;
  const match = note.name.match(/^([A-G]#?)(\d+)$/);
  if (!match) return null;
  return {
    name: match[1],
    octave: parseInt(match[2])
  };
};

export default function PlayPage() {
  const router = useRouter();
  const [gameState, setGameState] = useState(gameController.getState());
  const [noteStatus, setNoteStatus] = useState<'none' | 'correct' | 'incorrect'>('none');

  // Set up game state subscription
  useEffect(() => {
    const handleStateChange = () => {
      const newState = gameController.getState();
      setGameState(newState);
      
      // Handle game over
      if (newState.isGameOver) {
        router.push('/results');
      }
    };

    gameController.onStateUpdate(handleStateChange);
    
    // Start the game when component mounts
    gameController.startGame();
    
    return () => {
      gameController.onStateUpdate(null);
    };
  }, [router]);

  // Handle answer submission
  const handleAnswer = (noteLetter: string) => {
    if (gameState.status !== 'awaiting') return;
    
    // Submit the answer
    gameController.submitAnswer(noteLetter + gameState.currentNote?.name.slice(-1));
    
    // Show feedback animation
    const isCorrect = gameState.currentNote?.name.startsWith(noteLetter);
    setNoteStatus(isCorrect ? 'correct' : 'incorrect');
    
    // Move to next round after animation
    setTimeout(() => {
      setNoteStatus('none');
      gameController.nextRound();
    }, 1000);
  };

  // Get animation class based on note status
  const getAnimationClass = () => {
    if (noteStatus === 'correct') return 'animate-pulse-green';
    if (noteStatus === 'incorrect') return 'animate-pulse-red';
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>Play - Note Trainer</title>
        <meta name="description" content="Test your music reading skills" />
      </Head>

      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Note Trainer</h1>
          <div className="text-lg">
            Round: {gameState.currentRound} / {gameState.totalRounds} | 
            Score: {gameState.score}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex flex-col items-center justify-center">
        <div className={`mb-8 ${getAnimationClass()}`}>
          <StaffDisplay currentNote={toStaffDisplayNote(gameState.currentNote)} />
        </div>
        
        <div className="w-full max-w-md">
          <AnswerButtons 
            onSelect={handleAnswer} 
            disabled={gameState.status !== 'awaiting'}
          />
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        
        .animate-pulse-green {
          animation: pulse-green 1s ease-out;
          border-radius: 0.5rem;
        }
        
        .animate-pulse-red {
          animation: pulse-red 1s ease-out;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}
