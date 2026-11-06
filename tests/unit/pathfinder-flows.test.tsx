import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { ChordCompass } from "@/components/chords/chord-compass";
import { PathfinderPage } from "@/components/pathfinder/pathfinder-page";
import { TapNeck } from "@/components/pathfinder/tap-neck";
import { DEFAULT_STATE, getKeyState, updateKeyState } from "@/lib/key-state/store";
import { useChordHighlight } from "@/lib/pathfinder/hooks";
import { EMPTY_FRETS, EMPTY_STATE, PATHFINDER_KEY, parsePathfinder } from "@/lib/pathfinder/state";
import { pathfinderStore } from "@/lib/pathfinder/store";
import { STANDARD_OFFSETS, TUNING_PRESETS } from "@/lib/theory/tuning";
import { tuningStore } from "@/lib/tuning/tuning-store";

vi.mock("next/navigation", () => ({ usePathname: () => "/pathfinder/" }));

const AM7 = [5, 7, 5, 5, 5, 5];
const button = (name: string | RegExp) => screen.getByRole("button", { name });
const lockAm7 = (over = {}) =>
  act(() => pathfinderStore.set({ frets: AM7, lock: { frets: AM7, key: "C", tuning: [0, 0, 0, 0, 0, 0], createdLink: true, ...over } }));

describe("Pathfinder flows", () => {
  beforeEach(() =>
    act(() => {
      pathfinderStore.set(EMPTY_STATE);
      updateKeyState(DEFAULT_STATE);
      tuningStore.set(STANDARD_OFFSETS);
    }),
  );

  it("goes from notes to keys and back without losing the chord", () => {
    act(() => pathfinderStore.set({ frets: AM7, lock: null }));
    render(<PathfinderPage />);
    fireEvent.click(button("Build path"));
    fireEvent.click(button("Edit chord"));
    expect(screen.getByTestId("chord-name").textContent).toBe("Am7");
    expect(pathfinderStore.get().frets).toEqual(AM7);
  });

  it("updates the keys after the chord is edited", () => {
    act(() => pathfinderStore.set({ frets: AM7, lock: null }));
    render(<PathfinderPage />);
    fireEvent.click(button("Build path"));
    fireEvent.click(button("Edit chord"));
    fireEvent.click(button("6th string, fret 5"));
    fireEvent.click(button("Build path"));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/fits/);
  });

  it("locks in a near-fit chord", () => {
    act(() => pathfinderStore.set({ frets: [null, 3, 2, 3, 4, null], lock: null }));
    render(<PathfinderPage />);
    fireEvent.click(button("Build path"));
    fireEvent.click(button(/^F major/));
    fireEvent.click(button("Lock in F major"));
    expect(screen.getByText("V in F major · all tools linked")).toBeTruthy();
    expect(getKeyState()).toMatchObject({ linked: true, shared: "F" });
  });

  it("locks in a chord with no role in the key", () => {
    act(() => pathfinderStore.set({ frets: [8, 4, 0, null, null, null], lock: null })); // C C♯ D
    render(<PathfinderPage />);
    fireEvent.click(button("Build path"));
    fireEvent.click(screen.getByRole("button", { name: /^Lock in/ }));
    expect(screen.getByText(/^In .+ major · all tools linked$/)).toBeTruthy();
  });

  it("shows the lock after a remount, like a reload", () => {
    lockAm7();
    const first = render(<PathfinderPage />);
    first.unmount();
    render(<PathfinderPage />);
    expect(screen.getByText("Locked in")).toBeTruthy();
  });

  it("writes the lock to storage", () => {
    act(() => pathfinderStore.set({ frets: AM7, lock: null }));
    render(<PathfinderPage />);
    fireEvent.click(button("Build path"));
    fireEvent.click(button("Lock in C major"));
    expect(parsePathfinder(localStorage.getItem(PATHFINDER_KEY)).lock).toMatchObject({ key: "C" });
  });

  it("renames, not moves, a chord being built when the tuning changes", () => {
    act(() => pathfinderStore.set({ frets: AM7, lock: null }));
    render(<PathfinderPage />);
    act(() => tuningStore.set(TUNING_PRESETS.find((p) => p.id === "drop-d")!.offsets));
    expect(pathfinderStore.get().frets).toEqual(AM7);
    expect(screen.getByTestId("chord-name").textContent).not.toBe("Am7");
  });

  it("moves a locked chord's notes when the tuning changes, keeping its name", () => {
    lockAm7();
    act(() => updateKeyState({ ...DEFAULT_STATE, linked: true, shared: "C" }));
    render(<PathfinderPage />);
    act(() => tuningStore.set(TUNING_PRESETS.find((p) => p.id === "drop-d")!.offsets));
    expect(screen.getByText("Am7")).toBeTruthy();
    expect(pathfinderStore.get().lock!.frets).toEqual(AM7);
  });

  it("offers no Build path from a note doubled in octaves", () => {
    act(() => pathfinderStore.set({ frets: [5, null, null, null, null, 5], lock: null }));
    render(<PathfinderPage />);
    expect((button("Build path") as HTMLButtonElement).disabled).toBe(true);
  });

  it("falls back to Build if a tuning change leaves one pitch class", () => {
    // E and B on adjacent strings become one pitch class if a retune lines them up: here, frets stay and notes merge.
    act(() => pathfinderStore.set({ frets: [0, 0, null, null, null, null], lock: null }));
    render(<PathfinderPage />);
    fireEvent.click(button("Build path"));
    act(() => tuningStore.set([1, -4, 0, 0, 0, 0]));
    expect(screen.queryByRole("button", { name: "Edit chord" })).toBeNull();
    expect(screen.getByTestId("chord-name")).toBeTruthy();
  });
});

describe("useChordHighlight", () => {
  beforeEach(() =>
    act(() => {
      pathfinderStore.set(EMPTY_STATE);
      updateKeyState(DEFAULT_STATE);
      tuningStore.set(STANDARD_OFFSETS);
    }),
  );

  it("is null with nothing locked", () => {
    expect(renderHook(() => useChordHighlight("chords")).result.current).toBeNull();
  });

  it("follows each tool's own key once unlinked", () => {
    lockAm7();
    act(() => updateKeyState({ linked: false, shared: "C", tools: { circle: "C", chords: "E", scales: "G" } }));
    const chords = renderHook(() => useChordHighlight("chords")).result.current!;
    const scales = renderHook(() => useChordHighlight("scales")).result.current!;
    expect(chords.name).toBe("C♯m7");
    expect(chords.rings[0]).toEqual({ string: 0, fret: 9 });
    expect(scales.name).toBe("Em7");
    expect(scales.rings[0]).toEqual({ string: 0, fret: 0 }); // C → G is the shorter way, down 5
  });

  it("leaves silent strings out", () => {
    act(() =>
      pathfinderStore.set({
        frets: [null, 3, 2, 0, 1, 0],
        lock: { frets: [null, 3, 2, 0, 1, 0], key: "C", tuning: [0, 0, 0, 0, 0, 0], createdLink: true },
      }),
    );
    const { result } = renderHook(() => useChordHighlight("scales"));
    expect(result.current!.rings).toHaveLength(5);
  });

  it("names a chord with no common name by its notes", () => {
    const odd = [8, 4, 0, null, null, null];
    act(() => pathfinderStore.set({ frets: odd, lock: { frets: odd, key: "C", tuning: [0, 0, 0, 0, 0, 0], createdLink: true } }));
    expect(renderHook(() => useChordHighlight("chords")).result.current!.name).toBe("C · C♯ · D");
  });
});

describe("the compasses leave your choices alone", () => {
  beforeEach(() =>
    act(() => {
      pathfinderStore.set(EMPTY_STATE);
      updateKeyState(DEFAULT_STATE);
    }),
  );
  afterEach(() => act(() => updateKeyState(DEFAULT_STATE)));

  it("doesn't change the selected shape when a chord is locked", () => {
    const { container } = render(<ChordCompass />);
    const band = () => container.querySelector("[data-window-low]")!.getAttribute("data-window-low");
    const before = band();
    lockAm7();
    expect(band()).toBe(before);
    expect(container.querySelectorAll('section[aria-label="Whole neck"] [data-ring]')).toHaveLength(6);
  });

  it("keeps the rings when Major and Minor are switched", () => {
    lockAm7();
    const { container } = render(<ChordCompass />);
    fireEvent.click(screen.getAllByRole("button", { name: "Minor" })[0]);
    expect(container.querySelectorAll('section[aria-label="Whole neck"] [data-ring]')).toHaveLength(6);
    expect(screen.getByText("Your chord: Am7")).toBeTruthy();
  });
});

describe("TapNeck", () => {
  it("has a labelled button for every fret of every string", () => {
    render(<TapNeck frets={EMPTY_FRETS} offsets={STANDARD_OFFSETS} onTap={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(96);
    expect(button("1st string, fret 15")).toBeTruthy();
    expect(button("6th string, open")).toBeTruthy();
  });

  it("marks only placed notes, with the root in black", () => {
    const { container } = render(<TapNeck frets={AM7} offsets={STANDARD_OFFSETS} onTap={() => {}} />);
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(6);
    const fills = [...container.querySelectorAll("[data-note] circle")].map((c) => c.getAttribute("fill"));
    expect(fills.filter((f) => f === "#161718")).toHaveLength(2); // the two As
    expect(fills.filter((f) => f === "#DA4890")).toHaveLength(4);
  });

  it("reports the string and fret tapped", () => {
    const onTap = vi.fn();
    render(<TapNeck frets={EMPTY_FRETS} offsets={STANDARD_OFFSETS} onTap={onTap} />);
    fireEvent.click(button("3rd string, fret 9"));
    expect(onTap).toHaveBeenCalledWith(3, 9);
  });

  it("names the open strings in the tuning", () => {
    const { container } = render(<TapNeck frets={EMPTY_FRETS} offsets={TUNING_PRESETS.find((p) => p.id === "drop-d")!.offsets} onTap={() => {}} />);
    expect(container.querySelector("svg")!.textContent).toMatch(/^D/);
  });
});
