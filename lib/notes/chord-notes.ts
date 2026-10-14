import type { CagedShape } from "@/lib/theory/caged";
import { circleKeyFor } from "@/lib/theory/circle";
import type { Quality } from "@/lib/theory/fretboard";
import type { Note } from "@/lib/theory/notes";
import { formatNote, type SpelledNote } from "@/lib/theory/spelling";
import { signatureText } from "./key-facts";
import type { Paragraph, TheoryNote } from "./types";

export function chordBuildNote(chord: readonly SpelledNote[], quality: Quality): TheoryNote {
  const notes = { strong: chord.map(formatNote).join(" · ") };
  const first: Paragraph =
    quality === "major"
      ? ["A major chord is the 1st, 3rd and 5th notes of its major scale: ", notes, ". The 3rd is four frets above the root; the 5th is seven."]
      : ["A minor chord lowers the 3rd by one fret: ", notes, ". That one note is the whole difference between major and minor."];
  return {
    title: `How ${formatNote(chord[0])} ${quality} is built`,
    paragraphs: [first, ["Everything you see on the neck is one of those three notes — the black dots are the root."]],
  };
}

export function cagedNote(chord: readonly SpelledNote[], quality: Quality, shapes: readonly CagedShape[]): TheoryNote {
  const root = formatNote(chord[0]);
  const range = (s: CagedShape) => `${s.lowFret}–${s.highFret}`;
  const [a, b, c, d, e] = shapes;
  return {
    title: "CAGED: five shapes, one chord",
    paragraphs: [
      ["Every ", quality, " chord can be played with the five open-chord shapes ", quality === "minor" ? "Cm, Am, Gm, Em and Dm" : "C, A, G, E and D", ", slid up the neck until their root lands on ", { strong: root }, "."],
      [
        "Each shape shares its root notes with the next, so they link end to end: in ",
        quality === "minor" ? `${root}m` : root,
        " the ",
        { strong: `${a.label}-shape` },
        ` (frets ${range(a)}) hands its root to the `,
        { strong: `${b.label}-shape` },
        ` (${range(b)}), then ${c.label} (${range(c)}), ${d.label} (${range(d)}) and ${e.label} (${range(e)}).`,
      ],
      ["Learn where the root sits in each shape and you can find ", root, " anywhere on the neck."],
    ],
  };
}

export function relativeMinorNote(root: Note): TheoryNote {
  const key = circleKeyFor(root);
  const tonic = formatNote(key.tonic);
  const sixth = formatNote(key.relativeMinor);
  return {
    title: `${tonic} major and ${sixth} minor`,
    paragraphs: [
      ["Start the ", tonic, " major scale on its 6th note, ", { strong: sixth }, ", and you get ", { strong: `${sixth} minor` }, ": the same seven notes, just a different home."],
      ["That's why the two keys share every chord and the same key signature (", signatureText(key), "), and why switching to Minor keeps you in the same place on the neck."],
    ],
  };
}
