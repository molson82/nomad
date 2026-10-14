import { describe, expect, it } from "vitest";
import { stepNote } from "@/lib/theory/notes";

describe("stepNote", () => {
  it("moves one semitone", () => {
    expect(stepNote("G", 1)).toBe("Ab");
    expect(stepNote("G", -1)).toBe("F#");
  });

  it("wraps between B and C", () => {
    expect(stepNote("B", 1)).toBe("C");
    expect(stepNote("C", -1)).toBe("B");
  });
});
