"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Note } from "@/lib/theory/notes";
import type { Tool } from "@/lib/tools";
import {
  getKeyState,
  getServerKeyState,
  subscribeKeyState,
  updateKeyState,
  withLinked,
  withRoot,
} from "./store";

function useKeyState() {
  return useSyncExternalStore(subscribeKeyState, getKeyState, getServerKeyState);
}

export function useToolKey(tool: Tool): [Note, (note: Note) => void] {
  const state = useKeyState();
  const setRoot = useCallback(
    (note: Note) => updateKeyState(withRoot(getKeyState(), tool, note)),
    [tool],
  );
  return [state.linked ? state.shared : state.tools[tool], setRoot];
}

export function useLinked(tool: Tool): [boolean, (linked: boolean) => void] {
  const state = useKeyState();
  const setLinked = useCallback(
    (linked: boolean) => updateKeyState(withLinked(getKeyState(), tool, linked)),
    [tool],
  );
  return [state.linked, setLinked];
}
