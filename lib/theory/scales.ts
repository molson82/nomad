import type { Note } from "@/lib/theory/notes";
import { circleKeyFor, majorScale } from "./circle";
import { MAX_FRET, TUNING } from "./fretboard";
import { formatNote, mod, pitchClassOf, type SpelledNote } from "./spelling";

export type Tonality = "major" | "minor";
export type ScaleType = "scale" | "pentatonic" | "blues";
export type ScaleView = { tonality: Tonality; type: ScaleType };
export type PositionLetter = "G" | "E" | "D" | "C" | "A";
// Neck order of the five regions for a major key; box N is POSITION_LETTERS[N - 1].
export const POSITION_LETTERS: readonly PositionLetter[] = ["G", "E", "D", "C", "A"];
export type NoteKind = "tonic" | "tone" | "relative" | "blue";
export type ScaleNote = { string: number; fret: number; label: string; note: SpelledNote; kind: NoteKind };
export type Position = {
  letter: PositionLetter;
  box: 1 | 2 | 3 | 4 | 5 | null;
  notes: ScaleNote[];
  lowFret: number;
  highFret: number;
};

type Tone = { note: SpelledNote; label: string; kind: NoteKind };

const MAJOR_LABELS = ["1", "2", "3", "4", "5", "6", "7"];
// Minor numbering indexed by MAJOR degree: the relative minor's root is major ⑥.
const MINOR_LABELS = ["♭3", "4", "5", "♭6", "♭7", "1", "2"];
const PENTATONIC = [0, 1, 2, 4, 5]; // major degrees 1 2 3 5 6 — the relative minor's 1 ♭3 4 5 ♭7

// The relative minor shares the major's notes, so one major key drives all six views.
function viewTones(root: Note, view: ScaleView): Tone[] {
  const scale = majorScale(circleKeyFor(root));
  const degrees = view.type === "scale" ? [0, 1, 2, 3, 4, 5, 6] : PENTATONIC;
  const ordered = view.tonality === "major" ? degrees : [...degrees.filter((i) => i >= 5), ...degrees.filter((i) => i < 5)];
  const labels = view.tonality === "major" ? MAJOR_LABELS : MINOR_LABELS;
  const tones: Tone[] = ordered.map((i) => ({
    note: scale[i],
    label: labels[i],
    kind: labels[i] === "1" ? "tonic" : view.tonality === "major" && i === 5 ? "relative" : "tone",
  }));
  if (view.type === "blues") {
    // One pitch: the major ♭3, which is the relative minor's ♭5.
    const blue: Tone = {
      note: { letter: scale[2].letter, accidental: scale[2].accidental - 1 },
      label: view.tonality === "major" ? "♭3" : "♭5",
      kind: "blue",
    };
    tones.splice(tones.findIndex((t) => t.label === (view.tonality === "major" ? "2" : "4")) + 1, 0, blue);
  }
  return tones;
}

export function scaleDegrees(root: Note, view: ScaleView): string[] {
  return viewTones(root, view).map((t) => t.label);
}

export function scaleNotes(root: Note, view: ScaleView): SpelledNote[] {
  return viewTones(root, view).map((t) => t.note);
}

export function scaleName(root: Note, view: ScaleView): string {
  const tonic = viewTones(root, view)[0].note;
  return `${formatNote(tonic)} ${view.tonality}${view.type === "scale" ? "" : ` ${view.type}`}`;
}

function noteAt(tones: Tone[], string: number, fret: number): ScaleNote | null {
  const pitch = (TUNING[string] + fret) % 12;
  const tone = tones.find((t) => pitchClassOf(t.note) === pitch);
  return tone ? { string, fret, label: tone.label, note: tone.note, kind: tone.kind } : null;
}

export function neckNotes(root: Note, view: ScaleView): ScaleNote[] {
  const tones = viewTones(root, view);
  const notes: ScaleNote[] = [];
  for (let string = 0; string < 6; string++) {
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      const note = noteAt(tones, string, fret);
      if (note) notes.push(note);
    }
  }
  return notes;
}

// CAGED major-scale positions: offsets from the root fret on the root string, per string (6th → 1st).
const FULL: Record<PositionLetter, { rootString: number; offsets: number[][] }> = {
  G: { rootString: 0, offsets: [[-3, -1, 0], [-3, -1, 0], [-3, -1, 1], [-3, -1], [-3, -2, 0], [-3, -1, 0]] },
  E: { rootString: 0, offsets: [[-1, 0, 2], [-1, 0, 2], [-1, 1, 2], [-1, 1, 2], [0, 2], [-1, 0, 2]] },
  D: { rootString: 2, offsets: [[0, 2, 3], [0, 2], [-1, 0, 2], [-1, 0, 2], [0, 2, 3], [0, 2, 3]] },
  C: { rootString: 1, offsets: [[-3, -2, 0], [-3, -1, 0], [-3, -1, 0], [-3, -1], [-3, -2, 0], [-3, -2, 0]] },
  A: { rootString: 1, offsets: [[0, 2], [-1, 0, 2], [-1, 0, 2], [-1, 1, 2], [0, 2, 3], [0, 2]] },
};

// Pentatonic boxes 1–5: frets above the relative minor's root on the 6th string.
const BOXES: number[][][] = [
  [[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]],
  [[3, 5], [2, 5], [2, 5], [2, 4], [3, 5], [3, 5]],
  [[5, 7], [5, 7], [5, 7], [4, 7], [5, 8], [5, 7]],
  [[7, 10], [7, 10], [7, 9], [7, 9], [8, 10], [7, 10]],
  [[10, 12], [10, 12], [9, 12], [9, 12], [10, 12], [10, 12]],
];

function makePosition(tones: Tone[], letter: PositionLetter, box: Position["box"], cells: [number, number][]): Position {
  const notes = cells.map(([string, fret]) => {
    const note = noteAt(tones, string, fret);
    if (!note) throw new Error(`string ${string} fret ${fret} is not in the scale`);
    return note;
  });
  const frets = notes.map((n) => n.fret);
  return { letter, box, notes, lowFret: Math.min(...frets), highFret: Math.max(...frets) };
}

export function positions(root: Note, view: ScaleView): Position[] {
  const tones = viewTones(root, view);
  const scale = majorScale(circleKeyFor(root));
  let list: Position[];

  if (view.type === "scale") {
    const rootPitch = pitchClassOf(scale[0]);
    list = POSITION_LETTERS.map((letter) => {
      const { rootString, offsets } = FULL[letter];
      let rootFret = mod(rootPitch - TUNING[rootString], 12);
      if (offsets.flat().some((offset) => rootFret + offset < 0)) rootFret += 12; // up an octave, not past the nut
      return makePosition(tones, letter, null, offsets.flatMap((row, string) => row.map((o) => [string, rootFret + o] as [number, number])));
    });
  } else {
    const minorRootFret = mod(pitchClassOf(scale[5]) - TUNING[0], 12);
    const bluePitch = view.type === "blues" ? pitchClassOf(tones.find((t) => t.kind === "blue")!.note) : null;
    list = BOXES.map((rows, i) => {
      let base = minorRootFret;
      // Lowest octave that fits, like the full-scale positions, so box N shares letter N's region.
      if (rows.flat().every((offset) => base - 12 + offset >= 0)) base -= 12;
      const cells = rows.flatMap((row, string) => row.map((o) => [string, base + o] as [number, number]));
      const position = makePosition(tones, POSITION_LETTERS[i], (i + 1) as Position["box"], cells);
      if (bluePitch !== null) {
        for (let string = 0; string < 6; string++) {
          for (let fret = position.lowFret; fret <= position.highFret; fret++) {
            if ((TUNING[string] + fret) % 12 === bluePitch) position.notes.push(noteAt(tones, string, fret)!);
          }
        }
        position.notes.sort((a, b) => a.string - b.string || a.fret - b.fret);
      }
      return position;
    });
  }

  return list.sort((a, b) => a.lowFret - b.lowFret || a.highFret - b.highFret);
}
