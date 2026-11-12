import { afterEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "@/lib/sw/register";

type FakeWorker = EventTarget & { state: string; postMessage: ReturnType<typeof vi.fn> };
type FakeRegistration = EventTarget & {
  waiting: FakeWorker | null;
  installing: FakeWorker | null;
  update: ReturnType<typeof vi.fn>;
};

function setup({ controller }: { controller: boolean }) {
  const registration: FakeRegistration = Object.assign(new EventTarget(), {
    waiting: null,
    installing: null,
    update: vi.fn().mockResolvedValue(undefined),
  });
  const container = Object.assign(new EventTarget(), {
    controller: controller ? {} : null,
    register: vi.fn().mockResolvedValue(registration),
  });
  Object.defineProperty(navigator, "serviceWorker", { value: container, configurable: true });
  return { registration, container };
}

function newWorker(): FakeWorker {
  return Object.assign(new EventTarget(), { state: "installing", postMessage: vi.fn() });
}

function finishInstall(registration: FakeRegistration, worker: FakeWorker) {
  registration.installing = worker;
  registration.dispatchEvent(new Event("updatefound"));
  worker.state = "installed";
  worker.dispatchEvent(new Event("statechange"));
}

// registerServiceWorker listens on document for good; drop those listeners between tests.
const documentListeners: [string, EventListenerOrEventListenerObject][] = [];
const addDocumentListener = document.addEventListener.bind(document);
document.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject) => {
  documentListeners.push([type, listener]);
  addDocumentListener(type, listener);
}) as typeof document.addEventListener;

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

afterEach(() => {
  for (const [type, listener] of documentListeners.splice(0)) document.removeEventListener(type, listener);
  delete (document as { visibilityState?: unknown }).visibilityState;
  delete (navigator as { serviceWorker?: unknown }).serviceWorker;
  vi.restoreAllMocks();
});

describe("registerServiceWorker", () => {
  it("first install: no update pill and no reload, even though the controller changes", async () => {
    const { registration, container } = setup({ controller: false });
    const onUpdateReady = vi.fn();
    const reload = vi.fn();
    await registerServiceWorker(onUpdateReady, reload);

    finishInstall(registration, newWorker());
    container.dispatchEvent(new Event("controllerchange")); // clients.claim()

    expect(container.register).toHaveBeenCalledWith("/sw.js");
    expect(onUpdateReady).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("first install: no update pill even if the worker claims the page before its installed event is handled", async () => {
    const { registration, container } = setup({ controller: false });
    const onUpdateReady = vi.fn();
    await registerServiceWorker(onUpdateReady, vi.fn());

    const worker = newWorker();
    registration.installing = worker;
    registration.dispatchEvent(new Event("updatefound"));
    container.controller = {}; // clients.claim() got there first, as a slow browser can
    worker.state = "installed";
    worker.dispatchEvent(new Event("statechange"));

    expect(onUpdateReady).not.toHaveBeenCalled();
  });

  it("a new version is offered, and only applied when the user taps", async () => {
    const { registration, container } = setup({ controller: true });
    const onUpdateReady = vi.fn();
    const reload = vi.fn();
    await registerServiceWorker(onUpdateReady, reload);

    const worker = newWorker();
    finishInstall(registration, worker);
    expect(onUpdateReady).toHaveBeenCalledTimes(1);
    expect(worker.postMessage).not.toHaveBeenCalled();

    const apply = onUpdateReady.mock.calls[0][0] as () => void;
    apply();
    expect(worker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });

    container.dispatchEvent(new Event("controllerchange"));
    container.dispatchEvent(new Event("controllerchange"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("another tab tapped refresh: this tab reloads once when the replacement takes control", async () => {
    const { registration, container } = setup({ controller: true });
    const onUpdateReady = vi.fn();
    const reload = vi.fn();
    await registerServiceWorker(onUpdateReady, reload);

    finishInstall(registration, newWorker());
    expect(onUpdateReady).toHaveBeenCalledTimes(1); // this tab never taps

    container.dispatchEvent(new Event("controllerchange"));
    container.dispatchEvent(new Event("controllerchange"));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("a tab first controlled by the initial install still reloads for a later replacement", async () => {
    const { registration, container } = setup({ controller: false });
    const reload = vi.fn();
    await registerServiceWorker(vi.fn(), reload);

    finishInstall(registration, newWorker());
    container.controller = {};
    container.dispatchEvent(new Event("controllerchange")); // clients.claim()
    expect(reload).not.toHaveBeenCalled();

    container.dispatchEvent(new Event("controllerchange")); // replacement, tapped elsewhere
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("checks for a new version when the page becomes visible again", async () => {
    const { registration } = setup({ controller: true });
    await registerServiceWorker(vi.fn(), vi.fn());
    expect(registration.update).not.toHaveBeenCalled();

    setVisibility("hidden");
    expect(registration.update).not.toHaveBeenCalled();

    setVisibility("visible");
    expect(registration.update).toHaveBeenCalledTimes(1);
  });

  it("swallows a failed update check (offline)", async () => {
    const { registration } = setup({ controller: true });
    const failure = Promise.reject(new TypeError("Failed to fetch"));
    const then = vi.spyOn(failure, "then"); // .catch(f) goes through .then(undefined, f)
    // A plain function: vi.fn() attaches its own .then to returned promises to track how they settle.
    let checks = 0;
    registration.update = (() => (checks++, failure)) as unknown as FakeRegistration["update"];
    await registerServiceWorker(vi.fn(), vi.fn());

    setVisibility("visible");
    expect(checks).toBe(1);
    expect(then.mock.calls.some(([, onRejected]) => typeof onRejected === "function")).toBe(true);
  });

  it("offers a worker that was already waiting at startup", async () => {
    const { registration } = setup({ controller: true });
    const waiting = newWorker();
    registration.waiting = waiting;
    const onUpdateReady = vi.fn();
    await registerServiceWorker(onUpdateReady, vi.fn());
    expect(onUpdateReady).toHaveBeenCalledTimes(1);
  });

  it("logs and carries on when registration fails", async () => {
    const { container } = setup({ controller: false });
    container.register.mockRejectedValue(new Error("nope"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(registerServiceWorker(vi.fn(), vi.fn())).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });

  it("does nothing where service workers are unsupported", async () => {
    await expect(registerServiceWorker(vi.fn(), vi.fn())).resolves.toBeUndefined();
  });
});
