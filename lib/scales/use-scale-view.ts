"use client";

import { useCallback, useSyncExternalStore } from "react";
import { viewStore, type ScaleViewState } from "./view-store";

export function useScaleView(): [ScaleViewState, (patch: Partial<ScaleViewState>) => void] {
  const view = useSyncExternalStore(viewStore.subscribe, viewStore.get, viewStore.getServer);
  const update = useCallback((patch: Partial<ScaleViewState>) => viewStore.set({ ...viewStore.get(), ...patch }), []);
  return [view, update];
}
