/**
 * Represents a musical note with its properties
 */
export interface NotationItem {
  /** The note name (e.g., 'C4', 'G#5') */
  name: string;
  /** MIDI note number (0-127) */
  midi: number;
  /** Frequency in Hz */
  frequency: number;
  /** Position on a standard musical staff (0 = middle C) */
  staffPosition: number;
  /** Note duration in beats */
  duration?: number;
  /** Note velocity (0-127) */
  velocity?: number;
}

/**
 * Musical notes in one octave
 */
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Gets a random note within a specified range
 * @param minOctave Minimum octave (default: 3)
 * @param maxOctave Maximum octave (default: 5)
 * @returns A random NotationItem
 */
export function getRandomNote(minOctave: number = 3, maxOctave: number = 5): NotationItem {
  // Ensure valid octave range
  minOctave = Math.max(0, Math.min(8, minOctave));
  maxOctave = Math.max(0, Math.min(8, maxOctave));
  
  if (minOctave > maxOctave) [minOctave, maxOctave] = [maxOctave, minOctave];
  
  const octave = Math.floor(Math.random() * (maxOctave - minOctave + 1)) + minOctave;
  const noteIndex = Math.floor(Math.random() * NOTE_NAMES.length);
  const noteName = NOTE_NAMES[noteIndex];
  const fullName = `${noteName}${octave}`;
  
  // Calculate MIDI note number (C4 = 60, A4 = 69)
  const midi = 12 + (octave * 12) + noteIndex;
  
  // Calculate frequency: A4 = 440Hz, 12 semitones per octave
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  
  // Calculate staff position (0 = middle C, positive = up, negative = down)
  // Each line/space is 0.5 units (e.g., middle C = 0, B3 = -0.5, D4 = 1)
  const noteOffset = {
    'C': 0, 'C#': 0, 'D': 1, 'D#': 1, 'E': 2,
    'F': 2.5, 'F#': 2.5, 'G': 3.5, 'G#': 3.5, 'A': 4.5, 'A#': 4.5, 'B': 5.5
  }[noteName] as number;
  
  const staffPosition = (octave - 4) * 3.5 + noteOffset - 8;
  
  return {
    name: fullName,
    midi,
    frequency,
    staffPosition,
    duration: 1, // Default to quarter note
    velocity: 100 // Default velocity
  };
}

/**
 * Converts a staff position to a vertical pixel offset
 * @param staffPosition Position on the musical staff (0 = middle C)
 * @param lineSpacing Space between staff lines in pixels (default: 10)
 * @param staffMiddleY Y-coordinate of middle C in pixels (default: 100)
 * @returns Y-coordinate for rendering the note
 */
export function noteToPosition(
  staffPosition: number,
  lineSpacing: number = 10,
  staffMiddleY: number = 100
): number {
  // Each staff position is half the distance between lines
  // Negative because in canvas/svg, Y increases downward
  return staffMiddleY - (staffPosition * lineSpacing / 2);
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 * @param array Array to shuffle
 * @returns The same array, shuffled
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Generates an array of numbers in a range
 * @param start Start of the range (inclusive)
 * @param end End of the range (inclusive or exclusive)
 * @param step Step between numbers (default: 1)
 * @param inclusive Whether the end is inclusive (default: true)
 * @returns Array of numbers in the specified range
 */
export function range(
  start: number,
  end: number,
  step: number = 1,
  inclusive: boolean = true
): number[] {
  const result: number[] = [];
  const effectiveEnd = inclusive ? end : end - step;
  
  if (step === 0) {
    throw new Error('Step cannot be zero');
  }
  
  if ((step > 0 && start > effectiveEnd) || (step < 0 && start < effectiveEnd)) {
    return [];
  }
  
  for (let i = start; step > 0 ? i <= effectiveEnd : i >= effectiveEnd; i += step) {
    result.push(i);
  }
  
  return result;
}

// Type guard for note names
type NoteName = typeof NOTE_NAMES[number];

// Export note names as readonly array
export const NOTE_NAMES_READONLY: readonly string[] = NOTE_NAMES;
