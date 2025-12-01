export type NoteLetter = 'A'|'B'|'C'|'D'|'E'|'F'|'G';

export interface NotationItem {
  id: string;
  letter: NoteLetter;
  midi: number;
  staffPosition: number;
}
