import { describe, expect, it } from "vitest";
import { isTool, pageFromPath, toolFromPath } from "@/lib/tools";

describe("toolFromPath", () => {
  it.each([
    ["/circle/", "circle"],
    ["/chords", "chords"],
    ["/scales/", "scales"],
  ])("%s → %s", (path, tool) => {
    expect(toolFromPath(path)).toBe(tool);
  });

  it.each(["/", "/chordsx/", "/nowhere/", ""])("%s → null", (path) => {
    expect(toolFromPath(path)).toBeNull();
  });
});

describe("isTool", () => {
  it("accepts only the three tools", () => {
    expect(isTool("circle")).toBe(true);
    expect(isTool("Circle")).toBe(false);
    expect(isTool(null)).toBe(false);
  });
});

describe("pageFromPath", () => {
  it("knows the Tuning page but keeps it out of the key-holding tools", () => {
    expect(pageFromPath("/tuning/")).toBe("tuning");
    expect(pageFromPath("/chords/")).toBe("chords");
    expect(toolFromPath("/tuning/")).toBeNull();
    expect(isTool("tuning")).toBe(false);
  });
});
