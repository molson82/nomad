// Offers the update pill only for a *replacement* worker (one installed while
// another already controls the page). The very first install also fires
// controllerchange, because sw.js calls clients.claim(), so reloading is gated
// on the user having tapped "refresh".
export async function registerServiceWorker(
  onUpdateReady: (apply: () => void) => void,
  reload: () => void = () => window.location.reload(),
): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const container = navigator.serviceWorker;

  let applying = false;
  container.addEventListener("controllerchange", () => {
    if (!applying) return;
    applying = false;
    reload();
  });

  const offer = (worker: ServiceWorker) =>
    onUpdateReady(() => {
      applying = true;
      worker.postMessage({ type: "SKIP_WAITING" });
    });

  try {
    const registration = await container.register("/sw.js");
    if (registration.waiting && container.controller) offer(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && container.controller) offer(worker);
      });
    });
  } catch (error) {
    console.error("Service worker registration failed; running online-only.", error);
  }
}
