import { describe, expect, it } from "vitest";
import { parseTriadSelection, resolveTriad, selectionFor } from "@/lib/chords/triad-store";
import { TUNING, triad } from "@/lib/theory/fretboard";
import { triadsOn } from "@/lib/theory/triads";
import { TUNING_PRESETS, openPitches } from "@/lib/theory/tuning";

const dadgad = openPitches(TUNING_PRESETS.find((p) => p.id === "dadgad")!.offsets);
const d = triad("D");
const list = (set: 0 | 1 | 2 | 3, open: readonly number[] = dadgad) =>
  triadsOn(d, "major", open, set).map((t) => `${t.inversion} ${t.frets.join("-")}`);

describe("triadsOn", () => {
  it("finds D major on DADGAD strings 4–3–2", () => {
    expect(list(2)).toEqual(["first 4-2-5", "second 7-7-9", "root 12-11-12"]);
  });
  it("allows either order above the bass: open 0-0-4 on strings 6–5–4", () => {
    expect(list(0)).toEqual(["root 0-0-4", "first 4-0-0", "first 4-5-7", "second 7-5-4"]);
  });
  it("labels roles low → high", () => {
    expect(triadsOn(d, "major", dadgad, 0)[0].tones.map((t) => t.role)).toEqual(["R", "5", "3"]);
  });
  it("returns nothing when three unison strings can't fit a triad in 4 frets", () => {
    expect(list(2, openPitches([0, 0, 0, -5, 3, 0]))).toEqual([]);
  });
  it("works in standard tuning: D on G 7, F♯ on B 7, A on E 5", () => {
    expect(list(3, TUNING)).toContain("root 7-7-5");
  });
});

describe("resolveTriad", () => {
  const all = triadsOn(d, "major", dadgad, 0);
  it("keeps the inversion and picks the nearest window", () => {
    expect(resolveTriad(all, { set: 0, inversion: "first", centre: 6 })!.frets).toEqual([4, 5, 7]);
    expect(resolveTriad(all, { set: 0, inversion: "first", centre: null })!.frets).toEqual([4, 0, 0]);
  });
  it("falls back to the lowest triad, or null", () => {
    expect(resolveTriad(all.filter((t) => t.inversion !== "second"), { set: 0, inversion: "second", centre: 5 })!.frets).toEqual([0, 0, 4]);
    expect(resolveTriad([], { set: 2, inversion: "root", centre: null })).toBeNull();
  });
  it("records a triad's selection", () => {
    expect(selectionFor(all[2])).toEqual({ set: 0, inversion: "first", centre: 5.5 });
  });
  it.each([null, "{x", JSON.stringify({ set: 9, inversion: "root", centre: null })])("reads %s as the default", (raw) => {
    expect(parseTriadSelection(raw)).toEqual({ set: 2, inversion: "root", centre: null });
  });
});
