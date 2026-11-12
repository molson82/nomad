import { describe, expect, it } from "vitest";
import { TUNING_PRESETS, isStandard, isUniform, openPitches, parseTuning, presetFor, tuningName, withStringStep } from "@/lib/theory/tuning";

const preset = (id: string) => TUNING_PRESETS.find((p) => p.id === id)!.offsets;

describe("tuning", () => {
  it("gives every preset's open strings as absolute pitches, low → high", () => {
    expect(TUNING_PRESETS.every((p) => tuningName(p.offsets) === p.name)).toBe(true);
    expect(TUNING_PRESETS.map((p) => `${p.name}: ${openPitches(p.offsets).join(",")}`)).toEqual([
      "Standard: 40,45,50,55,59,64", "Half step down: 39,44,49,54,58,63", "Whole step down: 38,43,48,53,57,62",
      "Drop D: 38,45,50,55,59,64", "DADGAD: 38,45,50,55,57,62", "Open G: 38,43,50,55,59,62", "Open D: 38,45,50,54,57,62",
      "Open C: 36,43,48,55,60,64", "FACGCE: 41,45,48,55,60,64",
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
