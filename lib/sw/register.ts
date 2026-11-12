// Offers the update pill only for a *replacement* worker (one installed while
// another already controls the page). The very first install also fires
// controllerchange, because sw.js calls clients.claim(), so that one never
// reloads. A replacement only takes control after someone tapped "refresh" in
// some tab (SKIP_WAITING), and its activate deletes the old cache, so every
// tab that was already controlled reloads then, not just the one that tapped.
export async function registerServiceWorker(
  onUpdateReady: (apply: () => void) => void,
  reload: () => void = () => window.location.reload(),
): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const container = navigator.serviceWorker;

  let controlled = !!container.controller;
  let reloading = false;
  container.addEventListener("controllerchange", () => {
    if (controlled && !reloading) {
      reloading = true;
      reload();
    }
    controlled = true;
  });

  const offer = (worker: ServiceWorker) => onUpdateReady(() => worker.postMessage({ type: "SKIP_WAITING" }));

  try {
    const registration = await container.register("/sw.js");
    if (registration.waiting && container.controller) offer(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      // Asked now, not when installed: on a first install the worker can claim the page before that event is handled.
      const replacing = !!container.controller;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && replacing) offer(worker);
      });
    });
    // An installed PWA can stay open for days; look for a new version whenever it comes back.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") registration.update().catch(() => {}); // offline: try next time
    });
  } catch (error) {
    console.error("Service worker registration failed; running online-only.", error);
  }
}
