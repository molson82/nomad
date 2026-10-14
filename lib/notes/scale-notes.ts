import { circleKeyFor, majorScale } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import { scaleDegrees, scaleNotes, type Tonality } from "@/lib/theory/scales";
import { formatNote } from "@/lib/theory/spelling";
import type { TheoryNote } from "./types";

export function scaleBuildNote(root: Note, tonality: Tonality): TheoryNote {
  const s = majorScale(circleKeyFor(root)).map(formatNote);
  return {
    title: tonality === "major" ? `Building ${s[0]} major` : `Building ${s[5]} minor`,
    paragraphs: [
      ["A major scale climbs seven notes in a fixed pattern of whole (W) and half (H) steps: ", { strong: "W W H W W W H" }, "."],
      ["From ", s[0], ": ", { strong: [...s, s[0]].join(" – ") }, ". The half steps fall at ", { strong: `${s[2]}–${s[3]}` }, " and ", { strong: `${s[6]}–${s[0]}` }, "."],
      tonality === "major"
        ? ["The numbers 1–7 are each note's place in the scale."]
        : ["Minor starts the same notes from ⑥ (", { strong: s[5] }, ") and renumbers, so its 3rd, 6th and 7th come out flat: ", { strong: "♭3 ♭6 ♭7" }, "."],
    ],
  };
}

// The note named "blue" is read from the Scale Compass's own blues view, never re-derived.
export function pentatonicNote(root: Note, tonality: Tonality): TheoryNote {
  const degreeNote = (type: "scale" | "blues", label: string) => {
    const view = { tonality, type };
    return formatNote(scaleNotes(root, view)[scaleDegrees(root, view).indexOf(label)]);
  };
  const [dropped, first, second] =
    tonality === "major" ? ["4th and 7th", degreeNote("scale", "4"), degreeNote("scale", "7")] : ["2nd and ♭6th", degreeNote("scale", "2"), degreeNote("scale", "♭6")];
  const pentatonic = scaleNotes(root, { tonality, type: "pentatonic" }).map(formatNote).join(" ");
  return {
    title: "Pentatonic and blues",
    paragraphs: [
      ["Pentatonic keeps five of the seven notes by dropping the ", dropped, " (", { strong: first }, " and ", { strong: second }, ") — the two that sit a half step from a neighbour, so nothing clashes: ", { strong: pentatonic }, "."],
      tonality === "minor"
        ? ["Blues adds one more, the ♭5 (", { strong: degreeNote("blues", "♭5") }, ") — the “blue note” between the 4th and 5th that you bend into and out of."]
        : ["Blues adds one more, the ♭3 (", { strong: degreeNote("blues", "♭3") }, ") — the “blue note” between the 2nd and 3rd that you slide up from."],
    ],
  };
}
