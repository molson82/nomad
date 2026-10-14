import { describe, expect, it } from "vitest";
import { formulaLine, positionText } from "@/lib/scales/position-text";
import { positions, type ScaleView } from "@/lib/theory/scales";

const MAJOR: ScaleView = { tonality: "major", type: "scale" };
const MIN_BLUES: ScaleView = { tonality: "minor", type: "blues" };

describe("positionText", () => {
  it("names full-scale positions by CAGED letter", () => {
    const e = positions("G", MAJOR).find((p) => p.letter === "E")!;
    expect(positionText(e, MAJOR)).toEqual({
      name: "E-shape position",
      shortName: "E-shape",
      title: "E-shape position",
      subtitle: "frets 2–5",
      chipLabel: "E",
      ariaLabel: "E-shape position, frets 2 to 5",
    });
  });

  it("names pentatonic and blues positions by box, with the letter in the title", () => {
    const box1 = positions("G", MIN_BLUES).find((p) => p.box === 1)!;
    expect(positionText(box1, MIN_BLUES)).toEqual({
      name: "Box 1",
      shortName: "Box 1",
      title: "Box 1 · G-shape",
      subtitle: "frets 0–3 · open position",
      chipLabel: "Box 1",
      ariaLabel: "Box 1, frets 0 to 3",
    });
  });
});

describe("formulaLine", () => {
  it("shows steps for full scales and degrees for pentatonic and blues", () => {
    expect(formulaLine("G", MAJOR)).toBe("W · W · H · W · W · W · H");
    expect(formulaLine("G", { tonality: "minor", type: "scale" })).toBe("W · H · W · W · H · W · W");
    expect(formulaLine("G", MIN_BLUES)).toBe("1 · ♭3 · 4 · ♭5 · 5 · ♭7");
  });
});
