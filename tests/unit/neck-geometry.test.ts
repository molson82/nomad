import { describe, expect, it } from "vitest";
import { NECK, fretAtX, fretCenterX, fretLineX, stringY } from "@/lib/chords/neck-geometry";

describe("neck geometry", () => {
  it("lays frets left to right and puts high E on top", () => {
    expect(fretLineX(0)).toBe(NECK.nutX);
    expect(fretLineX(15)).toBeLessThanOrEqual(NECK.width);
    expect(fretCenterX(1)).toBeCloseTo(NECK.nutX + NECK.fretW / 2);
    expect(stringY(5)).toBeLessThan(stringY(0));
  });

  it("maps a tap back to the fret under it", () => {
    expect(fretAtX(fretCenterX(3))).toBe(3);
    expect(fretAtX(fretCenterX(12))).toBe(12);
    expect(fretAtX(fretLineX(4) - 1)).toBe(4);
    expect(fretAtX(fretLineX(4) + 1)).toBe(5);
  });

  it("clamps taps on the nut and past the last fret", () => {
    expect(fretAtX(5)).toBe(0);
    expect(fretAtX(-40)).toBe(0);
    expect(fretAtX(NECK.width + 100)).toBe(15);
  });
});
