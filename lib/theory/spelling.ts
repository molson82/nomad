export type Letter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

// accidental: +1 sharp, -1 flat, ±2 double. Spelled notes keep the letter a
// key needs (E♯ in F♯ major), which plain pitch classes can't.
export type SpelledNote = { letter: Letter; accidental: number };

export const LETTERS: readonly Letter[] = ["C", "D", "E", "F", "G", "A", "B"];

const NATURAL_PITCH: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function pitchClassOf(note: SpelledNote): number {
  return mod(NATURAL_PITCH[note.letter] + note.accidental, 12);
}

export function spellAs(letter: Letter, pitchClass: number): SpelledNote {
  let accidental = mod(pitchClass - NATURAL_PITCH[letter], 12);
  if (accidental > 6) accidental -= 12;
  return { letter, accidental };
}

export function formatNote(note: SpelledNote): string {
  const glyphs = note.accidental > 0 ? "♯".repeat(note.accidental) : "♭".repeat(-note.accidental);
  return note.letter + glyphs;
}
