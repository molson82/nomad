import { describe, expect, it } from "vitest";
import { parseTriadSelection, resolveTriad, selectionFor } from "@/lib/chords/triad-store";
import { triad } from "@/lib/theory/fretboard";
import { NOTES } from "@/lib/theory/notes";
import { pitchClassOf } from "@/lib/theory/spelling";
import { INVERSIONS, STRING_SETS, triadsOn } from "@/lib/theory/triads";
import { STANDARD_OFFSETS, TUNING_PRESETS, openPitches } from "@/lib/theory/tuning";

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
    expect(list(3, openPitches(STANDARD_OFFSETS))).toContain("root 7-7-5");
  });
  it("names the inversion from the lowest sounding note when strings cross", () => {
    // 6th up 4 (G♯2), 5th down 5 (E2): C major frets 4-3-2 on 6–5–4 sounds C3 G2 E3, so G is the bass.
    const crossed = triadsOn(triad("C"), "major", openPitches([4, -5, 0, 0, 0, 0]), 0);
    expect(crossed.find((t) => t.frets.join("-") === "4-3-2")!.inversion).toBe("second");
  });
  it.each([
    [[4, -5, 0, 0, 0, 0]],
    [[0, 0, 0, 0, -4, 0]],
  ])("labels every triad by its lowest pitch in custom tuning %j", (offsets) => {
    const open = openPitches(offsets);
    let checked = 0;
    for (const name of NOTES) {
      for (const quality of ["major", "minor"] as const) {
        // triad(root, "minor") is the relative minor; spell the chord from its own root.
        const chord = triad(name, quality);
        for (const set of STRING_SETS) {
          for (const t of triadsOn(chord, quality, open, set)) {
            const sounding = t.frets.map((fret, i) => open[set + i] + fret);
            const lowest = sounding.indexOf(Math.min(...sounding));
            const tone = chord.findIndex((n) => pitchClassOf(n) === ((sounding[lowest] % 12) + 12) % 12);
            expect(t.inversion).toBe(INVERSIONS[tone]);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("resolveTriad", () => {
  const all = triadsOn(d, "major", dadgad, 0);
  it("keeps the inversion and picks the nearest window", () => {
    expect(resolveTriad(all, { set: 0, inversion: "first", centre: 6, frets: null })!.frets).toEqual([4, 5, 7]);
    expect(resolveTriad(all, { set: 0, inversion: "first", centre: null, frets: null })!.frets).toEqual([4, 0, 0]);
  });
  it("falls back to the lowest triad, or null", () => {
    expect(resolveTriad(all.filter((t) => t.inversion !== "second"), { set: 0, inversion: "second", centre: 5, frets: null })!.frets).toEqual([0, 0, 4]);
    expect(resolveTriad([], { set: 2, inversion: "root", centre: null, frets: null })).toBeNull();
  });
  it("records a triad's selection", () => {
    expect(selectionFor(all[2])).toEqual({ set: 0, inversion: "first", centre: 5.5, frets: [4, 5, 7] });
  });

  it("tells apart two triads of one inversion that share a centre", () => {
    const c = triadsOn(triad("C"), "major", openPitches([-5, -5, 1, 0, 0, 0]), 0);
    const target = c.find((t) => t.frets.join("-") === "1-3-1")!;
    expect(c.some((t) => t.frets.join("-") === "1-0-4")).toBe(true);
    expect(resolveTriad(c, selectionFor(target))!.frets).toEqual([1, 3, 1]);
  });
  it.each([null, "{x", JSON.stringify({ set: 9, inversion: "root", centre: null })])("reads %s as the default", (raw) => {
    expect(parseTriadSelection(raw)).toEqual({ set: 2, inversion: "root", centre: null, frets: null });
  });

  it("reads a stored selection with or without frets", () => {
    expect(parseTriadSelection(JSON.stringify({ set: 0, inversion: "first", centre: 5.5, frets: [4, 5, 7] })).frets).toEqual([4, 5, 7]);
    expect(parseTriadSelection(JSON.stringify({ set: 0, inversion: "first", centre: 5.5 })).frets).toBeNull();
  });
});
