import type { Note } from "@/lib/theory/notes";
import { scaleDegrees, type Position, type ScaleView } from "@/lib/theory/scales";

const STEPS = { major: "W · W · H · W · W · W · H", minor: "W · H · W · W · H · W · W" } as const;

// Letters for full scales; boxes (with their letter in the title) for pentatonic and blues.
export function positionText(position: Position, view: ScaleView) {
  const boxes = view.type !== "scale";
  const shortName = boxes ? `Box ${position.box}` : `${position.letter}-shape`;
  const name = boxes ? shortName : `${shortName} position`;
  const { lowFret: low, highFret: high } = position;
  return {
    name,
    shortName,
    title: boxes ? `${shortName} · ${position.letter}-shape` : name,
    subtitle: `frets ${low}–${high}${low === 0 ? " · open position" : ""}`,
    chipLabel: boxes ? shortName : position.letter,
    ariaLabel: `${name}, frets ${low} to ${high}`,
  };
}

export function formulaLine(root: Note, view: ScaleView): string {
  return view.type === "scale" ? STEPS[view.tonality] : scaleDegrees(root, view).join(" · ");
}
