import { describe, expect, it } from "vitest";
import { DEFAULT_QUALITY, parseQuality, shapeForQuality } from "@/lib/chords/quality-store";
import { nearestShape } from "@/lib/chords/shape-store";
import { cagedShapes } from "@/lib/theory/caged";

const shape = (root: "G" | "C", quality: "major" | "minor", name: string) =>
  cagedShapes(root, quality).find((s) => s.name === name)!;

describe("parseQuality", () => {
  it("reads a stored quality", () => {
    expect(parseQuality(JSON.stringify("minor"))).toBe("minor");
    expect(parseQuality(JSON.stringify("major"))).toBe("major");
  });

  it.each([
    ["missing", null],
    ["bad json", "{oops"],
    ["unknown value", JSON.stringify("dim")],
    ["a number", "3"],
  ])("falls back to major for %s", (_label, raw) => {
    expect(parseQuality(raw)).toBe(DEFAULT_QUALITY);
    expect(DEFAULT_QUALITY).toBe("major");
  });
});

describe("shapeForQuality", () => {
  it("keeps the region: G major E-shape (3–5) becomes the E minor Dm-shape (2–5)", () => {
    expect(shapeForQuality("G", shape("G", "major", "E"), "minor")).toBe("D");
  });

  it("round-trips back to where it started", () => {
    expect(shapeForQuality("G", shape("G", "minor", "D"), "major")).toBe("E");
    expect(shapeForQuality("C", shape("C", "major", "E"), "minor")).toBe("D"); // C E-shape 8–10 → A minor Dm 7–10
    expect(shapeForQuality("C", shape("C", "minor", "D"), "major")).toBe("E");
  });

  it("lets a neck tap pick minor shapes by window", () => {
    const em = cagedShapes("G", "minor"); // Em 0–2 · Dm 2–5 · Cm 4–7 · Am 7–9 · Gm 9–12
    expect(nearestShape(em, 0)).toBe("E");
    expect(nearestShape(em, 8)).toBe("A");
    expect(nearestShape(em, 15)).toBe("G");
  });
});
