import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { KeysScreen } from "@/components/pathfinder/keys-screen";
import { DEFAULT_STATE, getKeyState, updateKeyState } from "@/lib/key-state/store";
import { EMPTY_STATE } from "@/lib/pathfinder/state";
import { pathfinderStore } from "@/lib/pathfinder/store";
import type { Frets } from "@/lib/theory/chord-names";
import { STANDARD_OFFSETS, TUNING_PRESETS } from "@/lib/theory/tuning";
import { tuningStore } from "@/lib/tuning/tuning-store";

const AM7 = [5, 7, 5, 5, 5, 5];
const show = (frets: Frets, props: Partial<Parameters<typeof KeysScreen>[0]> = {}) => {
  act(() => pathfinderStore.set({ frets, lock: null }));
  return render(<KeysScreen onEdit={() => {}} onTry={() => {}} {...props} />);
};
const card = (name: RegExp) => screen.getByRole("button", { name });
const band = (container: HTMLElement) => container.querySelector("[data-window-low]");

describe("KeysScreen", () => {
  beforeEach(() => act(() => pathfinderStore.set(EMPTY_STATE)));
  afterEach(() => act(() => updateKeyState(DEFAULT_STATE)));

  it("lists the keys with the first selected", () => {
    show(AM7);
    expect(screen.getByRole("heading", { name: "Am7 fits 3 keys" })).toBeTruthy();
    expect(card(/^C major/).getAttribute("aria-pressed")).toBe("true");
    expect(card(/^G major/).getAttribute("aria-pressed")).toBe("false");
    expect(card(/^F major/).textContent).toContain("iii");
    const all = screen.getAllByRole("button", { pressed: false }).map((b) => b.textContent ?? "");
    expect(all.findIndex((t) => t.startsWith("G major"))).toBeLessThan(all.findIndex((t) => t.startsWith("F major")));
  });

  it("shows the selected key's path", () => {
    show(AM7);
    expect(card(/^C major/).textContent).toContain("A minor pentatonic · Box 1 · frets 5–8");
    expect(card(/^C major/).textContent).toContain("Has all your notes");
    expect(screen.getByText("G-shape position · frets 5–9")).toBeTruthy();
    expect(screen.getByText("Am on strings 3-2-1 · fret 5")).toBeTruthy();
    expect(screen.getByText("C major, A minor, both pentatonics, both blues")).toBeTruthy();
    expect(screen.getByText("Am – F – C – G")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lock in C major" })).toBeTruthy();
  });

  it("switches keys, collapsing the last one", () => {
    show(AM7);
    expect(card(/^G major/).textContent).toContain("E minor pentatonic · Box 3 · frets 4–8");
    expect(card(/^G major/).textContent).toContain("Misses your C");
    fireEvent.click(card(/^G major/));
    expect(card(/^G major/).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Lock in G major" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lock in C major" })).toBeNull();
  });

  it("previews on the neck, keeping your chord ringed and the mode across keys", () => {
    const { container } = show(AM7);
    expect(container.querySelectorAll("[data-ring]")).toHaveLength(6);
    expect(band(container)!.getAttribute("data-window-high")).toBe("8");

    fireEvent.click(screen.getByRole("button", { name: "Scale" }));
    expect(band(container)!.getAttribute("data-window-high")).toBe("9");
    expect(screen.getByText("G-shape position · frets 5–9", { selector: "[data-caption]" })).toBeTruthy();
    fireEvent.click(card(/^F major/));
    expect(screen.getByRole("button", { name: "Scale" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Triads" }));
    expect(band(container)).toBeNull();
    expect(container.querySelectorAll("[data-ring]")).toHaveLength(6);
    expect(container.querySelectorAll("[data-tone]")).toHaveLength(4); // Am and C share three of their notes
  });

  it("leaves no stray notes after showing triads", () => {
    const { container } = show(AM7);
    const pentatonic = container.querySelectorAll("[data-tone]").length;
    fireEvent.click(screen.getByRole("button", { name: "Triads" }));
    fireEvent.click(screen.getByRole("button", { name: "Pentatonic" }));
    expect(container.querySelectorAll("[data-tone]")).toHaveLength(pentatonic);
  });

  it("goes back to edit the chord", () => {
    const onEdit = vi.fn();
    show(AM7, { onEdit });
    fireEvent.click(screen.getByRole("button", { name: "Edit chord" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("leaves the key alone until Lock in", () => {
    const before = getKeyState();
    show(AM7);
    fireEvent.click(card(/^G major/));
    expect(getKeyState()).toBe(before);
    fireEvent.click(screen.getByRole("button", { name: "Lock in G major" }));
    expect(getKeyState()).toMatchObject({ linked: true, shared: "G" });
    expect(pathfinderStore.get().lock).toMatchObject({ key: "G", createdLink: true });
  });

  it("shows near fits for a chord in no key", () => {
    show([null, 3, 2, 3, 4, null]);
    expect(screen.getByRole("heading", { name: "C7♯9 fits no key: closest keys" })).toBeTruthy();
    expect(card(/^F major/).textContent).toContain("Your D♯ falls outside this key");
  });

  it("works for a chord with no name", () => {
    show([8, 4, null, null, null, 2]);
    expect(screen.getByRole("heading", { name: "C · C♯ · F♯ fits 1 key" })).toBeTruthy();
  });

  it("sends a chord to try", () => {
    const onTry = vi.fn();
    show(AM7, { onTry });
    fireEvent.click(screen.getByRole("button", { name: /^G\s*V$/ }));
    expect(onTry).toHaveBeenCalledWith("C", expect.objectContaining({ name: "G", role: "V" }));
  });

  it("disables a chord with no playable shape", () => {
    act(() => tuningStore.set([-5, 4, -1, -5, 2, -2]));
    show([null, null, null, 0, 8, null], { initialKey: "D" }); // D5 in key D
    const chips = screen.getAllByRole("button").filter((b) => /^(G|A|Bm|Em|F♯m)\s*(IV|V|vi|ii|iii)$/.test(b.textContent ?? ""));
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) expect((chip as HTMLButtonElement).disabled).toBe(true);
    act(() => tuningStore.set(STANDARD_OFFSETS));
  });

  it("names the strings of a retuned neck", () => {
    act(() => tuningStore.set(TUNING_PRESETS.find((p) => p.id === "drop-d")!.offsets));
    const { container } = show(AM7);
    const names = [...container.querySelectorAll("[data-string-name]")];
    expect(names.map((n) => n.textContent)).toEqual(["D", "A", "D", "G", "B", "E"]);
    expect(names[0].getAttribute("class")).toContain("fill-tuning-ink");
    act(() => tuningStore.set(STANDARD_OFFSETS));
  });

  it("opens on the key it's told to", () => {
    show(AM7, { initialKey: "G" });
    expect(card(/^G major/).getAttribute("aria-pressed")).toBe("true");
  });
});
