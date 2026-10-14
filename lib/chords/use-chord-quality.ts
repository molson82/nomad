"use client";

import { useSyncExternalStore } from "react";
import type { Quality } from "@/lib/theory/fretboard";
import { qualityStore } from "./quality-store";

export function useChordQuality(): [Quality, (quality: Quality) => void] {
  const quality = useSyncExternalStore(qualityStore.subscribe, qualityStore.get, qualityStore.getServer);
  return [quality, qualityStore.set];
}
