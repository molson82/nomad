import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PathfinderPage } from "@/components/pathfinder/pathfinder-page";
import { TryScreen } from "@/components/pathfinder/try-screen";
import { DEFAULT_STATE, updateKeyState } from "@/lib/key-state/store";
import { chordsToTry } from "@/lib/pathfinder/paths";
import { pathfinderStore } from "@/lib/pathfinder/store";

vi.mock("next/navigation", () => ({ usePathname: () => "/pathfinder/" }));

const AM7 = [5, 7, 5, 5, 5, 5];
const chords = chordsToTry("C", 6, 9, AM7);
const g = chords.find((c) => c.name === "G")!;
const chip = (name: RegExp) => screen.getByRole("button", { name });

describe("TryScreen", () => {
  beforeEach(() => act(() => pathfinderStore.set({ frets: AM7, lock: null })));
  afterEach(() => {
    vi.restoreAllMocks();
    act(() => updateKeyState(DEFAULT_STATE));
  });

  it("shows the chord with yours as a dashed outline", () => {
    const { container } = render(<TryScreen keyName="C" chord={g} onChord={() => {}} onBack={() => {}} />);
    expect(screen.getByText("Trying · in C major")).toBeTruthy();
    expect(screen.getByText("G, frets 5–8")).toBeTruthy();
    expect(screen.getByText("Your Am7")).toBeTruthy();
    const neck = container.querySelector('section[aria-label^="G on the neck"]')!;
    expect(neck.querySelectorAll("[data-ring][stroke-dasharray]")).toHaveLength(6);
    expect(neck.querySelectorAll('[data-kind="chosen"]')).toHaveLength(4);
    expect(chip(/^G\s*V$/).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByRole("button", { name: /Lock in/ })).toBeNull();
  });

  it("switches chords, and returns from the active chip or Back", () => {
    const onChord = vi.fn();
    const onBack = vi.fn();
    render(<TryScreen keyName="C" chord={g} onChord={onChord} onBack={onBack} />);
    fireEvent.click(chip(/^F\s*IV$/));
    expect(onChord).toHaveBeenCalledWith(expect.objectContaining({ name: "F" }));
    fireEvent.click(chip(/^G\s*V$/));
    fireEvent.click(screen.getByRole("button", { name: "Back to Am7" }));
    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it("spells your chord for the key", () => {
    act(() => pathfinderStore.set({ frets: [4, 6, 4, 4, 4, 4], lock: null }));
    const e = chordsToTry("B", 6, 8, [4, 6, 4, 4, 4, 4]).find((c) => c.name === "E")!;
    render(<TryScreen keyName="B" chord={e} onChord={() => {}} onBack={() => {}} />);
    expect(screen.getByRole("button", { name: "Back to G♯m7" })).toBeTruthy();
    expect(screen.getByText("Your G♯m7")).toBeTruthy();
  });

  it("saves nothing", () => {
    const set = vi.spyOn(pathfinderStore, "set");
    render(<TryScreen keyName="C" chord={g} onChord={() => {}} onBack={() => {}} />);
    fireEvent.click(chip(/^F\s*IV$/));
    expect(set).not.toHaveBeenCalled();
  });

  it("returns to the key cards with that key still selected", () => {
    render(<PathfinderPage />);
    fireEvent.click(screen.getByRole("button", { name: "Build path" }));
    fireEvent.click(screen.getByRole("button", { name: /^G major/ }));
    fireEvent.click(chip(/^D\s*V$/));
    expect(screen.getByText("Trying · in G major")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to Am7" }));
    expect(screen.getByRole("button", { name: /^G major/ }).getAttribute("aria-pressed")).toBe("true");
  });
});
