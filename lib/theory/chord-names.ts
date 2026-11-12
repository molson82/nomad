import { majorScale, type CircleKey } from "./circle";
import { NOTES } from "./notes";
import { LETTERS, formatExact, formatNote, mod, pitchClassOf, spellAs, type Letter, type SpelledNote } from "./spelling";
import { STANDARD_OFFSETS, type TuningOffsets } from "./tuning";

export type Frets = readonly (number | null)[]; // six entries, low → high; null is silent
export type Voicing = { pitchClasses: number[]; bass: number }; // sorted, unique
export type ChordName = { text: string; root: number; suffix: string; bass: number };

const MAX_NAMES = 5;
// Pitch classes alone can't say which note is lowest.
const OPEN_ABSOLUTE = [40, 45, 50, 55, 59, 64];

type Quality = { suffix: string; required: number[]; optional?: number[]; letters?: Record<number, number> };

// Semitones above the root. Table order breaks ties, simplest first, then the root nearest above the bass,
// so a symmetric chord (dim7, aug) keeps its name in every key.
const QUALITIES: Quality[] = [
  { suffix: "5", required: [0, 7] },
  { suffix: "(no5)", required: [0, 4] },
  { suffix: "m(no5)", required: [0, 3] },
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
  { suffix: "maj7♯11", required: [0, 4, 11, 6], optional: [7], letters: { 6: 3 } },
  { suffix: "add11", required: [0, 4, 7, 5] },
  { suffix: "m6/9", required: [0, 3, 9, 2], optional: [7] },
  { suffix: "maj13", required: [0, 4, 11, 9], optional: [7, 2] },
];

// With the root not in the bass, a 7th chord reads before a 6th (Am7/E, then C6/E).
const AFTER_SEVENTHS = QUALITIES.findIndex((q) => q.suffix === "m7") + 0.5;
const slashOrder = (suffix: string, order: number) => (suffix === "6" || suffix === "m6" ? AFTER_SEVENTHS : order);

// With no key to follow, a chord with a minor third takes C♯ E♭ F♯ G♯ B♭ (G♯m), any other D♭ E♭ F♯ A♭ B♭ (D♭).
const MINOR_ROOTS = "CCDEEFFGGABB";
const OTHER_ROOTS = "CDDEEFFGAABB";

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

function qualityOf(suffix: string): Quality | undefined {
  return QUALITIES.find((q) => q.suffix === suffix);
}

function toneOf(root: SpelledNote, pitchClass: number, quality?: Quality): SpelledNote {
  const interval = mod(pitchClass - pitchClassOf(root), 12);
  const step = quality?.letters?.[interval] ?? LETTER_STEPS[interval];
  return spellAs(LETTERS[(LETTERS.indexOf(root.letter) + step) % 7], pitchClass);
}

// The key's spelling of a chord root, but not E♯ (or B♯, C♭, F♭) where the chord would need a double
// accidental: F major played in F♯ reads F, not E♯ with G♯♯.
function keyRoot(root: number, suffix: string, key?: CircleKey): SpelledNote | undefined {
  const inKey = key && majorScale(key).find((note) => pitchClassOf(note) === root);
  if (!inKey || formatNote(inKey) === formatExact(inKey)) return inKey;
  const quality = qualityOf(suffix);
  const doubled = quality?.required.some((i) => Math.abs(toneOf(inKey, root + i, quality).accidental) > 1);
  return doubled ? undefined : inKey;
}

function chordRoot(root: number, suffix: string, key?: CircleKey): SpelledNote {
  const quality = qualityOf(suffix);
  const minor = quality?.required.includes(3) && !quality.letters?.[3];
  return keyRoot(root, suffix, key) ?? spellAs((minor ? MINOR_ROOTS : OTHER_ROOTS)[root] as Letter, root);
}

// Neck labels keep the names players read (F, not E♯); exact prints the true letter for lists and names.
export function noteLabel(pitchClass: number, name: ChordName | null, key?: CircleKey, exact = false): string {
  const format = exact ? formatExact : formatNote;
  if (!name) return format(spellRoot(pitchClass, key));
  // The name's own root letter, so G♯m lists G♯ B D♯.
  const root = keyRoot(name.root, name.suffix, key) ?? spellAs(name.text[0] as Letter, name.root);
  const spelled = toneOf(root, pitchClass, qualityOf(name.suffix));
  // B♭♭ is correct on paper, but players read A.
  return format(Math.abs(spelled.accidental) > 1 ? spellRoot(pitchClass, key) : spelled);
}

export function noteList(v: Voicing, name: ChordName | null, key?: CircleKey): string[] {
  const from = name?.root ?? 0;
  return [...v.pitchClasses]
    .sort((a, b) => mod(a - from, 12) - mod(b - from, 12))
    .map((pc) => noteLabel(pc, name, key, true));
}

export function chordNames(v: Voicing, key?: CircleKey): ChordName[] {
  const named = (root: number, suffix: string): ChordName => {
    const base: ChordName = { text: formatExact(chordRoot(root, suffix, key)), root, suffix, bass: v.bass };
    const slash = root === v.bass ? "" : `/${noteLabel(v.bass, base, key, true)}`;
    return { ...base, text: `${base.text}${suffix}${slash}` };
  };
  if (v.pitchClasses.length === 1) {
    const pc = v.pitchClasses[0];
    return [{ text: formatNote(spellRoot(pc, key)), root: pc, suffix: "", bass: v.bass }];
  }

  const found: { name: ChordName; rank: number[] }[] = [];
  for (const root of v.pitchClasses) {
    const intervals = new Set(v.pitchClasses.map((pc) => mod(pc - root, 12)));
    QUALITIES.forEach((quality, order) => {
      const optional = quality.optional ?? [];
      const allowed = [...quality.required, ...optional];
      if (!quality.required.every((i) => intervals.has(i))) return;
      if (![...intervals].every((i) => allowed.includes(i))) return;
      const omitted = optional.filter((i) => !intervals.has(i)).length;
      found.push({ name: named(root, quality.suffix), rank: [root === v.bass ? 0 : 1, omitted, root === v.bass ? order : slashOrder(quality.suffix, order), mod(root - v.bass, 12)] });
    });
  }
  return found
    .sort((a, b) => a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1] || a.rank[2] - b.rank[2] || a.rank[3] - b.rank[3])
    .slice(0, MAX_NAMES)
    .map((entry) => entry.name);
}
