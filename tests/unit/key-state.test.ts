import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_STATE,
  STORAGE_KEY,
  parseKeyState,
  withLinked,
  withRoot,
  type KeyState,
} from "@/lib/key-state/store";

const state = (over: Partial<KeyState> = {}): KeyState => ({ ...DEFAULT_STATE, ...over });
const next: KeyState = { linked: true, shared: "G", tools: { circle: "D", chords: "A", scales: "E" } };

describe("withRoot", () => {
  it("unlinked: changes only that tool's key", () => {
    expect(withRoot(DEFAULT_STATE, "chords", "G")).toEqual({
      linked: false,
      shared: "C",
      tools: { circle: "C", chords: "G", scales: "C" },
    });
  });

  it("linked: changes the shared key and leaves per-tool keys alone", () => {
    const s = state({ linked: true });
    expect(withRoot(s, "chords", "G")).toEqual({ ...s, shared: "G" });
  });
});

describe("withLinked", () => {
  it("linking adopts the current tool's key as the shared key", () => {
    const s = state({ tools: { circle: "D", chords: "A", scales: "E" } });
    expect(withLinked(s, "chords", true)).toEqual({ ...s, linked: true, shared: "A" });
  });

  it("unlinking copies the shared key into every tool so nothing jumps", () => {
    const s = state({ linked: true, shared: "Bb", tools: { circle: "D", chords: "A", scales: "E" } });
    expect(withLinked(s, "circle", false)).toEqual({
      linked: false,
      shared: "Bb",
      tools: { circle: "Bb", chords: "Bb", scales: "Bb" },
    });
  });

  it("is a no-op when already in that state", () => {
    const s = state({ linked: true });
    expect(withLinked(s, "circle", true)).toBe(s);
  });
});

describe("parseKeyState", () => {
  it("returns the default for missing data", () => {
    expect(parseKeyState(null)).toEqual(DEFAULT_STATE);
  });

  it("round-trips a valid state", () => {
    expect(parseKeyState(JSON.stringify(next))).toEqual(next);
  });

  it.each([
    ["not json", "{oops"],
    ["null", "null"],
    ["an array", "[]"],
    ["a non-boolean linked", JSON.stringify({ ...next, linked: "yes" })],
    ["an unknown note", JSON.stringify({ ...next, shared: "H" })],
    ["a missing tool", JSON.stringify({ ...next, tools: { circle: "C", chords: "C" } })],
  ])("falls back to the default for %s", (_label, raw) => {
    expect(parseKeyState(raw)).toEqual(DEFAULT_STATE);
  });

  it("drops unexpected extra fields", () => {
    expect(parseKeyState(JSON.stringify({ ...next, extra: 1 }))).toEqual(next);
  });
});

describe("persisted store", () => {
  // The store caches state at module level; a fresh import per test gives a clean cache.
  async function loadStore() {
    vi.resetModules();
    return import("@/lib/key-state/store");
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("starts from the default when nothing is saved", async () => {
    const store = await loadStore();
    expect(store.getKeyState()).toEqual(DEFAULT_STATE);
  });

  it("loads saved state", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    const store = await loadStore();
    expect(store.getKeyState()).toEqual(next);
  });

  it("returns a stable snapshot between updates", async () => {
    const store = await loadStore();
    expect(store.getKeyState()).toBe(store.getKeyState());
  });

  it("persists updates and notifies subscribers", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeKeyState(listener);
    store.updateKeyState(next);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getKeyState()).toBe(next);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(next);
    unsubscribe();
    store.updateKeyState(DEFAULT_STATE);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps working in memory when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const store = await loadStore();
    expect(store.getKeyState()).toEqual(DEFAULT_STATE);
    store.updateKeyState(next);
    expect(store.getKeyState()).toEqual(next);
  });

  it("picks up changes made in another tab", async () => {
    const store = await loadStore();
    store.getKeyState();
    const listener = vi.fn();
    store.subscribeKeyState(listener);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(next) }));
    expect(listener).toHaveBeenCalled();
    expect(store.getKeyState()).toEqual(next);
  });

  it("ignores storage events for other keys", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    store.subscribeKeyState(listener);
    window.dispatchEvent(new StorageEvent("storage", { key: "something-else", newValue: "x" }));
    expect(listener).not.toHaveBeenCalled();
  });
});
