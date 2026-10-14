import { COMMON_PROGRESSIONS, chordName, diatonicChords, progressionLabel } from "@/lib/theory/chords";
import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { formatNote } from "@/lib/theory/spelling";
import { signatureText } from "./key-facts";
import type { Paragraph, Segment, TheoryNote } from "./types";

// The neighbours are named from the key's own scale (its 4th and 5th), so F♯'s right-hand neighbour reads C♯.
export function fifthsNote(root: Note): TheoryNote {
  const key = circleKeyFor(root);
  const scale = majorScale(key);
  const tonic = formatNote(key.tonic);
  const fifth = formatNote(scale[4]);
  const letters = scale.slice(0, 5).map((n) => n.letter).join(" ");
  return {
    title: "Why the circle moves in fifths",
    paragraphs: [
      ["Each step clockwise is a fifth up: count five letters from ", { strong: tonic }, " and you land on ", { strong: fifth }, ` (${letters}).`],
      ["Every step clockwise adds one sharp, and every step counter-clockwise adds one flat. ", { strong: `${tonic} major` }, " has ", { strong: signatureText(key) }, "."],
      ["So ", { strong: formatNote(scale[3]) }, " sits to its left and ", { strong: fifth }, " to its right — neighbours share all but one note, which is why they sound so close."],
    ],
  };
}

export function keyChordsNote(root: Note): TheoryNote {
  const key = circleKeyFor(root);
  const tonic = formatNote(key.tonic);
  const chords = diatonicChords(key);
  return {
    title: `The chords of ${tonic} major`,
    paragraphs: [
      ["Stack every other note of the ", tonic, " major scale — ", { strong: majorScale(key).map(formatNote).join(" ") }, " — and you get a three-note chord on each degree."],
      ["The pattern never changes: major, minor, minor, major, major, minor, diminished. In ", tonic, ": ", { strong: chords.map((c) => `${c.roman} ${chordName(c)}`).join(" · ") }, "."],
      ["The window shows them as neighbours: the majors IV · I · V on top, each with its relative minor underneath, and the one diminished chord on its own."],
    ],
  };
}

type Why = (chord: (degree: number) => string, tonic: string) => Segment[];

const WHY: Record<string, Why> = {
  pop: (c) => ["The V (", { strong: c(5) }, ") pulls back toward home, but instead of resolving the loop slips to vi (", { strong: c(6) }, "), the relative minor, then IV (", { strong: c(4) }, ") — so it circles forever without quite landing."],
  "ii-v-i": () => ["Each chord's root is a fifth above the next, the strongest move in the key: ii sets up V, and V resolves to I."],
  "i-iv-v": (_c, tonic) => ["The three major chords of the key; between them they contain every note of ", tonic, " major, which is why so many songs need nothing else."],
  "vi-iv-i-v": () => ["The Pop chords started from the relative minor, so the same loop feels darker and ends hanging on V."],
  fifties: () => ["Home, its relative minor, then IV and V climbing back to home — the doo-wop loop."],
};

export function progressionNote(root: Note, presetId: string | null): TheoryNote {
  const key = circleKeyFor(root);
  const scale = majorScale(key);
  const chords = diatonicChords(key);
  const chord = (degree: number) => chordName(chords[degree - 1]);
  const tonic = formatNote(key.tonic);
  const pull: Paragraph = ["V → I is the strongest pull in music: V contains the 7th of the scale (", { strong: formatNote(scale[6]) }, "), a half step below home (", { strong: tonic }, "), and it wants to rise."];
  const preset = COMMON_PROGRESSIONS.find((p) => p.id === presetId);
  if (!preset) {
    return {
      title: "Why progressions work",
      paragraphs: [["Chords in a progression trade tension and release: I is home, IV moves away, V leans back."], pull],
    };
  }
  return {
    title: `${preset.name} · ${progressionLabel(preset.degrees)}`,
    paragraphs: [[{ strong: preset.degrees.map(chord).join(" – ") }, ". ", ...WHY[preset.id](chord, tonic)], pull],
  };
}
