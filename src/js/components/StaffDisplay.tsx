import React from 'react';
import NoteRenderer from './NoteRenderer';

export interface NotationItem {
  name: string;
  octave: number;
  // Add other notation properties as needed
}

interface StaffDisplayProps {
  currentNote: NotationItem | null;
  children?: React.ReactNode;
}

const StaffDisplay: React.FC<StaffDisplayProps> = ({ currentNote, children }) => {
  // Staff line positions (5 lines)
  const linePositions = [0, 1, 2, 3, 4];
  
  // Calculate note position (middle C = 0, each line/space = 1)
  const getNotePosition = (note: NotationItem | null): number => {
    if (!note) return -100; // Off-screen when no note
    
    // This is a simplified calculation - you'll want to adjust based on your note naming
    // and octave system. This is just a starting point.
    const notePositions: Record<string, number> = {
      'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
    };
    
    const basePosition = notePositions[note.name[0]] || 0;
    return (4 - note.octave) * 7 + basePosition;
  };

  const notePosition = getNotePosition(currentNote);

  return (
    <div className="relative w-full max-w-2xl mx-auto my-8 p-4 bg-white rounded-lg shadow-md">
      <div className="relative h-48">
        {/* Staff lines */}
        <div className="absolute w-full h-0.5 bg-gray-800 top-1/2 transform -translate-y-1/2"></div>
        {linePositions.map((_, index) => (
          <div 
            key={index}
            className="absolute w-full h-0.5 bg-gray-800"
            style={{
              top: `calc(50% - ${(index - 2) * 8}px)`
            }}
          />
        ))}
        
        {/* Note */}
        {currentNote && (
          <NoteRenderer staffPosition={notePosition}>
            {children}
          </NoteRenderer>
        )}
        
        {/* Clef (treble clef) */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-4xl">
          𝄞
        </div>
      </div>
    </div>
  );
};

export default StaffDisplay;
