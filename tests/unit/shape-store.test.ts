import { describe, expect, it } from "vitest";
import { DEFAULT_SHAPE, nearestShape, parseShape } from "@/lib/chords/shape-store";
import { cagedShapes, type CagedShape } from "@/lib/theory/caged";

describe("parseShape", () => {
  it("reads a stored shape name", () => {
    expect(parseShape(JSON.stringify("A"))).toBe("A");
  });

  it.each([
    ["missing", null],
    ["bad json", "{oops"],
    ["unknown name", JSON.stringify("X")],
    ["a number", "3"],
    ["lower case", JSON.stringify("e")],
  ])("falls back to the E-shape for %s", (_label, raw) => {
    expect(parseShape(raw)).toBe(DEFAULT_SHAPE);
    expect(DEFAULT_SHAPE).toBe("E");
  });
});

describe("nearestShape", () => {
  const g = cagedShapes("G"); // G 0–3 · E 3–5 · D 5–8 · C 7–10 · A 10–12

  it("picks the shape centred nearest the tapped fret", () => {
    expect(nearestShape(g, 0)).toBe("G");
    expect(nearestShape(g, 4)).toBe("E");
    expect(nearestShape(g, 10)).toBe("A"); // A centre 11 beats C centre 8.5
    expect(nearestShape(g, 15)).toBe("A");
  });

  it("breaks a tie toward the lower shape", () => {
    const shapes = [
      { name: "G", lowFret: 0, highFret: 4 },
      { name: "E", lowFret: 4, highFret: 8 },
    ] as CagedShape[];
    expect(nearestShape(shapes, 4)).toBe("G");
  });
});
