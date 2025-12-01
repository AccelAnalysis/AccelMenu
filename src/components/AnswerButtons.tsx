import React from 'react';
import { NoteLetter } from '../types/music';
import '../css/AnswerButtons.css';

interface AnswerButtonsProps {
  onSelect: (note: NoteLetter) => void;
  disabled?: boolean;
  selectedNote?: NoteLetter | null;
}

const NOTE_LETTERS: NoteLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export const AnswerButtons: React.FC<AnswerButtonsProps> = ({
  onSelect,
  disabled = false,
  selectedNote = null,
}) => {
  return (
    <div className="answer-buttons-container">
      {NOTE_LETTERS.map((note) => (
        <button
          key={note}
          className={`answer-button ${selectedNote === note ? 'selected' : ''}`}
          onClick={() => onSelect(note)}
          disabled={disabled}
          aria-label={`Select note ${note}`}
        >
          {note}
        </button>
      ))}
    </div>
  );
};

export default AnswerButtons;
