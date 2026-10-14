import type { Note } from "@/lib/theory/notes";
import { circleKeyFor, majorScale } from "./circle";
import { pitchClassOf, type SpelledNote } from "./spelling";

// String 0 is low E, string 5 is high E.
export const TUNING: readonly number[] = [4, 9, 2, 7, 11, 4];
export const STRING_NAMES: readonly string[] = ["E", "A", "D", "G", "B", "E"];
export const STRING_ORDINALS: readonly string[] = ["6th", "5th", "4th", "3rd", "2nd", "1st"];
// The device stops at 13; 15 keeps every CAGED shape complete for every root.
export const MAX_FRET = 15;

export type Quality = "major" | "minor";
export type Role = "R" | "♭3" | "3" | "5";
export type ChordTone = { string: number; fret: number; role: Role; note: SpelledNote };

const ROLES: Record<Quality, Role[]> = { major: ["R", "3", "5"], minor: ["R", "♭3", "5"] };

// Spelled as the Circle spells the key (C# → D♭ F A♭). Minor is the key's relative minor: ⑥ ① ③.
export function triad(root: Note, quality: Quality = "major"): [SpelledNote, SpelledNote, SpelledNote] {
  const scale = majorScale(circleKeyFor(root));
  return quality === "major" ? [scale[0], scale[2], scale[4]] : [scale[5], scale[0], scale[2]];
}

export function toneAt(chord: readonly SpelledNote[], string: number, fret: number, quality: Quality = "major"): ChordTone {
  const pitch = (TUNING[string] + fret) % 12;
  const i = chord.findIndex((note) => pitchClassOf(note) === pitch);
  if (i < 0) throw new Error(`string ${string} fret ${fret} is not a chord tone`);
  return { string, fret, role: ROLES[quality][i], note: chord[i] };
}

export function chordTones(root: Note, quality: Quality = "major"): ChordTone[] {
  const chord = triad(root, quality);
  const pitches = chord.map(pitchClassOf);
  const tones: ChordTone[] = [];
  TUNING.forEach((open, string) => {
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      if (pitches.includes((open + fret) % 12)) tones.push(toneAt(chord, string, fret, quality));
    }
  });
  return tones;
}
