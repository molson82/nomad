import { MAX_FRET } from "@/lib/theory/fretboard";

// One viewBox for the overview at every size; the SVG scales to its container.
export const NECK = { width: 680, height: 158, nutX: 30, fretW: 43, top: 18, stringGap: 22 } as const;

export const fretLineX = (fret: number) => NECK.nutX + fret * NECK.fretW;
export const fretCenterX = (fret: number) => (fret === 0 ? NECK.nutX / 2 : NECK.nutX + (fret - 0.5) * NECK.fretW);
export const stringY = (string: number) => NECK.top + (5 - string) * NECK.stringGap; // high E on top

export function fretAtX(viewX: number): number {
  if (viewX < NECK.nutX) return 0;
  return Math.min(MAX_FRET, Math.max(1, Math.ceil((viewX - NECK.nutX) / NECK.fretW)));
}
