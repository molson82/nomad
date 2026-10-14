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
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;
        state = parse(event.newValue);
        listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
