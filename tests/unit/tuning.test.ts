import { describe, expect, it } from "vitest";
import { TUNING_PRESETS, isStandard, isUniform, openPitches, parseTuning, presetFor, tuningName, withStringStep } from "@/lib/theory/tuning";

const preset = (id: string) => TUNING_PRESETS.find((p) => p.id === id)!.offsets;

describe("tuning", () => {
  it("spells every preset's open strings low → high", () => {
    expect(TUNING_PRESETS.every((p) => tuningName(p.offsets) === p.name)).toBe(true);
    expect(TUNING_PRESETS.map((p) => `${p.name}: ${openPitches(p.offsets).join(",")}`)).toEqual([
      "Standard: 4,9,2,7,11,4", "Half step down: 3,8,1,6,10,3", "Whole step down: 2,7,0,5,9,2", "Drop D: 2,9,2,7,11,4",
      "DADGAD: 2,9,2,7,9,2", "Open G: 2,7,2,7,11,2", "Open D: 2,9,2,6,9,2", "Open C: 0,7,0,7,0,4", "FACGCE: 5,9,0,7,0,4",
    ]);
  });

  it("names a custom tuning by its notes", () => {
    expect(tuningName([-2, 0, 0, 0, 0, -2])).toBe("D A D G B D");
    expect(tuningName(preset("half-down"))).toBe("Half step down");
    expect(presetFor([-2, 0, 0, 0, 0, -2])).toBeNull();
  });

  it("knows uniform from changed intervals", () => {
    expect(isUniform(preset("standard"))).toBe(true);
    expect(isUniform(preset("whole-down"))).toBe(true);
    expect(isUniform(preset("dadgad"))).toBe(false);
    expect(isStandard(preset("half-down"))).toBe(false);
  });

  it("steps one string and stops at −5 and +4", () => {
    expect(withStringStep(preset("standard"), 0, -1)).toEqual([-1, 0, 0, 0, 0, 0]);
    expect(withStringStep([-5, 0, 0, 0, 0, 0], 0, -1)).toEqual([-5, 0, 0, 0, 0, 0]);
    expect(withStringStep([0, 0, 0, 0, 0, 4], 5, 1)).toEqual([0, 0, 0, 0, 0, 4]);
  });

  it.each([null, "{oops", "[0,0,0]", "[0,0,0,0,0,9]", "[0,0,0,0,0,1.5]", JSON.stringify("dadgad")])("reads %s as standard", (raw) => {
    expect(parseTuning(raw)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("reads a stored tuning", () => {
    expect(parseTuning("[-2,0,0,0,-2,-2]")).toEqual([-2, 0, 0, 0, -2, -2]);
  });
});
