import { describe, expect, it } from "vitest";
import { FRET_WINDOWS, notesInWindow, parseWindow } from "@/lib/scales/window-store";
import { neckNotes } from "@/lib/theory/scales";
import { TUNING_PRESETS, openPitches } from "@/lib/theory/tuning";

describe("scale fret windows", () => {
  it("are five overlapping windows up the neck", () => {
    expect(FRET_WINDOWS).toEqual([[0, 4], [2, 6], [5, 9], [7, 11], [10, 15]]);
  });

  it.each([["3", 3], [null, 0], ["9", 0], ["x", 0], ["-1", 0]] as const)("reads %s as window %i", (raw, index) => {
    expect(parseWindow(raw)).toBe(index);
  });

  it("keeps only the notes inside a window", () => {
    const dadgad = openPitches(TUNING_PRESETS.find((p) => p.id === "dadgad")!.offsets);
    const notes = notesInWindow(neckNotes("D", { tonality: "major", type: "scale" }, dadgad), FRET_WINDOWS[0]);
    expect(notes.filter((n) => n.string === 0).map((n) => n.fret)).toEqual([0, 2, 4]);
  });
});
