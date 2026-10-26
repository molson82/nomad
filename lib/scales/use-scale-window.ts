"use client";

import { useSyncExternalStore } from "react";
import { windowStore } from "./window-store";

export function useScaleWindow(): [number, (index: number) => void] {
  const index = useSyncExternalStore(windowStore.subscribe, windowStore.get, windowStore.getServer);
  return [index, windowStore.set];
}
