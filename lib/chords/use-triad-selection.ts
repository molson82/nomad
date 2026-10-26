"use client";

import { useSyncExternalStore } from "react";
import { triadStore, type TriadSelection } from "./triad-store";

export function useTriadSelection(): [TriadSelection, (selection: TriadSelection) => void] {
  const selection = useSyncExternalStore(triadStore.subscribe, triadStore.get, triadStore.getServer);
  return [selection, triadStore.set];
}
