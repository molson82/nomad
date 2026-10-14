import { isNote, type Note } from "@/lib/theory/notes";
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

// Module-level store read through useSyncExternalStore. Loaded lazily so the
// server render (no localStorage) never touches it.
let state: KeyState | null = null;
const listeners = new Set<() => void>();

function load(): KeyState {
  try {
    return parseKeyState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_STATE; // storage blocked (e.g. Safari private mode): run in memory
  }
}

export function getKeyState(): KeyState {
  return (state ??= load());
}

export function getServerKeyState(): KeyState {
  return DEFAULT_STATE;
}

export function updateKeyState(next: KeyState): void {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the change still applies for this session.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeKeyState(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    state = parseKeyState(event.newValue);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
