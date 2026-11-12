import { afterEach, describe, expect, it, vi } from "vitest";
import { createPersistedStore } from "@/lib/storage/persisted-store";

const KEY = "nomad:test:v1";

function storageEvent(key: string | null, newValue: string | null) {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("createPersistedStore cross-tab sync", () => {
  it("parses each storage event once and notifies every subscriber with the same object", () => {
    const parse = vi.fn((raw: string | null) => (raw ? (JSON.parse(raw) as { n: number }) : { n: 0 }));
    const store = createPersistedStore(KEY, parse, { n: 0 });
    const seen: { n: number }[] = [];
    const unsubs = [1, 2, 3].map(() => store.subscribe(() => seen.push(store.get())));
    parse.mockClear();

    storageEvent(KEY, JSON.stringify({ n: 5 }));

    expect(parse).toHaveBeenCalledTimes(1);
    expect(seen).toHaveLength(3);
    expect(seen[0]).toEqual({ n: 5 });
    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).toBe(seen[0]);
    unsubs.forEach((unsub) => unsub());
  });

  it("ignores events for other keys", () => {
    const store = createPersistedStore(KEY, (raw) => raw ?? "fallback", "fallback");
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    storageEvent("nomad:other:v1", "x");
    expect(listener).not.toHaveBeenCalled();
    unsub();
  });

  it("re-reads to the fallback when storage is cleared in another tab (key null)", () => {
    const store = createPersistedStore<string>(KEY, (raw) => (raw ? JSON.parse(raw) : "fallback"), "fallback");
    store.set("saved");
    const listener = vi.fn();
    const unsub = store.subscribe(listener);

    localStorage.clear();
    storageEvent(null, null);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toBe("fallback");
    unsub();
  });

  it("attaches one window listener and removes it with the last subscriber", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const store = createPersistedStore(KEY, (raw) => raw, null);
    const storageCalls = (spy: typeof add) => spy.mock.calls.filter(([type]) => type === "storage");

    const a = store.subscribe(() => {});
    const b = store.subscribe(() => {});
    expect(storageCalls(add)).toHaveLength(1);
    a();
    expect(storageCalls(remove)).toHaveLength(0);
    b();
    expect(storageCalls(remove)).toHaveLength(1);
  });
});
