import type { Note } from "@/lib/theory/notes";
import { TUNING, toneAt, triad, type ChordTone, type Quality } from "./fretboard";
import { mod, pitchClassOf, type SpelledNote } from "./spelling";

export type ShapeName = "C" | "A" | "G" | "E" | "D";
export const SHAPE_NAMES: readonly ShapeName[] = ["C", "A", "G", "E", "D"];

export type CagedShape = {
  name: ShapeName;
  label: string; // "D" in major, "Dm" in minor
  rootString: number;
  tones: ChordTone[]; // low string → high string
  lowFret: number;
  highFret: number;
};

type Template = { rootString: number; offsets: [number, number][] };

// The five open-chord shapes as [string, fret offset from the root fret].
const TEMPLATES: Record<Quality, Record<ShapeName, Template>> = {
  major: {
    C: { rootString: 1, offsets: [[1, 0], [2, -1], [3, -3], [4, -2], [5, -3]] },
    A: { rootString: 1, offsets: [[1, 0], [2, 2], [3, 2], [4, 2], [5, 0]] },
    G: { rootString: 0, offsets: [[0, 0], [1, -1], [2, -3], [3, -3], [4, -3], [5, 0]] },
    E: { rootString: 0, offsets: [[0, 0], [1, 2], [2, 2], [3, 1], [4, 0], [5, 0]] },
    D: { rootString: 2, offsets: [[2, 0], [3, 2], [4, 3], [5, 2]] },
  },
  minor: {
    C: { rootString: 1, offsets: [[1, 0], [2, -2], [3, -3], [4, -2], [5, 0]] }, // x31013
    A: { rootString: 1, offsets: [[1, 0], [2, 2], [3, 2], [4, 1], [5, 0]] }, // x02210
    G: { rootString: 0, offsets: [[0, 0], [1, -2], [2, -3], [3, -3], [4, 0], [5, 0]] }, // 310033
    E: { rootString: 0, offsets: [[0, 0], [1, 2], [2, 2], [3, 0], [4, 0], [5, 0]] }, // 022000
    D: { rootString: 2, offsets: [[2, 0], [3, 2], [4, 3], [5, 1]] }, // xx0231
  },
};

export function cagedShapes(root: Note, quality: Quality = "major", open: readonly number[] = TUNING): CagedShape[] {
  return cagedShapesFor(triad(root, quality), quality, open);
}

// From an already-spelled triad, so a progression's chords keep the Circle's spelling.
export function cagedShapesFor(
  chord: readonly [SpelledNote, SpelledNote, SpelledNote],
  quality: Quality,
  open: readonly number[] = TUNING,
): CagedShape[] {
  const rootPitch = pitchClassOf(chord[0]);
  return SHAPE_NAMES.map((name) => {
    const { rootString, offsets } = TEMPLATES[quality][name];
    let rootFret = mod(rootPitch - open[rootString], 12);
    // Slide up an octave rather than past the nut.
    if (offsets.some(([, offset]) => rootFret + offset < 0)) rootFret += 12;
    const tones = offsets.map(([string, offset]) => toneAt(chord, string, rootFret + offset, quality, open));
    const frets = tones.map((t) => t.fret);
    const label = quality === "minor" ? `${name}m` : name;
    return { name, label, rootString, tones, lowFret: Math.min(...frets), highFret: Math.max(...frets) };
  }).sort((a, b) => a.lowFret - b.lowFret || a.highFret - b.highFret);
}
