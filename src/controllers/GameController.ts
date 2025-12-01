import { NotationItem, getRandomNote } from '../utils/music';

type GameStatus = 'idle' | 'awaiting' | 'correct' | 'incorrect' | 'finished';

class GameController {
  private currentRound: number;
  private currentNote: NotationItem | null;
  private score: number;
  private status: GameStatus;
  private readonly totalRounds = 10;
  private onStateChange: (() => void) | null = null;

  constructor() {
    this.currentRound = 1;
    this.currentNote = null;
    this.score = 0;
    this.status = 'idle';
  }

  /**
   * Register a callback to be called whenever game state changes
   */
  public onStateUpdate(callback: () => void): void {
    this.onStateChange = callback;
  }

  /**
   * Start a new game
   */
  public startGame(): void {
    this.currentRound = 1;
    this.score = 0;
    this.status = 'awaiting';
    this.currentNote = this.generateRandomNote();
    this.notifyStateChange();
  }

  /**
   * Move to the next round or end the game if all rounds are complete
   */
  public nextRound(): void {
    if (this.currentRound >= this.totalRounds) {
      this.status = 'finished';
    } else {
      this.currentRound++;
      this.status = 'awaiting';
      this.currentNote = this.generateRandomNote();
    }
    this.notifyStateChange();
  }

  /**
   * Submit an answer for the current note
   * @param noteLetter The note name (e.g., 'C4', 'G#5') that the user guessed
   */
  public submitAnswer(noteName: string): void {
    if (this.status !== 'awaiting' || !this.currentNote) return;

    // Compare note names (case-insensitive)
    const isCorrect = this.currentNote.name.toLowerCase() === noteName.toLowerCase();
    this.status = isCorrect ? 'correct' : 'incorrect';
    
    if (isCorrect) {
      this.score++;
    }

    this.notifyStateChange();
  }

  /**
   * Reset the game to its initial state
   */
  public reset(): void {
    this.currentRound = 1;
    this.score = 0;
    this.status = 'idle';
    this.currentNote = null;
    this.notifyStateChange();
  }

  /**
   * Get the current game state
   */
  public getState() {
    return {
      currentRound: this.currentRound,
      currentNote: this.currentNote,
      score: this.score,
      status: this.status,
      totalRounds: this.totalRounds,
      isGameOver: this.status === 'finished'
    };
  }

  /**
   * Generate a random note for the current round
   */
  private generateRandomNote(): NotationItem {
    // Use the utility function to get a random note
    // Default octave range is 3-5, which is a good range for treble clef
    return getRandomNote();
  }

  /**
   * Notify listeners of state changes
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }
}

// Export a singleton instance
export const gameController = new GameController();
