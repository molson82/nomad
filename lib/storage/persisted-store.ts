// A tiny localStorage-backed store read through useSyncExternalStore. Loaded
// lazily so the server render (no localStorage) never touches it; storage
// failures (Safari private mode) keep it working in memory.
export interface PersistedStore<T> {
  get(): T;
  getServer(): T;
  set(next: T): void;
  subscribe(listener: () => void): () => void;
}

export function createPersistedStore<T>(
  key: string,
  parse: (raw: string | null) => T,
  fallback: T,
): PersistedStore<T> {
  let state: T | undefined;
  const listeners = new Set<() => void>();

  function load(): T {
    try {
      return parse(localStorage.getItem(key));
    } catch {
      return fallback;
    }
  }

  // One listener per store, shared by every subscriber. A null key means another tab cleared storage.
  function onStorage(event: StorageEvent) {
    if (event.key === key) state = parse(event.newValue);
    else if (event.key === null) state = load();
    else return;
    listeners.forEach((listener) => listener());
  }

  return {
    get: () => (state ??= load()),
    getServer: () => fallback,
    set(next) {
      state = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage blocked: the change still applies for this session.
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
  };
}
