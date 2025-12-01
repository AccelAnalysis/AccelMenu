// Audio context and state
let audioContext: AudioContext | null = null;
let isAudioInitialized = false;

// Initialize audio context (required for WebAudio on mobile)
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContext();
  }
  return audioContext;
};

// Unlock audio on user interaction (required for mobile Safari)
const unlockAudio = (): Promise<void> => {
  if (isAudioInitialized) return Promise.resolve();
  
  return new Promise((resolve) => {
    const unlock = () => {
      if (isAudioInitialized) return;
      
      const context = getAudioContext();
      if (context.state === 'suspended') {
        context.resume().then(() => {
          isAudioInitialized = true;
          resolve();
        });
      } else {
        isAudioInitialized = true;
        resolve();
      }
    };

    // Try to unlock immediately
    unlock();
    
    // Also set up an event listener for the first user interaction
    const handleFirstInteraction = () => {
      unlock();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
  });
};

// Play a tone with the given frequency and duration
const playTone = async (frequency: number, duration: number = 0.3, type: OscillatorType = 'sine'): Promise<void> => {
  try {
    await unlockAudio();
    const context = getAudioContext();
    
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  } catch (error) {
    console.warn('Audio playback failed:', error);
  }
};

// Play a correct answer sound
export const playCorrect = async (): Promise<void> => {
  await playTone(880, 0.3, 'sine');
  await new Promise(resolve => setTimeout(resolve, 50));
  await playTone(1174.66, 0.3, 'sine'); // D6
};

// Play a wrong answer sound
export const playWrong = async (): Promise<void> => {
  const duration = 0.4;
  await playTone(220, duration, 'sine');
  await playTone(174.61, duration, 'sine'); // F3
};

// Play a specific MIDI note
export const playNote = async (midi: number): Promise<void> => {
  // Convert MIDI note to frequency (A4 = 69 = 440Hz)
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  await playTone(frequency, 0.5, 'sine');
};

// Initialize audio on any user interaction
if (typeof window !== 'undefined') {
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}
