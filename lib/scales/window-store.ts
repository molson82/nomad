import { createPersistedStore } from "@/lib/storage/persisted-store";
import type { ScaleNote } from "@/lib/theory/scales";

// When a tuning changes the intervals between strings, CAGED positions no longer apply;
// these overlapping windows take their place.
export const FRET_WINDOWS: readonly [number, number][] = [
  [0, 4],
  [2, 6],
  [5, 9],
  [7, 11],
  [10, 15],
];

export const WINDOW_KEY = "nomad:scales:window:v1";

export function parseWindow(raw: string | null): number {
  if (!raw) return 0;
  try {
    const value = JSON.parse(raw);
    return Number.isInteger(value) && value >= 0 && value < FRET_WINDOWS.length ? value : 0;
  } catch {
    return 0;
  }
}

export function notesInWindow(notes: ScaleNote[], [low, high]: readonly [number, number]): ScaleNote[] {
  return notes.filter((n) => n.fret >= low && n.fret <= high);
}

export const windowStore = createPersistedStore(WINDOW_KEY, parseWindow, 0);
