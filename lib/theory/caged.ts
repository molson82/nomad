import type { Note } from "@/lib/theory/notes";
import { TUNING, majorTriad, toneAt, type ChordTone } from "./fretboard";
import { mod, pitchClassOf } from "./spelling";

export type ShapeName = "C" | "A" | "G" | "E" | "D";
export const SHAPE_NAMES: readonly ShapeName[] = ["C", "A", "G", "E", "D"];

export type CagedShape = {
  name: ShapeName;
  rootString: number;
  tones: ChordTone[]; // low string → high string
  lowFret: number;
  highFret: number;
};

// The five open-chord shapes as [string, fret offset from the root fret].
const TEMPLATES: Record<ShapeName, { rootString: number; offsets: [number, number][] }> = {
  C: { rootString: 1, offsets: [[1, 0], [2, -1], [3, -3], [4, -2], [5, -3]] },
  A: { rootString: 1, offsets: [[1, 0], [2, 2], [3, 2], [4, 2], [5, 0]] },
  G: { rootString: 0, offsets: [[0, 0], [1, -1], [2, -3], [3, -3], [4, -3], [5, 0]] },
  E: { rootString: 0, offsets: [[0, 0], [1, 2], [2, 2], [3, 1], [4, 0], [5, 0]] },
  D: { rootString: 2, offsets: [[2, 0], [3, 2], [4, 3], [5, 2]] },
};

export function cagedShapes(root: Note): CagedShape[] {
  const triad = majorTriad(root);
  const rootPitch = pitchClassOf(triad[0]);
  return SHAPE_NAMES.map((name) => {
    const { rootString, offsets } = TEMPLATES[name];
    let rootFret = mod(rootPitch - TUNING[rootString], 12);
    // Slide up an octave rather than past the nut.
    if (offsets.some(([, offset]) => rootFret + offset < 0)) rootFret += 12;
    const tones = offsets.map(([string, offset]) => toneAt(triad, string, rootFret + offset));
    const frets = tones.map((t) => t.fret);
    return { name, rootString, tones, lowFret: Math.min(...frets), highFret: Math.max(...frets) };
  }).sort((a, b) => a.lowFret - b.lowFret || a.highFret - b.highFret);
}
