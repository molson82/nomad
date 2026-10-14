"use client";

import { useMemo, useSyncExternalStore } from "react";
import { EMPTY_PROGRESSION, progressionStore, withChord, withPreset, withoutStep, type Progression } from "./progression";

export function useProgression() {
  const progression: Progression = useSyncExternalStore(
    progressionStore.subscribe,
    progressionStore.get,
    progressionStore.getServer,
  );
  const actions = useMemo(
    () => ({
      add: (degree: number) => progressionStore.set(withChord(progressionStore.get(), degree)),
      remove: (index: number) => progressionStore.set(withoutStep(progressionStore.get(), index)),
      clear: () => progressionStore.set(EMPTY_PROGRESSION),
      pick: (id: string) => progressionStore.set(withPreset(id)),
    }),
    [],
  );
  return [progression, actions] as const;
}
