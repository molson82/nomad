// Template: scripts/build-sw.mjs replaces both placeholders in out/sw.js after
// `next build`. Never registered in dev (see lib/sw/register.ts callers).
const PRECACHE = self.__PRECACHE__;
const VERSION = self.__VERSION__;
const CACHE = `nomad-${VERSION}`;

self.addEventListener("install", (event) => {
  // No skipWaiting here: a new version waits until the user taps "refresh".
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("nomad-") && key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // ignoreSearch: client-side navigation fetches /x/index.txt?_rsc=<id>.
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        return await fetch(request);
      } catch (error) {
        if (request.mode === "navigate") {
          const fallback = await cache.match("/circle/");
          if (fallback) return fallback;
        }
        throw error;
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
