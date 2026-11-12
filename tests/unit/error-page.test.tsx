import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("ErrorPage", () => {
  it("keeps Try again and Back to the Circle", () => {
    const reset = vi.fn();
    render(<ErrorPage reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Back to the Circle" })).toHaveAttribute("href", expect.stringMatching(/^\/circle\/?$/));
  });

  it("Reset saved settings removes every nomad: key and reloads to the Circle", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    localStorage.setItem("nomad:keys:v1", "{}");
    localStorage.setItem("nomad:circle:progression:v1", "{}");
    localStorage.setItem("other-app", "keep");

    render(<ErrorPage reset={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Reset saved settings" }));

    expect(localStorage.getItem("nomad:keys:v1")).toBeNull();
    expect(localStorage.getItem("nomad:circle:progression:v1")).toBeNull();
    expect(localStorage.getItem("other-app")).toBe("keep");
    expect(assign).toHaveBeenCalledWith("/circle/");
  });

  it("still reloads when storage is blocked", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    vi.stubGlobal("localStorage", {
      get length(): number {
        throw new Error("blocked");
      },
    });

    render(<ErrorPage reset={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Reset saved settings" }));

    expect(assign).toHaveBeenCalledWith("/circle/");
  });
});
