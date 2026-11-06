"use client";

import { useSyncExternalStore } from "react";
import { useToolKey } from "@/lib/key-state/hooks";
import { getKeyState, updateKeyState } from "@/lib/key-state/store";
import { chordNames, noteList } from "@/lib/theory/chord-names";
import { circleKeyFor } from "@/lib/theory/circle";
import type { Note } from "@/lib/theory/notes";
import type { TuningOffsets } from "@/lib/theory/tuning";
import { useTuning } from "@/lib/tuning/use-tuning";
import type { Tool } from "@/lib/tools";
import { highlightFrets, lockIn, lockedVoicing, resetPath, type PathfinderState } from "./state";
import { pathfinderStore } from "./store";

export function usePathfinder(): [PathfinderState, (next: PathfinderState) => void] {
  const state = useSyncExternalStore(pathfinderStore.subscribe, pathfinderStore.get, pathfinderStore.getServer);
  return [state, pathfinderStore.set];
}

export function lockInKey(key: Note, offsets: TuningOffsets): void {
  const result = lockIn(pathfinderStore.get(), getKeyState(), key, offsets);
  pathfinderStore.set(result.pathfinder);
  updateKeyState(result.keys);
}

export function resetPathfinder(): void {
  const result = resetPath(pathfinderStore.get(), getKeyState());
  pathfinderStore.set(result.pathfinder);
  updateKeyState(result.keys);
}

export type ChordHighlight = { rings: { string: number; fret: number }[]; name: string };

// Computed from the lock every time, so it follows the tool's key and the tuning without being stored.
export function useChordHighlight(tool: Tool): ChordHighlight | null {
  const [{ lock }] = usePathfinder();
  const [toolKey] = useToolKey(tool);
  const [tuning] = useTuning();
  if (!lock) return null;
  const voicing = lockedVoicing(lock, toolKey);
  const key = circleKeyFor(toolKey);
  const rings = highlightFrets(lock, toolKey, tuning).flatMap((fret, string) => (fret === null ? [] : [{ string, fret }]));
  return { rings, name: chordNames(voicing, key)[0]?.text ?? noteList(voicing, null, key).join(" · ") };
}
