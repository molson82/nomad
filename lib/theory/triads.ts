import { MAX_FRET, toneAt, type ChordTone, type Quality } from "./fretboard";
import { pitchClassOf, type SpelledNote } from "./spelling";

export type Inversion = "root" | "first" | "second";
export const INVERSIONS: readonly Inversion[] = ["root", "first", "second"];
// The lowest of three adjacent strings: 0 = strings 6–5–4 … 3 = strings 3–2–1.
export type StringSet = 0 | 1 | 2 | 3;
export const STRING_SETS: readonly StringSet[] = [0, 1, 2, 3];

export type Triad = {
  set: StringSet;
  inversion: Inversion;
  frets: [number, number, number]; // low string → high string
  tones: ChordTone[];
  lowFret: number;
  highFret: number;
};

const MAX_SPAN = 4;

// The bass is the chord tone on the lowest string; the other two may sit above it in either order.
export function triadsOn(chord: readonly SpelledNote[], quality: Quality, open: readonly number[], set: StringSet): Triad[] {
  const pitches = chord.map(pitchClassOf);
  const fretsFor = (string: number, pitch: number) =>
    Array.from({ length: MAX_FRET + 1 }, (_, fret) => fret).filter((fret) => (open[string] + fret) % 12 === pitch);
  const triads: Triad[] = [];
  INVERSIONS.forEach((inversion, bass) => {
    const upper = [0, 1, 2].filter((i) => i !== bass);
    for (const [middle, top] of [upper, [...upper].reverse()]) {
      for (const f0 of fretsFor(set, pitches[bass])) {
        for (const f1 of fretsFor(set + 1, pitches[middle])) {
          for (const f2 of fretsFor(set + 2, pitches[top])) {
            const frets: [number, number, number] = [f0, f1, f2];
            const lowFret = Math.min(...frets);
            const highFret = Math.max(...frets);
            if (highFret - lowFret > MAX_SPAN) continue;
            const tones = frets.map((fret, i) => toneAt(chord, set + i, fret, quality, open));
            triads.push({ set, inversion, frets, tones, lowFret, highFret });
          }
        }
      }
    }
  });
  return triads.sort(
    (a, b) => a.lowFret - b.lowFret || a.highFret - b.highFret || INVERSIONS.indexOf(a.inversion) - INVERSIONS.indexOf(b.inversion),
  );
}
