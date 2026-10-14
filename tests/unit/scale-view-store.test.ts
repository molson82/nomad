import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW, parseView } from "@/lib/scales/view-store";

describe("parseView", () => {
  it("defaults to Major · Scale · E-shape", () => {
    expect(parseView(null)).toEqual({ tonality: "major", type: "scale", position: "E" });
    expect(DEFAULT_VIEW).toEqual({ tonality: "major", type: "scale", position: "E" });
  });

  it("reads a stored view", () => {
    expect(parseView(JSON.stringify({ tonality: "minor", type: "blues", position: "G" }))).toEqual({
      tonality: "minor",
      type: "blues",
      position: "G",
    });
  });

  it("falls back field by field", () => {
    expect(parseView(JSON.stringify({ tonality: "minor", type: "pentatonic", position: "X" }))).toEqual({
      tonality: "minor",
      type: "pentatonic",
      position: "E",
    });
    expect(parseView(JSON.stringify({ tonality: "dorian", type: "blues" }))).toEqual({ tonality: "major", type: "blues", position: "E" });
  });

  it.each([["bad json", "{oops"], ["an array", "[]"], ["a number", "3"]])("falls back entirely for %s", (_label, raw) => {
    expect(parseView(raw)).toEqual(DEFAULT_VIEW);
  });
});
