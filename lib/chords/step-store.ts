import { createPersistedStore } from "@/lib/storage/persisted-store";
import type { ProgressionStep } from "./progression-chords";

// Which chord of the Circle's progression the Chord Compass shows; null is the key view.
export const STEP_KEY = "nomad:chords:step:v1";

export function parseStep(raw: string | null): number | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return Number.isInteger(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
}

// The progression lives in the Circle and can change under us.
export function validStep(step: number | null, steps: readonly ProgressionStep[]): number | null {
  return step !== null && step < steps.length && steps[step].quality ? step : null;
}

export const stepStore = createPersistedStore<number | null>(STEP_KEY, parseStep, null);
