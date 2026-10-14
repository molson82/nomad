import { afterEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "@/lib/sw/register";

type FakeWorker = EventTarget & { state: string; postMessage: ReturnType<typeof vi.fn> };
type FakeRegistration = EventTarget & { waiting: FakeWorker | null; installing: FakeWorker | null };

function setup({ controller }: { controller: boolean }) {
  const registration: FakeRegistration = Object.assign(new EventTarget(), { waiting: null, installing: null });
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

afterEach(() => {
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
