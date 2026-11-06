import { majorScale, type CircleKey } from "./circle";
import { NOTES } from "./notes";
import { LETTERS, formatNote, mod, pitchClassOf, spellAs, type Letter, type SpelledNote } from "./spelling";
import { STANDARD_OFFSETS, type TuningOffsets } from "./tuning";

export type Frets = readonly (number | null)[]; // six entries, low → high; null is silent
export type Voicing = { pitchClasses: number[]; bass: number }; // sorted, unique
export type ChordName = { text: string; root: number; suffix: string; bass: number };

const MAX_NAMES = 5;
// Pitch classes alone can't say which note is lowest.
const OPEN_ABSOLUTE = [40, 45, 50, 55, 59, 64];

type Quality = { suffix: string; required: number[]; optional?: number[]; letters?: Record<number, number> };

// Semitones above the root. Table order breaks ties, simplest first.
const QUALITIES: Quality[] = [
  { suffix: "5", required: [0, 7] },
  { suffix: "", required: [0, 4, 7] },
  { suffix: "m", required: [0, 3, 7] },
  { suffix: "dim", required: [0, 3, 6] },
  { suffix: "aug", required: [0, 4, 8] },
  { suffix: "sus2", required: [0, 2, 7] },
  { suffix: "sus4", required: [0, 5, 7] },
  { suffix: "6", required: [0, 4, 7, 9] },
  { suffix: "m6", required: [0, 3, 7, 9] },
  { suffix: "add9", required: [0, 4, 7, 2] },
  { suffix: "m(add9)", required: [0, 3, 7, 2] },
  { suffix: "6/9", required: [0, 4, 9, 2], optional: [7] },
  { suffix: "7", required: [0, 4, 10], optional: [7] },
  { suffix: "maj7", required: [0, 4, 11], optional: [7] },
  { suffix: "m7", required: [0, 3, 10], optional: [7] },
  { suffix: "m(maj7)", required: [0, 3, 11], optional: [7] },
  { suffix: "7sus4", required: [0, 5, 10], optional: [7] },
  { suffix: "m7♭5", required: [0, 3, 6, 10] },
  { suffix: "dim7", required: [0, 3, 6, 9] },
  { suffix: "7♭5", required: [0, 4, 6, 10] },
  { suffix: "7♯5", required: [0, 4, 8, 10] },
  { suffix: "9", required: [0, 4, 10, 2], optional: [7] },
  { suffix: "maj9", required: [0, 4, 11, 2], optional: [7] },
  { suffix: "m9", required: [0, 3, 10, 2], optional: [7] },
  { suffix: "7♭9", required: [0, 4, 10, 1], optional: [7] },
  { suffix: "7♯9", required: [0, 4, 10, 3], optional: [7], letters: { 3: 1 } },
  { suffix: "7♯11", required: [0, 4, 10, 6], optional: [7], letters: { 6: 3 } },
  { suffix: "11", required: [0, 10, 5], optional: [7, 2] },
  { suffix: "m11", required: [0, 3, 10, 5], optional: [7, 2] },
  { suffix: "13", required: [0, 4, 10, 9], optional: [7, 2] },
];

// Semitones above the root → letters above the root. Written dim7 sevenths read as the 6th, as players name them.
const LETTER_STEPS = [0, 1, 1, 2, 2, 3, 4, 4, 4, 5, 6, 6];

export function voicingOf(frets: Frets, offsets: TuningOffsets = STANDARD_OFFSETS): Voicing | null {
  const pitches = frets.flatMap((fret, s) => (fret === null ? [] : [OPEN_ABSOLUTE[s] + offsets[s] + fret]));
  if (pitches.length === 0) return null;
  return {
    pitchClasses: [...new Set(pitches.map((p) => mod(p, 12)))].sort((a, b) => a - b),
    bass: mod(Math.min(...pitches), 12),
  };
}

export function transposeVoicing(v: Voicing, semitones: number): Voicing {
  return {
    pitchClasses: v.pitchClasses.map((pc) => mod(pc + semitones, 12)).sort((a, b) => a - b),
    bass: mod(v.bass + semitones, 12),
  };
}

// A key's own spelling when it has the note, otherwise the app's fixed name.
export function spellRoot(pitchClass: number, key?: CircleKey): SpelledNote {
  const inKey = key && majorScale(key).find((note) => pitchClassOf(note) === pitchClass);
  return inKey || spellAs(NOTES[pitchClass][0] as Letter, pitchClass);
}

export function noteLabel(pitchClass: number, name: ChordName | null, key?: CircleKey): string {
  if (!name) return formatNote(spellRoot(pitchClass, key));
  const root = spellRoot(name.root, key);
  const interval = mod(pitchClass - name.root, 12);
  const quality = QUALITIES.find((q) => q.suffix === name.suffix);
  const step = quality?.letters?.[interval] ?? LETTER_STEPS[interval];
  const letter = LETTERS[(LETTERS.indexOf(root.letter) + step) % 7];
  return formatNote(spellAs(letter, pitchClass));
}

export function noteList(v: Voicing, name: ChordName | null, key?: CircleKey): string[] {
  const from = name?.root ?? 0;
  return [...v.pitchClasses]
    .sort((a, b) => mod(a - from, 12) - mod(b - from, 12))
    .map((pc) => noteLabel(pc, name, key));
}

export function chordNames(v: Voicing, key?: CircleKey): ChordName[] {
  const named = (root: number, suffix: string): ChordName => {
    const base: ChordName = { text: "", root, suffix, bass: v.bass };
    const slash = root === v.bass ? "" : `/${noteLabel(v.bass, base, key)}`;
    return { ...base, text: `${formatNote(spellRoot(root, key))}${suffix}${slash}` };
  };
  if (v.pitchClasses.length === 1) return [named(v.pitchClasses[0], "")];

  const found: { name: ChordName; rank: [number, number, number] }[] = [];
  for (const root of v.pitchClasses) {
    const intervals = new Set(v.pitchClasses.map((pc) => mod(pc - root, 12)));
    QUALITIES.forEach((quality, order) => {
      const optional = quality.optional ?? [];
      const allowed = [...quality.required, ...optional];
      if (!quality.required.every((i) => intervals.has(i))) return;
      if (![...intervals].every((i) => allowed.includes(i))) return;
      const omitted = optional.filter((i) => !intervals.has(i)).length;
      found.push({ name: named(root, quality.suffix), rank: [root === v.bass ? 0 : 1, omitted, order] });
    });
  }
  return found
    .sort((a, b) => a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1] || a.rank[2] - b.rank[2])
    .slice(0, MAX_NAMES)
    .map((entry) => entry.name);
}
