import { describe, expect, it } from "vitest";
import { cagedShapes } from "@/lib/theory/caged";
import { chordTones } from "@/lib/theory/fretboard";
import { positions, neckNotes } from "@/lib/theory/scales";
import { TUNING_PRESETS, isUniform, openPitches } from "@/lib/theory/tuning";

const open = (id: string) => openPitches(TUNING_PRESETS.find((p) => p.id === id)!.offsets);
const frets = (shape: { tones: { string: number; fret: number }[] }) =>
  [0, 1, 2, 3, 4, 5].map((s) => shape.tones.find((t) => t.string === s)?.fret ?? null);

describe("theory in other tunings", () => {
  it("slides every CAGED shape up a fret for half step down", () => {
    const e = cagedShapes("G", "major", open("half-down")).find((s) => s.name === "E")!;
    expect(frets(e)).toEqual([4, 6, 6, 5, 4, 4]);
  });

  it("slides scale positions up a fret for half step down", () => {
    const e = positions("G", { tonality: "major", type: "scale" }, open("half-down")).find((p) => p.letter === "E")!;
    expect([e.lowFret, e.highFret]).toEqual([3, 6]); // standard E position is frets 2–5
  });

  it("puts D major's notes on DADGAD's low D string", () => {
    const low = neckNotes("D", { tonality: "major", type: "scale" }, open("dadgad")).filter((n) => n.string === 0);
    expect(low.map((n) => `${n.fret}:${n.label}`)).toEqual(["0:1", "2:2", "4:3", "5:4", "7:5", "9:6", "11:7", "12:1", "14:2"]);
  });

  it("leaves standard tuning exactly as before", () => {
    expect(cagedShapes("G", "major", open("standard"))).toEqual(cagedShapes("G", "major"));
  });

  it.each(TUNING_PRESETS.map((p) => [p.name, p.offsets] as const))("needs only the pitch class of each open string: %s", (_, offsets) => {
    const absolute = openPitches(offsets);
    const classes = absolute.map((p) => p % 12);
    const major = { tonality: "major", type: "scale" } as const;
    if (isUniform(offsets)) {
      // CAGED shapes and positions are only used in uniform tunings.
      expect(cagedShapes("A", "minor", absolute)).toEqual(cagedShapes("A", "minor", classes));
      expect(positions("E", major, absolute)).toEqual(positions("E", major, classes));
    }
    expect(neckNotes("Bb", major, absolute)).toEqual(neckNotes("Bb", major, classes));
    expect(chordTones("D", "major", absolute)).toEqual(chordTones("D", "major", classes));
  });
});
