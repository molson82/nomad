import { describe, expect, it } from "vitest";
import { formatNote, mod, pitchClassOf, spellAs } from "@/lib/theory/spelling";

describe("spelling", () => {
  it("mod is always non-negative", () => {
    expect(mod(-1, 12)).toBe(11);
    expect(mod(-0, 12)).toBe(0);
    expect(mod(25, 12)).toBe(1);
  });

  it("finds pitch classes, including across C", () => {
    expect(pitchClassOf({ letter: "C", accidental: 0 })).toBe(0);
    expect(pitchClassOf({ letter: "B", accidental: 1 })).toBe(0);
    expect(pitchClassOf({ letter: "C", accidental: -1 })).toBe(11);
    expect(pitchClassOf({ letter: "E", accidental: 1 })).toBe(5);
  });

  it("spells a pitch class on a given letter with the smallest accidental", () => {
    expect(spellAs("F", 6)).toEqual({ letter: "F", accidental: 1 });
    expect(spellAs("G", 6)).toEqual({ letter: "G", accidental: -1 });
    expect(spellAs("E", 5)).toEqual({ letter: "E", accidental: 1 });
    expect(spellAs("C", 11)).toEqual({ letter: "C", accidental: -1 });
  });

  it("formats with real sharp and flat glyphs", () => {
    expect(formatNote({ letter: "F", accidental: 1 })).toBe("F♯");
    expect(formatNote({ letter: "B", accidental: -1 })).toBe("B♭");
    expect(formatNote({ letter: "C", accidental: 0 })).toBe("C");
    expect(formatNote({ letter: "F", accidental: 2 })).toBe("F♯♯");
  });
});
