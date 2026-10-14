import { majorScale, type CircleKey } from "./circle";
import { formatNote, mod, type SpelledNote } from "./spelling";

export type ChordQuality = "maj" | "min" | "dim";

export type Chord = {
  degree: number; // 1–7
  roman: string;
  quality: ChordQuality;
  root: SpelledNote;
  notes: [SpelledNote, SpelledNote, SpelledNote];
  degrees: [number, number, number]; // the Decoder's "quick chord" numbers
};

const QUALITIES: ChordQuality[] = ["maj", "min", "min", "maj", "maj", "min", "dim"];
const ROMANS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const SUFFIX: Record<ChordQuality, string> = { maj: "", min: "m", dim: "°" };
const QUALITY_NAME: Record<ChordQuality, string> = { maj: "major", min: "minor", dim: "diminished" };

const wrapDegree = (degree: number) => mod(degree - 1, 7) + 1;

export function diatonicChords(key: CircleKey): Chord[] {
  const scale = majorScale(key);
  return QUALITIES.map((quality, i) => {
    const degree = i + 1;
    const degrees: [number, number, number] = [degree, wrapDegree(degree + 2), wrapDegree(degree + 4)];
    return {
      degree,
      roman: ROMANS[i],
      quality,
      root: scale[i],
      notes: [scale[degrees[0] - 1], scale[degrees[1] - 1], scale[degrees[2] - 1]],
      degrees,
    };
  });
}

export function chordName(chord: Chord): string {
  return formatNote(chord.root) + SUFFIX[chord.quality];
}

export function chordLongName(chord: Chord): string {
  return `${formatNote(chord.root)} ${QUALITY_NAME[chord.quality]}`;
}

export function romanFor(degree: number): string {
  return ROMANS[degree - 1];
}

export function progressionLabel(degrees: readonly number[]): string {
  return degrees.map(romanFor).join("–");
}

// The physical Decoder's arrangement, left to right.
export const DECODER_LAYOUT = { major: [4, 1, 5], minor: [3, 6, 2], dim: 7 } as const;

export type ProgressionPreset = { id: string; name: string; degrees: readonly number[] };

export const COMMON_PROGRESSIONS: readonly ProgressionPreset[] = [
  { id: "pop", name: "Pop", degrees: [1, 5, 6, 4] },
  { id: "ii-v-i", name: "Jazz turnaround", degrees: [2, 5, 1] },
  { id: "i-iv-v", name: "Three-chord", degrees: [1, 4, 5] },
  { id: "vi-iv-i-v", name: "Sensitive", degrees: [6, 4, 1, 5] },
  { id: "fifties", name: "50s", degrees: [1, 6, 4, 5] },
];
