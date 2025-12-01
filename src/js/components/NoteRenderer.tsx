import React from 'react';

interface NoteRendererProps {
  staffPosition: number;
  children?: React.ReactNode;
}

const NoteRenderer: React.FC<NoteRendererProps> = ({ staffPosition, children }) => {
  // Each line/space is 8px apart, with middle C at position 0
  const noteStyle = {
    position: 'absolute' as const,
    left: '50%',
    transform: 'translateX(-50%)',
    top: `calc(50% - ${staffPosition * 8}px)`,
    width: '24px',
    height: '24px',
    backgroundColor: 'black',
    borderRadius: '50%',
  };

  return <div style={noteStyle}>{children}</div>;
};

export default NoteRenderer;
