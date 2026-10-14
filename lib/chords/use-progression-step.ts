"use client";

import { useSyncExternalStore } from "react";
import type { ProgressionStep } from "./progression-chords";
import { stepStore, validStep } from "./step-store";

export function useProgressionStep(steps: readonly ProgressionStep[]): [number | null, (step: number | null) => void] {
  const step = useSyncExternalStore(stepStore.subscribe, stepStore.get, stepStore.getServer);
  return [validStep(step, steps), stepStore.set];
}
