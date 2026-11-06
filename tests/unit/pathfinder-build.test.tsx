import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { BuildScreen } from "@/components/pathfinder/build-screen";
import { DEFAULT_STATE, getKeyState, updateKeyState } from "@/lib/key-state/store";
import { EMPTY_STATE } from "@/lib/pathfinder/state";
import { pathfinderStore } from "@/lib/pathfinder/store";
import { STANDARD_OFFSETS, TUNING_PRESETS } from "@/lib/theory/tuning";
import { tuningStore } from "@/lib/tuning/tuning-store";

const cell = (string: string, fret: number) => screen.getByRole("button", { name: `${string} string, fret ${fret}` });
const title = () => screen.getByTestId("chord-name");
const buildAm7 = () => {
  fireEvent.click(cell("6th", 5));
  fireEvent.click(cell("5th", 7));
  fireEvent.click(cell("4th", 5));
  fireEvent.click(cell("3rd", 5));
  fireEvent.click(cell("2nd", 5));
  fireEvent.click(cell("1st", 5));
};

describe("BuildScreen", () => {
  beforeEach(() => act(() => pathfinderStore.set(EMPTY_STATE)));
  afterEach(() => act(() => updateKeyState(DEFAULT_STATE)));

  it("names the chord live as notes are placed", () => {
    render(<BuildScreen onBuild={() => {}} />);
    expect(screen.getByText("Find your sound")).toBeTruthy();
    fireEvent.click(cell("5th", 7));
    expect(title().textContent).toBe("E");
    expect(screen.getByText("A single note. Add more to name a chord.")).toBeTruthy();
    fireEvent.click(cell("6th", 5));
    expect(title().textContent).toBe("A5");
    expect(screen.getByText("Power chord. Build path works from here.")).toBeTruthy();
    fireEvent.click(cell("4th", 5));
    fireEvent.click(cell("3rd", 5));
    fireEvent.click(cell("2nd", 5));
    fireEvent.click(cell("1st", 5));
    expect(title().textContent).toBe("Am7");
    expect(screen.getByText("C6/A")).toBeTruthy();
    expect(screen.getByText("A · C · E · G")).toBeTruthy();
  });

  it("moves and removes a note on a string", () => {
    render(<BuildScreen onBuild={() => {}} />);
    fireEvent.click(cell("6th", 5));
    fireEvent.click(cell("6th", 7));
    expect(cell("6th", 5).getAttribute("aria-pressed")).toBe("false");
    expect(cell("6th", 7).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(cell("6th", 7));
    expect(cell("6th", 7).getAttribute("aria-pressed")).toBe("false");
  });

  it("places an open string", () => {
    render(<BuildScreen onBuild={() => {}} />);
    const open = screen.getByRole("button", { name: "6th string, open" });
    fireEvent.click(open);
    expect(open.getAttribute("aria-pressed")).toBe("true");
    expect(title().textContent).toBe("E");
  });

  it("enables Build path from two pitch classes, and Clear empties", () => {
    const onBuild = vi.fn();
    render(<BuildScreen onBuild={onBuild} />);
    const build = () => screen.getByRole("button", { name: "Build path" }) as HTMLButtonElement;
    expect(build().disabled).toBe(true);
    fireEvent.click(cell("6th", 5));
    expect(build().disabled).toBe(true);
    fireEvent.click(cell("5th", 7));
    expect(build().disabled).toBe(false);
    fireEvent.click(build());
    expect(onBuild).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("Find your sound")).toBeTruthy();
  });

  it("shows the notes when there is no name", () => {
    render(<BuildScreen onBuild={() => {}} />);
    fireEvent.click(cell("6th", 8));
    fireEvent.click(cell("5th", 4));
    fireEvent.click(cell("1st", 2));
    expect(title().textContent).toBe("C · C♯ · F♯");
    expect(screen.getByText("No common chord name, but you can still build a path.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Build path" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("ignores the app's key", () => {
    act(() => updateKeyState({ ...DEFAULT_STATE, linked: true, shared: "E" }));
    const before = getKeyState();
    render(<BuildScreen onBuild={() => {}} />);
    buildAm7();
    expect(title().textContent).toBe("Am7");
    expect(getKeyState()).toBe(before);
  });

  it("names the strings on the overview of a retuned neck", () => {
    act(() => tuningStore.set(TUNING_PRESETS.find((p) => p.id === "drop-d")!.offsets));
    const { container } = render(<BuildScreen onBuild={() => {}} />);
    expect(container.querySelectorAll("[data-string-name]")).toHaveLength(6);
    act(() => tuningStore.set(STANDARD_OFFSETS));
  });

  it("stacks the other names under the chord when there are several", () => {
    act(() => pathfinderStore.set({ frets: [null, 3, 4, 2, 4, null], lock: null })); // Cdim7
    render(<BuildScreen onBuild={() => {}} />);
    expect(screen.getByTestId("chord-title").className).toContain("flex-col");
    act(() => pathfinderStore.set({ frets: [5, 7, 5, 5, 5, 5], lock: null }));
    expect(screen.getByTestId("chord-title").className).not.toContain("flex-col");
  });

  it("restores a chord from the store", () => {
    act(() => pathfinderStore.set({ frets: [5, 7, 5, 5, 5, 5], lock: null }));
    render(<BuildScreen onBuild={() => {}} />);
    expect(title().textContent).toBe("Am7");
  });
});
