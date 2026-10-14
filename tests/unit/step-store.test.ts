import { describe, expect, it } from "vitest";
import { progressionSteps } from "@/lib/chords/progression-chords";
import { shapeNear } from "@/lib/chords/shape-store";
import { parseStep, validStep } from "@/lib/chords/step-store";
import { cagedShapes, cagedShapesFor } from "@/lib/theory/caged";

describe("parseStep", () => {
  it("reads an index or null", () => {
    expect(parseStep("2")).toBe(2);
    expect(parseStep("null")).toBeNull();
  });

  it.each([
    ["missing", null],
    ["bad json", "{oops"],
    ["negative", "-1"],
    ["fraction", "1.5"],
    ["a string", JSON.stringify("1")],
  ])("reads %s as no step", (_label, raw) => {
    expect(parseStep(raw)).toBeNull();
  });
});

describe("validStep", () => {
  const steps = progressionSteps("G", [1, 5, 7]);

  it("keeps a step that exists and has shapes", () => {
    expect(validStep(1, steps)).toBe(1);
  });

  it("drops a step past the end, e.g. after the progression was shortened", () => {
    expect(validStep(3, steps)).toBeNull();
    expect(validStep(0, [])).toBeNull();
  });

  it("drops a diminished step", () => {
    expect(validStep(2, steps)).toBeNull();
  });
});

describe("shapeNear", () => {
  it("stays in the region: G major E-shape (3–5) → D major C-shape (2–5)", () => {
    const from = cagedShapes("G").find((s) => s.name === "E")!;
    const d = progressionSteps("G", [5])[0];
    expect(shapeNear(cagedShapesFor(d.notes, "major"), from)).toBe("C");
  });
});
