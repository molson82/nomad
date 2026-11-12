"use client";

import { useMemo, useSyncExternalStore } from "react";
import { stepStore } from "@/lib/chords/step-store";
import { EMPTY_PROGRESSION, progressionStore, withChord, withPreset, withoutStep, type Progression } from "./progression";

// The Chord Compass step is an index into the degrees, so it is stale once they change.
function update(next: Progression) {
  const prev = progressionStore.get().degrees;
  progressionStore.set(next);
  if (prev.length !== next.degrees.length || prev.some((degree, i) => degree !== next.degrees[i])) {
    stepStore.set(null);
  }
}

export function useProgression() {
  const progression: Progression = useSyncExternalStore(
    progressionStore.subscribe,
    progressionStore.get,
    progressionStore.getServer,
  );
  const actions = useMemo(
    () => ({
      add: (degree: number) => update(withChord(progressionStore.get(), degree)),
      remove: (index: number) => update(withoutStep(progressionStore.get(), index)),
      clear: () => update(EMPTY_PROGRESSION),
      pick: (id: string) => update(withPreset(id)),
    }),
    [],
  );
  return [progression, actions] as const;
}
