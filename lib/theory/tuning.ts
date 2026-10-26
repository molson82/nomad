import { TUNING } from "./fretboard";

// A tuning is six semitone offsets from standard, low string → high string.
export type TuningOffsets = readonly number[];
export type TuningPreset = { id: string; name: string; offsets: TuningOffsets };

export const STANDARD_OFFSETS: TuningOffsets = [0, 0, 0, 0, 0, 0];
export const MIN_OFFSET = -5;
export const MAX_OFFSET = 4;

export const TUNING_PRESETS: readonly TuningPreset[] = [
  { id: "standard", name: "Standard", offsets: STANDARD_OFFSETS },
  { id: "half-down", name: "Half step down", offsets: [-1, -1, -1, -1, -1, -1] },
  { id: "whole-down", name: "Whole step down", offsets: [-2, -2, -2, -2, -2, -2] },
  { id: "drop-d", name: "Drop D", offsets: [-2, 0, 0, 0, 0, 0] },
  { id: "dadgad", name: "DADGAD", offsets: [-2, 0, 0, 0, -2, -2] },
  { id: "open-g", name: "Open G", offsets: [-2, -2, 0, 0, 0, -2] },
  { id: "open-d", name: "Open D", offsets: [-2, 0, 0, -1, -2, -2] },
  { id: "open-c", name: "Open C", offsets: [-4, -2, -2, 0, 1, 0] },
  { id: "facgce", name: "FACGCE", offsets: [1, 0, -2, 0, 1, 0] },
];

// How guitarists write open strings: flats for the black keys (E♭ A♭ D♭ G♭ B♭), except F♯.
const PITCH_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

export const pitchName = (pitch: number) => PITCH_NAMES[((pitch % 12) + 12) % 12];

export function openPitches(t: TuningOffsets): number[] {
  return TUNING.map((open, s) => (((open + t[s]) % 12) + 12) % 12);
}

export const isUniform = (t: TuningOffsets) => t.every((o) => o === t[0]);
export const isStandard = (t: TuningOffsets) => t.every((o) => o === 0);

export function presetFor(t: TuningOffsets): TuningPreset | null {
  return TUNING_PRESETS.find((p) => p.offsets.every((o, s) => o === t[s])) ?? null;
}

export function tuningName(t: TuningOffsets): string {
  return presetFor(t)?.name ?? openPitches(t).map(pitchName).join(" ");
}

export function withStringStep(t: TuningOffsets, string: number, delta: 1 | -1): TuningOffsets {
  const next = Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, t[string] + delta));
  return t.map((o, s) => (s === string ? next : o));
}

export function parseTuning(raw: string | null): TuningOffsets {
  if (!raw) return STANDARD_OFFSETS;
  try {
    const value = JSON.parse(raw);
    const valid =
      Array.isArray(value) &&
      value.length === 6 &&
      value.every((o) => Number.isInteger(o) && o >= MIN_OFFSET && o <= MAX_OFFSET);
    return valid ? value : STANDARD_OFFSETS;
  } catch {
    return STANDARD_OFFSETS;
  }
}
