import { isNote, type Note } from "@/lib/theory/notes";
import { createPersistedStore } from "@/lib/storage/persisted-store";
import { TOOLS, type Tool } from "@/lib/tools";

export type KeyState = { linked: boolean; shared: Note; tools: Record<Tool, Note> };

export const STORAGE_KEY = "nomad:keys:v1";

export const DEFAULT_STATE: KeyState = {
  linked: false,
  shared: "C",
  tools: { circle: "C", chords: "C", scales: "C" },
};

export function parseKeyState(raw: string | null): KeyState {
  if (!raw) return DEFAULT_STATE;
  try {
    const value = JSON.parse(raw);
    if (
      typeof value?.linked === "boolean" &&
      isNote(value.shared) &&
      TOOLS.every((tool) => isNote(value.tools?.[tool]))
    ) {
      return {
        linked: value.linked,
        shared: value.shared,
        tools: { circle: value.tools.circle, chords: value.tools.chords, scales: value.tools.scales },
      };
    }
  } catch {
    // Corrupt JSON: fall through to the default.
  }
  return DEFAULT_STATE;
}

export function withRoot(state: KeyState, tool: Tool, note: Note): KeyState {
  return state.linked
    ? { ...state, shared: note }
    : { ...state, tools: { ...state.tools, [tool]: note } };
}

// Linking adopts the key on screen; unlinking hands every tool the shared key,
// so neither direction makes any tool's key jump.
export function withLinked(state: KeyState, tool: Tool, linked: boolean): KeyState {
  if (linked === state.linked) return state;
  if (linked) return { ...state, linked: true, shared: state.tools[tool] };
  const { shared } = state;
  return { linked: false, shared, tools: { circle: shared, chords: shared, scales: shared } };
}

const store = createPersistedStore(STORAGE_KEY, parseKeyState, DEFAULT_STATE);

export const getKeyState = store.get;
export const getServerKeyState = store.getServer;
export const updateKeyState = store.set;
export const subscribeKeyState = store.subscribe;
