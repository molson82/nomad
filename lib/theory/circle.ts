import { NOTES, type Note } from "@/lib/theory/notes";
import { LETTERS, formatNote, pitchClassOf, spellAs, type Letter, type SpelledNote } from "./spelling";

export type CircleKey = {
  index: number; // position clockwise from C at 12 o'clock
  tonic: SpelledNote;
  pitchClass: number;
  sharpsOrFlats: number; // +n sharps, -n flats
  relativeMinor: SpelledNote;
  enharmonic: SpelledNote | null; // shown small under the tonic (G♭ under F♯)
};

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

// Walk the letters from the tonic so every scale uses each letter once.
function majorScaleOf(tonic: SpelledNote): SpelledNote[] {
  const start = LETTERS.indexOf(tonic.letter);
  const root = pitchClassOf(tonic);
  return MAJOR_STEPS.map((step, i) => spellAs(LETTERS[(start + i) % 7], (root + step) % 12));
}

// [letter, accidental, sharpsOrFlats] clockwise from C; 6 o'clock is F♯ (G♭ shown beneath).
const TONICS: [Letter, number, number][] = [
  ["C", 0, 0], ["G", 0, 1], ["D", 0, 2], ["A", 0, 3], ["E", 0, 4], ["B", 0, 5],
  ["F", 1, 6], ["D", -1, -5], ["A", -1, -4], ["E", -1, -3], ["B", -1, -2], ["F", 0, -1],
];

export const CIRCLE: CircleKey[] = TONICS.map(([letter, accidental, sharpsOrFlats], index) => {
  const tonic: SpelledNote = { letter, accidental };
  return {
    index,
    tonic,
    pitchClass: pitchClassOf(tonic),
    sharpsOrFlats,
    relativeMinor: majorScaleOf(tonic)[5],
    enharmonic: index === 6 ? { letter: "G", accidental: -1 } : null,
  };
});

export function majorScale(key: CircleKey): SpelledNote[] {
  return majorScaleOf(key.tonic);
}

const SHARP_ORDER: Letter[] = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER: Letter[] = ["B", "E", "A", "D", "G", "C", "F"];

export function keySignature(key: CircleKey): SpelledNote[] {
  const n = key.sharpsOrFlats;
  return n >= 0
    ? SHARP_ORDER.slice(0, n).map((letter) => ({ letter, accidental: 1 }))
    : FLAT_ORDER.slice(0, -n).map((letter) => ({ letter, accidental: -1 }));
}

// The skeleton's shared root is a pitch-class name (NOTES[i] is pitch class i).
export function circleKeyFor(note: Note): CircleKey {
  const pitchClass = NOTES.indexOf(note);
  return CIRCLE.find((key) => key.pitchClass === pitchClass)!;
}

export function rootNoteFor(key: CircleKey): Note {
  return NOTES[key.pitchClass];
}

export function describeKey(key: CircleKey): string {
  const n = Math.abs(key.sharpsOrFlats);
  const kind = key.sharpsOrFlats > 0 ? "sharp" : "flat";
  const accidentals = n === 0 ? "no sharps or flats" : `${n} ${kind}${n > 1 ? "s" : ""}`;
  return `${formatNote(key.tonic)} major, ${accidentals}`;
}
