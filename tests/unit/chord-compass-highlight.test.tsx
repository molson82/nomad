import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ChordCompass } from "@/components/chords/chord-compass";
import { ScaleCompass } from "@/components/scales/scale-compass";
import { DEFAULT_STATE, updateKeyState } from "@/lib/key-state/store";
import { EMPTY_STATE } from "@/lib/pathfinder/state";
import { pathfinderStore } from "@/lib/pathfinder/store";
import type { Note } from "@/lib/theory/notes";
import { STANDARD_OFFSETS, TUNING_PRESETS } from "@/lib/theory/tuning";
import { tuningStore } from "@/lib/tuning/tuning-store";

vi.mock("next/navigation", () => ({ usePathname: () => "/chords/" }));

const AM7 = [5, 7, 5, 5, 5, 5];
const lockAm7 = () => pathfinderStore.set({ frets: AM7, lock: { frets: AM7, key: "C", tuning: [0, 0, 0, 0, 0, 0], createdLink: true } });
const linkedOn = (shared: Note) =>
  updateKeyState({ linked: true, shared, tools: { circle: "C", chords: "C", scales: "C" } });
const neckRings = (container: HTMLElement) => [...container.querySelectorAll('section[aria-label="Whole neck"] [data-ring]')];
const lowStringFret = (container: HTMLElement) =>
  neckRings(container).find((r) => r.getAttribute("data-string") === "0")!.getAttribute("data-fret");

describe.each([
  ["Chord Compass", ChordCompass],
  ["Scale Compass", ScaleCompass],
])("%s highlight", (_name, Compass) => {
  afterEach(() => {
    act(() => {
      pathfinderStore.set(EMPTY_STATE);
      updateKeyState(DEFAULT_STATE);
      tuningStore.set(STANDARD_OFFSETS);
    });
  });

  it("is unchanged with nothing locked", () => {
    const { container } = render(<Compass />);
    expect(container.querySelector("[data-ring]")).toBeNull();
    expect(screen.queryByText(/Your chord/)).toBeNull();
  });

  it("rings the locked chord and names it", () => {
    lockAm7();
    linkedOn("C");
    const { container } = render(<Compass />);
    expect(neckRings(container)).toHaveLength(6);
    expect(screen.getByText("Your chord: Am7")).toBeTruthy();
  });

  it("moves with the key", () => {
    lockAm7();
    linkedOn("C");
    const { container } = render(<Compass />);
    act(() => linkedOn("E"));
    expect(lowStringFret(container)).toBe("9");
    expect(screen.getByText("Your chord: C♯m7")).toBeTruthy();
  });

  it("stays after unlinking", () => {
    lockAm7();
    linkedOn("C");
    const { container } = render(<Compass />);
    act(() => updateKeyState({ linked: false, shared: "C", tools: { circle: "C", chords: "C", scales: "C" } }));
    expect(neckRings(container)).toHaveLength(6);
  });

  it("still shows in a tuning without CAGED shapes", () => {
    lockAm7();
    linkedOn("C");
    tuningStore.set(TUNING_PRESETS.find((p) => p.id === "dadgad")!.offsets);
    const { container } = render(<Compass />);
    expect(neckRings(container)).toHaveLength(6);
  });
});
