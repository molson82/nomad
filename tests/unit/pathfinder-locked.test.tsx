import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PathfinderPage } from "@/components/pathfinder/pathfinder-page";
import { DEFAULT_STATE, getKeyState, updateKeyState } from "@/lib/key-state/store";
import type { Lock } from "@/lib/pathfinder/state";
import { EMPTY_STATE } from "@/lib/pathfinder/state";
import { pathfinderStore } from "@/lib/pathfinder/store";
import type { Note } from "@/lib/theory/notes";

vi.mock("next/navigation", () => ({ usePathname: () => "/pathfinder/" }));

const AM7 = [5, 7, 5, 5, 5, 5];
const tools = { circle: "C", chords: "C", scales: "C" } as const;
const locked = (over: Partial<Lock> = {}, linked = true, shared: Note = "C") =>
  act(() => {
    pathfinderStore.set({ frets: AM7, lock: { frets: AM7, key: "C", tuning: [0, 0, 0, 0, 0, 0], createdLink: true, ...over } });
    updateKeyState({ linked, shared, tools });
  });
const reset = () => fireEvent.click(screen.getByRole("button", { name: "Reset" }));

describe("the locked screen", () => {
  beforeEach(() => act(() => pathfinderStore.set(EMPTY_STATE)));
  afterEach(() => act(() => updateKeyState(DEFAULT_STATE)));

  it("shows the chord and key, with no way to edit", () => {
    locked();
    render(<PathfinderPage />);
    expect(screen.getByText("Locked in")).toBeTruthy();
    expect(screen.getByText("Am7")).toBeTruthy();
    expect(screen.getByText("vi in C major · all tools linked")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "6th string, fret 5" })).toBeNull();
    expect(screen.getByRole("link", { name: /Chord Compass/ }).getAttribute("href")).toMatch(/^\/chords\/?$/);
    expect(screen.getByRole("link", { name: /Scale Compass/ }).getAttribute("href")).toMatch(/^\/scales\/?$/);
  });

  it("follows the linked key", () => {
    locked({}, true, "E");
    const { container } = render(<PathfinderPage />);
    expect(screen.getByText("C♯m7")).toBeTruthy();
    expect(screen.getByText("vi in E major · all tools linked")).toBeTruthy();
    expect(container.querySelector('[data-kind="chosen"]')).toBeTruthy();
  });

  it("keeps the locked key once unlinked", () => {
    locked({}, false, "E");
    render(<PathfinderPage />);
    expect(screen.getByText("Am7")).toBeTruthy();
    expect(screen.getByText("vi in C major")).toBeTruthy();
  });

  it("resets to an empty build screen and unlinks a link it made", () => {
    locked();
    render(<PathfinderPage />);
    reset();
    expect(screen.getByText("Find your sound")).toBeTruthy();
    expect(getKeyState().linked).toBe(false);
    expect(pathfinderStore.get()).toEqual(EMPTY_STATE);
  });

  it("leaves a link the user made", () => {
    locked({ createdLink: false });
    render(<PathfinderPage />);
    reset();
    expect(getKeyState().linked).toBe(true);
  });

  it("starts a fresh chord after reset instead of jumping to the keys", () => {
    act(() => pathfinderStore.set({ frets: AM7, lock: null }));
    render(<PathfinderPage />);
    fireEvent.click(screen.getByRole("button", { name: "Build path" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock in C major" }));
    reset();
    fireEvent.click(screen.getByRole("button", { name: "6th string, fret 5" }));
    fireEvent.click(screen.getByRole("button", { name: "5th string, fret 7" }));
    expect(screen.getByTestId("chord-name").textContent).toBe("A5");
  });
});
