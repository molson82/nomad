"use client";

import { useSyncExternalStore } from "react";
import type { TuningOffsets } from "@/lib/theory/tuning";
import { tuningStore } from "./tuning-store";

export function useTuning(): [TuningOffsets, (tuning: TuningOffsets) => void] {
  const tuning = useSyncExternalStore(tuningStore.subscribe, tuningStore.get, tuningStore.getServer);
  return [tuning, tuningStore.set];
}
