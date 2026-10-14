import { chordLongName, chordName, diatonicChords } from "@/lib/theory/chords";
import { circleKeyFor } from "@/lib/theory/circle";
import type { Quality } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import type { SpelledNote } from "@/lib/theory/spelling";

export type ProgressionStep = {
  degree: number;
  roman: string;
  name: string; // "Em", as the Circle writes it
  longName: string; // "E minor"
  quality: Quality | null; // null: diminished, no shapes yet
  notes: [SpelledNote, SpelledNote, SpelledNote];
};

const QUALITY = { maj: "major", min: "minor", dim: null } as const;

// The Circle stores degrees, so the same progression follows whatever key it is read in.
export function progressionSteps(root: Note, degrees: readonly number[]): ProgressionStep[] {
  const chords = diatonicChords(circleKeyFor(root));
  return degrees.map((degree) => {
    const chord = chords[degree - 1];
    return {
      degree,
      roman: chord.roman,
      name: chordName(chord),
      longName: chordLongName(chord),
      quality: QUALITY[chord.quality],
      notes: chord.notes,
    };
  });
}

// The next step with shapes; from no selection, the first one in that direction.
export function nextPlayable(steps: readonly ProgressionStep[], from: number | null, direction: 1 | -1): number | null {
  let i = from === null ? (direction === 1 ? 0 : steps.length - 1) : from + direction;
  for (; i >= 0 && i < steps.length; i += direction) if (steps[i].quality) return i;
  return null;
}
